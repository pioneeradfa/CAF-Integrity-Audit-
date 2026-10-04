// ============================================================
// EMET CAF FOLDER INTEGRITY CHECKER - Audit Engine
// ============================================================

import type {
  FileEntry,
  FolderEntry,
  FolderAuditResult,
  AuditReport,
  AuditorComment,
  CheckItem,
  CheckStatus,
  CAFType,
  AuditSummary,
} from '../types/audit';
import {
  AUDIT_THRESHOLDS,
  FILE_KEYWORDS,
  detectCAFType,
  getFolderConfig,
  matchFolderToConfig,
} from '../config/cafConfig';

// ─── Utility helpers ───────────────────────────────────────
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[_\-\.]/g, ' ');
}

function hasKeyword(filename: string, keywords: readonly string[]): boolean {
  const norm = normalizeName(filename);
  return keywords.some((kw) => norm.includes(kw.toLowerCase()));
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isSmallFile(size: number): boolean {
  return size < AUDIT_THRESHOLDS.MIN_FILE_SIZE_BYTES;
}

// ─── Recursively scan a directory handle ──────────────────
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  rootFolderName: string,
  parentPath: string = ''
): Promise<FolderEntry> {
  const files: FileEntry[] = [];
  const subfolders: FolderEntry[] = [];
  const currentPath = parentPath ? `${parentPath}/${dirHandle.name}` : dirHandle.name;

  // Use entries() for broad compatibility
  const entries = await collectEntries(dirHandle);

  for (const [, entry] of entries) {
    if (entry.kind === 'file') {
      const fe = entry as FileSystemFileHandle;
      if (fe.name.startsWith('~') || fe.name === 'Thumbs.db' || fe.name.startsWith('.')) continue;
      try {
        const file = await fe.getFile();
        const name = fe.name;
        files.push({
          name,
          path: `${rootFolderName}/${currentPath}/${name}`,
          size: file.size,
          extension: getExtension(name),
          parentFolder: currentPath,
          relativePath: `${currentPath}/${name}`,
          handle: fe,
        });
      } catch {
        // skip unreadable files
      }
    } else if (entry.kind === 'directory') {
      const de = entry as FileSystemDirectoryHandle;
      const sub = await scanDirectory(de, rootFolderName, currentPath);
      subfolders.push(sub);
    }
  }

  const totalFiles = files.length + subfolders.reduce((acc, sf) => acc + countFiles(sf), 0);

  return {
    name: dirHandle.name,
    path: currentPath,
    files,
    subfolders,
    isEmpty: totalFiles === 0,
    handle: dirHandle,
  };
}

async function collectEntries(
  dirHandle: FileSystemDirectoryHandle
): Promise<[string, FileSystemHandle][]> {
  const result: [string, FileSystemHandle][] = [];
  try {
    for await (const entry of dirHandle.entries()) {
      result.push(entry);
    }
  } catch {
    // Fallback for older browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iter = (dirHandle as any).entries();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await iter.next();
      if (done) break;
      result.push(value as [string, FileSystemHandle]);
    }
  }
  return result;
}

function countFiles(folder: FolderEntry): number {
  return folder.files.length + folder.subfolders.reduce((acc, sf) => acc + countFiles(sf), 0);
}

function getAllFiles(folder: FolderEntry): FileEntry[] {
  const files = [...folder.files];
  for (const sf of folder.subfolders) {
    files.push(...getAllFiles(sf));
  }
  return files;
}

// ─── Individual Checks ─────────────────────────────────────

function checkHasFiles(files: FileEntry[]): CheckItem {
  const realFiles = files.filter((f) => f.size > 0);
  return {
    id: 'has_files',
    label: 'Files exist',
    status: realFiles.length > 0 ? 'PASS' : 'FAIL',
    detail: realFiles.length > 0 ? `${realFiles.length} file(s) found` : 'No files found',
    files: realFiles,
  };
}

function checkHasXlsx(files: FileEntry[]): CheckItem {
  const xlsxFiles = files.filter((f) => f.extension === 'xlsx' || f.extension === 'xls');
  return {
    id: 'has_xlsx',
    label: 'Excel (.xlsx) file exists',
    status: xlsxFiles.length > 0 ? 'PASS' : 'FAIL',
    detail: xlsxFiles.length > 0 ? `Found: ${xlsxFiles.map((f) => f.name).join(', ')}` : 'No .xlsx file found',
    files: xlsxFiles,
  };
}

function checkHasArchive(files: FileEntry[]): CheckItem {
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  const archives = files.filter((f) => archiveExts.includes(f.extension));
  return {
    id: 'has_archive',
    label: 'Archive file exists',
    status: archives.length > 0 ? 'PASS' : 'WARNING',
    detail: archives.length > 0 ? `Found: ${archives.map((f) => f.name).join(', ')}` : 'No archive file (.zip/.rar) found',
    files: archives,
  };
}

function checkHasPdf(files: FileEntry[]): CheckItem {
  const pdfs = files.filter((f) => f.extension === 'pdf');
  return {
    id: 'has_pdf',
    label: 'PDF file exists',
    status: pdfs.length > 0 ? 'PASS' : 'FAIL',
    detail: pdfs.length > 0 ? `Found: ${pdfs.length} PDF(s)` : 'No PDF file found',
    files: pdfs,
  };
}

function checkSamples(files: FileEntry[], label: string): CheckItem {
  const allNames = files.map((f) => normalizeName(f.name));
  const hasMin = allNames.some((n) => FILE_KEYWORDS.MIN_SAMPLE.some((kw) => n.includes(kw)));
  const hasAvg = allNames.some((n) => FILE_KEYWORDS.AVG_SAMPLE.some((kw) => n.includes(kw)));
  const hasMax = allNames.some((n) => FILE_KEYWORDS.MAX_SAMPLE.some((kw) => n.includes(kw)));

  const samplesFound = [hasMin ? 'Min' : null, hasAvg ? 'Avg' : null, hasMax ? 'Max' : null].filter(Boolean);
  const missing = [!hasMin ? 'Min' : null, !hasAvg ? 'Avg' : null, !hasMax ? 'Max' : null].filter(Boolean);

  let status: CheckStatus = 'FAIL';
  if (hasMin && hasAvg && hasMax) status = 'PASS';
  else if (samplesFound.length >= 2) status = 'WARNING';
  else if (files.length >= 3) status = 'WARNING';

  const detail =
    status === 'PASS'
      ? `Samples found: Min ✔, Avg ✔, Max ✔`
      : missing.length > 0
      ? `Missing samples: ${missing.join(', ')}`
      : `Could not confirm samples (Min, Avg, Max)`;

  return {
    id: 'has_samples',
    label,
    status,
    detail,
    files,
  };
}

function checkAnswerKey(files: FileEntry[], label: string): CheckItem {
  const answerFiles = files.filter((f) => hasKeyword(f.name, FILE_KEYWORDS.ANSWER_KEY));
  const found = answerFiles.length > 0;
  return {
    id: 'has_answer_key',
    label,
    status: found ? 'PASS' : 'FAIL',
    detail: found ? `Answer key found` : 'Answer key missing or corrupted',
    files: answerFiles,
  };
}

function checkRubric(files: FileEntry[]): CheckItem {
  const rubricFiles = files.filter(
    (f) => hasKeyword(f.name, FILE_KEYWORDS.RUBRIC) || hasKeyword(f.name, FILE_KEYWORDS.MANUAL)
  );
  return {
    id: 'has_rubric',
    label: 'Rubric/Grading scheme present',
    status: rubricFiles.length > 0 ? 'PASS' : 'FAIL',
    detail: rubricFiles.length > 0 ? `Rubric found: ${rubricFiles.map((f) => f.name).join(', ')}` : 'No rubric/lab manual found',
    files: rubricFiles,
  };
}

function checkHSE(files: FileEntry[], subFiles: FileEntry[]): CheckItem {
  const allFiles = [...files, ...subFiles];
  const hseFiles = allFiles.filter((f) => hasKeyword(f.name, FILE_KEYWORDS.HSE));
  return {
    id: 'has_hse',
    label: 'HSE forms present (ALL attempts)',
    status: hseFiles.length > 0 ? 'PASS' : 'FAIL',
    detail: hseFiles.length > 0 ? `HSE forms found: ${hseFiles.length}` : 'HSE forms missing in lab folder',
    files: hseFiles,
  };
}

function checkSyllabusPair(files: FileEntry[]): CheckItem {
  const syllabusFiles = files.filter((f) => hasKeyword(f.name, FILE_KEYWORDS.SYLLABUS));
  const hasCurrent = syllabusFiles.length >= 1;
  const hasPrev = syllabusFiles.length >= 2;
  let status: CheckStatus = 'FAIL';
  if (hasCurrent && hasPrev) status = 'PASS';
  else if (hasCurrent) status = 'WARNING';
  return {
    id: 'has_syllabus_pair',
    label: 'Syllabus (current + previous semester)',
    status,
    detail:
      status === 'PASS'
        ? 'Current and previous semester syllabi found'
        : hasCurrent
        ? 'Only current syllabus found; previous semester syllabus missing'
        : 'No syllabus files found',
    files: syllabusFiles,
  };
}

function checkSurveyFiles(files: FileEntry[]): CheckItem {
  const cloFiles = files.filter(
    (f) => (hasKeyword(f.name, FILE_KEYWORDS.CLO) || hasKeyword(f.name, FILE_KEYWORDS.SURVEY)) && f.extension === 'pdf'
  );
  const surveyFiles = files.filter(
    (f) =>
      (hasKeyword(f.name, FILE_KEYWORDS.SURVEY) || hasKeyword(f.name, FILE_KEYWORDS.CLO)) &&
      ['xlsx', 'xls', 'csv'].includes(f.extension)
  );
  const allSurvey = [...new Set([...cloFiles, ...surveyFiles])];

  let status: CheckStatus = 'FAIL';
  if (cloFiles.length > 0 && surveyFiles.length > 0) status = 'PASS';
  else if (cloFiles.length > 0 || surveyFiles.length > 0) status = 'WARNING';

  return {
    id: 'has_survey_files',
    label: 'Survey files (CLO PDF + Excel/CSV)',
    status,
    detail:
      status === 'PASS'
        ? `CLO statistics PDF and survey data found`
        : `Missing: ${cloFiles.length === 0 ? 'CLO statistics PDF ' : ''}${surveyFiles.length === 0 ? 'Survey Excel/CSV' : ''}`,
    files: allSurvey,
  };
}

function checkImprovementReport(files: FileEntry[]): CheckItem {
  const irFiles = files.filter((f) => hasKeyword(f.name, FILE_KEYWORDS.IMPROVEMENT));
  return {
    id: 'has_improvement_report',
    label: 'Improvement report present',
    status: irFiles.length > 0 ? 'PASS' : 'FAIL',
    detail:
      irFiles.length > 0
        ? `${irFiles.length} report(s) found (${irFiles.length > 1 ? 'Multiple CRN' : 'Single CRN'})`
        : 'Improvement report missing',
    files: irFiles,
  };
}

function checkMinCount(files: FileEntry[], subfolders: FolderEntry[], min: number): CheckItem {
  // Count subfolders if they exist (each subfolder = one assessment), otherwise count files
  const count = subfolders.length > 0 ? subfolders.length : files.length;
  return {
    id: 'min_count',
    label: `Minimum ${min} required`,
    status: count >= min ? 'PASS' : 'FAIL',
    detail:
      count >= min
        ? `${count} item(s) found (min: ${min})`
        : `Only ${count} found; minimum ${min} required`,
    files: files.slice(0, 30),
  };
}

// ─── Audit a single folder ─────────────────────────────────
export function auditFolder(folder: FolderEntry, cafType: CAFType): FolderAuditResult {
  const config = matchFolderToConfig(folder.name, getFolderConfig(cafType));
  const allFiles = getAllFiles(folder);
  const checks: CheckItem[] = [];
  const issues: string[] = [];

  if (!config) {
    return {
      folderName: folder.name,
      standardName: folder.name,
      exists: true,
      isEmpty: folder.isEmpty,
      folderPath: folder.path,
      checks: [
        {
          id: 'unknown_folder',
          label: 'Folder name check',
          status: 'WARNING',
          detail: `"${folder.name}" does not match any standard CAF folder name`,
          files: [],
        },
      ],
      issues: [`Folder "${folder.name}" does not match any standard folder name`],
      files: allFiles,
      subfolders: folder.subfolders.map((sf) => sf.name),
      status: 'WARNING',
    };
  }

  for (const checkConfig of config.checks) {
    let c: CheckItem;
    switch (checkConfig.type) {
      case 'has_files':
        c = checkHasFiles(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      case 'has_xlsx':
        c = checkHasXlsx(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      case 'has_archive':
        c = checkHasArchive(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status !== 'PASS') issues.push(c.detail);
        break;
      case 'has_pdf':
        c = checkHasPdf(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      case 'has_samples':
        c = checkSamples(allFiles, checkConfig.label);
        checks.push(c);
        if (c.status !== 'PASS') issues.push(c.detail);
        break;
      case 'has_answer_key':
        c = checkAnswerKey(allFiles, checkConfig.label);
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      case 'has_rubric':
        c = checkRubric(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      case 'has_hse': {
        const subFiles = folder.subfolders.flatMap(getAllFiles);
        c = checkHSE(folder.files, subFiles);
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      }
      case 'has_syllabus_pair':
        c = checkSyllabusPair(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status !== 'PASS') issues.push(c.detail);
        break;
      case 'has_survey_files':
        c = checkSurveyFiles(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status !== 'PASS') issues.push(c.detail);
        break;
      case 'has_improvement_report':
        c = checkImprovementReport(allFiles);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      case 'min_count': {
        const min = (checkConfig.params?.min as number) ?? 5;
        c = checkMinCount(allFiles, folder.subfolders, min);
        c.id = checkConfig.id;
        c.label = checkConfig.label;
        checks.push(c);
        if (c.status === 'FAIL') issues.push(c.detail);
        break;
      }
    }
  }

  // Flag tiny/empty files
  const tinyFiles = allFiles.filter((f) => isSmallFile(f.size) && f.size < 100);
  if (tinyFiles.length > 0) {
    issues.push(`${tinyFiles.length} potentially empty/corrupted file(s) detected`);
  }

  const hasFailures = checks.some((c) => c.status === 'FAIL');
  const hasWarnings = checks.some((c) => c.status === 'WARNING');
  let status: CheckStatus = 'PASS';
  if (hasFailures) status = 'FAIL';
  else if (hasWarnings || folder.isEmpty) status = 'WARNING';

  return {
    folderName: folder.name,
    standardName: config.standardName,
    exists: true,
    isEmpty: folder.isEmpty,
    folderPath: folder.path,
    checks,
    issues,
    files: allFiles,
    subfolders: folder.subfolders.map((sf) => sf.name),
    status,
  };
}

// ─── Generate human-like auditor comments ─────────────────
function generateAuditorComments(folderResults: FolderAuditResult[]): AuditorComment[] {
  const comments: AuditorComment[] = [];
  let id = 1;

  const missing = folderResults.filter((r) => !r.exists);
  if (missing.length > 0) {
    comments.push({
      id: `c${id++}`,
      folderRef: 'GENERAL',
      text: `Missing required CAF folders: ${missing.map((f) => f.standardName).join(', ')}`,
      severity: 'ERROR',
      editable: true,
    });
  }

  const emptyFolders = folderResults.filter((r) => r.exists && r.isEmpty);
  if (emptyFolders.length > 0) {
    comments.push({
      id: `c${id++}`,
      folderRef: 'GENERAL',
      text: `Empty folder(s) detected — no files found: ${emptyFolders.map((f) => f.folderName).join(', ')}`,
      severity: 'ERROR',
      editable: true,
    });
  }

  for (const result of folderResults) {
    if (!result.exists || result.status === 'PASS') continue;

    for (const check of result.checks) {
      if (check.status === 'PASS') continue;

      const severity = check.status === 'FAIL' ? 'ERROR' : 'WARNING';
      let text = '';

      if (check.id === 'has_banner' || check.id === 'has_overall') {
        text = `Banner Grade or Overall Final Grade file is missing in "${result.folderName}"`;
      } else if (check.id === 'has_xlsx') {
        text = `CAF Excel (.xlsx) file is missing in "${result.folderName}"`;
      } else if (check.id === 'has_archive' || check.id === 'bb_extraction') {
        text = `Missing BB extraction archive (.zip/.rar) in "${result.folderName}"`;
      } else if (check.id.includes('samples') || check.id.includes('sample')) {
        text = `Samples for ${result.folderName} are missing (Min, Avg, Max)`;
      } else if (check.id.includes('answer')) {
        text = `Answer key is missing or corrupted in "${result.folderName}"`;
      } else if (check.id.includes('rubric') || check.id.includes('manual')) {
        text = `Project and Lab manual/handout or rubric is missing in "${result.folderName}"`;
      } else if (check.id.includes('hse')) {
        text = `HSE forms are missing in lab folder "${result.folderName}"`;
      } else if (check.id.includes('syllabus')) {
        text = check.status === 'WARNING'
          ? `Previous semester syllabus is missing in "${result.folderName}"`
          : `Syllabus files not found in "${result.folderName}"`;
      } else if (check.id.includes('survey') || check.id.includes('clo')) {
        text = `CLO statistics PDF or survey attempt data (Excel/CSV) is missing in "${result.folderName}"`;
      } else if (check.id.includes('improvement')) {
        text = `Improvement report is missing in "${result.folderName}"`;
      } else if (check.id.includes('attendance')) {
        text = `Attendance files are missing in "${result.folderName}"`;
      } else if (check.id.includes('count')) {
        text = `Insufficient count: ${check.detail} in "${result.folderName}"`;
      } else {
        text = `${check.label}: ${check.detail} — Folder: "${result.folderName}"`;
      }

      if (text) {
        comments.push({ id: `c${id++}`, folderRef: result.folderName, text, severity, editable: true });
      }
    }
  }

  if (comments.length === 0) {
    comments.push({
      id: `c${id++}`,
      folderRef: 'GENERAL',
      text: 'CAF folder structure and content appear complete. No major issues detected. Acceptable — no action required.',
      severity: 'INFO',
      editable: true,
    });
  }

  return comments;
}

// ─── Main audit runner ─────────────────────────────────────
export async function runAudit(
  rootHandle: FileSystemDirectoryHandle,
  overrideCAFType?: CAFType
): Promise<AuditReport> {
  const rootFolderName = rootHandle.name;
  const scanDate = new Date().toLocaleString();

  // Collect top-level folders
  const entries = await collectEntries(rootHandle);
  const topFolderNames: string[] = [];
  const topFolderHandles: FileSystemDirectoryHandle[] = [];

  for (const [, entry] of entries) {
    if (entry.kind === 'directory') {
      topFolderNames.push(entry.name);
      topFolderHandles.push(entry as FileSystemDirectoryHandle);
    }
  }

  // Sort alphabetically
  const zipped = topFolderNames.map((n, i) => ({ name: n, handle: topFolderHandles[i] }));
  zipped.sort((a, b) => a.name.localeCompare(b.name));

  // Detect CAF type
  const cafType = overrideCAFType ?? detectCAFType(topFolderNames);
  const folderConfig = getFolderConfig(cafType);

  // Scan all top-level folders
  const scannedFolders: FolderEntry[] = [];
  for (const { handle } of zipped) {
    const fe = await scanDirectory(handle, rootFolderName, rootFolderName);
    scannedFolders.push(fe);
  }

  // Match against config
  const folderResults: FolderAuditResult[] = [];
  const matchedFolderNames = new Set<string>();

  for (const config of folderConfig) {
    const found = scannedFolders.find((f) => {
      const upper = f.name.toUpperCase().trim();
      const configUpper = config.standardName.toUpperCase().trim();
      const stripped = upper.replace(/^\d+[_\s]+/, '').trim();
      const configStripped = configUpper.replace(/^\d+[_\s]+/, '').trim();
      return (
        upper === configUpper ||
        stripped === configStripped ||
        stripped.includes(configStripped) ||
        configStripped.includes(stripped)
      );
    });

    if (found) {
      matchedFolderNames.add(found.name);
      folderResults.push(auditFolder(found, cafType));
    } else {
      const cfgRequired = folderConfig.find((c) => c.standardName === config.standardName)?.required ?? true;
      folderResults.push({
        folderName: config.standardName,
        standardName: config.standardName,
        exists: false,
        isEmpty: true,
        folderPath: `${rootFolderName}/${config.standardName}`,
        checks: [
          {
            id: 'folder_missing',
            label: 'Folder exists',
            status: cfgRequired ? 'FAIL' : 'WARNING',
            detail: `Folder "${config.standardName}" not found`,
            files: [],
          },
        ],
        issues: [`Required folder "${config.standardName}" is missing`],
        files: [],
        subfolders: [],
        status: cfgRequired ? 'FAIL' : 'WARNING',
      });
    }
  }

  // Unmatched folders
  for (const folder of scannedFolders) {
    if (!matchedFolderNames.has(folder.name)) {
      folderResults.push(auditFolder(folder, cafType));
    }
  }

  const auditorComments = generateAuditorComments(folderResults);

  const allChecks = folderResults.flatMap((r) => r.checks);
  const passCount = allChecks.filter((c) => c.status === 'PASS').length;
  const failCount = allChecks.filter((c) => c.status === 'FAIL').length;
  const warningCount = allChecks.filter((c) => c.status === 'WARNING').length;
  const totalChecks = allChecks.length;
  const completionPercent = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;

  const summary: AuditSummary = { passCount, failCount, warningCount, totalChecks, completionPercent };

  const totalFiles = folderResults.reduce((acc, r) => acc + r.files.length, 0);
  const foundFolders = folderResults.filter((r) => r.exists).length;
  const missingFolders = folderResults.filter((r) => !r.exists).length;
  const overallStatus: CheckStatus = failCount > 0 ? 'FAIL' : warningCount > 0 ? 'WARNING' : 'PASS';

  return {
    cafType,
    rootPath: rootFolderName,
    rootFolderName,
    scanDate,
    totalFolders: folderConfig.length,
    foundFolders,
    missingFolders,
    totalFiles,
    folderResults,
    auditorComments,
    overallStatus,
    summary,
  };
}
