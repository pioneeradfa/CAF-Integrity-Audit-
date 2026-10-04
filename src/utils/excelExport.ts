// ============================================================
// EMET CAF FOLDER INTEGRITY CHECKER - Excel Export
// ============================================================

import ExcelJS from 'exceljs';
import type { AuditReport, FolderAuditResult, AuditorComment } from '../types/audit';

// ─── Color palette (mild, professional) ───────────────────
const COLORS = {
  HEADER_BG: 'FF2C3E6B',       // Dark navy blue
  HEADER_FONT: 'FFFFFFFF',     // White
  PASS_BG: 'FFD6EAD7',         // Soft green
  PASS_FONT: 'FF1E6B2E',       // Dark green
  FAIL_BG: 'FFFDE0DC',         // Soft red
  FAIL_FONT: 'FFB71C1C',       // Dark red
  WARNING_BG: 'FFFFF8E1',      // Soft yellow
  WARNING_FONT: 'FFF57F17',    // Dark amber
  INFO_BG: 'FFE3F2FD',         // Soft blue
  INFO_FONT: 'FF1565C0',       // Dark blue
  SUBHEADER_BG: 'FFE8EDF5',    // Light steel blue
  LINK_BG: 'FFFFF3CD',         // Soft gold
  LINK_FONT: 'FF7B5800',       // Dark amber
  WHITE: 'FFFFFFFF',
  LIGHT_GRAY: 'FFF5F5F5',
  ROW_ALT: 'FFFFFEF7',
  FOLDER_FOUND: 'FFE8F5E9',
  FOLDER_MISSING: 'FFFDE0DC',
  BORDER_COLOR: 'FFBDBDBD',
  TITLE_BG: 'FF1A3A6E',
  ACCENT_BG: 'FF3D5A99',
};

function applyHeaderStyle(cell: ExcelJS.Cell, bgColor: string = COLORS.HEADER_BG, fontColor: string = COLORS.HEADER_FONT) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  cell.font = { bold: true, color: { argb: fontColor }, size: 11 };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
    left: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
    right: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
  };
}

function applyDataCell(cell: ExcelJS.Cell, bgColor?: string, fontColor?: string) {
  if (bgColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  }
  if (fontColor) {
    cell.font = { color: { argb: fontColor }, size: 10 };
  }
  cell.alignment = { vertical: 'middle', wrapText: true };
  cell.border = {
    top: { style: 'hair', color: { argb: COLORS.BORDER_COLOR } },
    bottom: { style: 'hair', color: { argb: COLORS.BORDER_COLOR } },
    left: { style: 'hair', color: { argb: COLORS.BORDER_COLOR } },
    right: { style: 'hair', color: { argb: COLORS.BORDER_COLOR } },
  };
}

function statusColors(status: string): { bg: string; font: string } {
  switch (status) {
    case 'PASS': return { bg: COLORS.PASS_BG, font: COLORS.PASS_FONT };
    case 'FAIL': return { bg: COLORS.FAIL_BG, font: COLORS.FAIL_FONT };
    case 'WARNING': return { bg: COLORS.WARNING_BG, font: COLORS.WARNING_FONT };
    default: return { bg: COLORS.INFO_BG, font: COLORS.INFO_FONT };
  }
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'PASS': return '✔ PASS';
    case 'FAIL': return '✘ FAIL';
    case 'WARNING': return '⚠ WARNING';
    default: return 'ℹ INFO';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeHyperlink(path: string, label: string): { text: string; hyperlink?: string } {
  if (!path || path.length === 0) return { text: label };
  // For local paths, use file:// protocol
  const filePath = path.startsWith('/') ? `file://${path}` : `file:///${path.replace(/\\/g, '/')}`;
  if (filePath.length < 256) {
    return { text: label, hyperlink: filePath };
  }
  return { text: label };
}

// ─── Sheet 1: Summary / Front Page ────────────────────────
function buildSummarySheet(ws: ExcelJS.Worksheet, report: AuditReport, sheetNames: string[]) {
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  // Title row
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '🗂 EMET CAF FOLDER INTEGRITY CHECKER';
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TITLE_BG } };
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.HEADER_FONT } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  // Subtitle row
  ws.mergeCells('A2:G2');
  const subCell = ws.getCell('A2');
  subCell.value = `CAF Type: ${report.cafType} | Folder: ${report.rootFolderName} | Scanned: ${report.scanDate}`;
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ACCENT_BG } };
  subCell.font = { size: 11, color: { argb: COLORS.HEADER_FONT } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  // Stats row
  ws.mergeCells('A3:G3');
  const statsCell = ws.getCell('A3');
  const { summary } = report;
  statsCell.value = `Total Checks: ${summary.totalChecks} | ✔ Pass: ${summary.passCount} | ✘ Fail: ${summary.failCount} | ⚠ Warnings: ${summary.warningCount} | Completion: ${summary.completionPercent}%`;
  statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUBHEADER_BG } };
  statsCell.font = { size: 11, bold: true, color: { argb: COLORS.HEADER_BG } };
  statsCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 20;

  // Column headers
  const headers = ['#', 'CAF Folder Name', 'Exists', 'Empty Check', 'Folder Name Check', 'Status', 'Open Folder →'];
  const colWidths = [5, 32, 12, 14, 22, 14, 18];
  ws.getRow(4).height = 24;
  headers.forEach((h, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
    ws.getColumn(i + 1).width = colWidths[i];
  });

  // Data rows
  report.folderResults.forEach((result, idx) => {
    const rowNum = idx + 5;
    const row = ws.getRow(rowNum);
    row.height = 20;

    const sColors = statusColors(result.status);
    const rowBg = idx % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY;

    // S/No
    const cellNo = row.getCell(1);
    cellNo.value = idx + 1;
    applyDataCell(cellNo, rowBg);
    cellNo.alignment = { horizontal: 'center', vertical: 'middle' };

    // Folder name
    const cellName = row.getCell(2);
    cellName.value = result.folderName;
    applyDataCell(cellName, result.exists ? rowBg : COLORS.FAIL_BG, result.exists ? undefined : COLORS.FAIL_FONT);

    // Exists
    const cellExists = row.getCell(3);
    cellExists.value = result.exists ? '✔ Found' : '✘ Missing';
    applyDataCell(cellExists, result.exists ? COLORS.PASS_BG : COLORS.FAIL_BG, result.exists ? COLORS.PASS_FONT : COLORS.FAIL_FONT);
    cellExists.alignment = { horizontal: 'center', vertical: 'middle' };

    // Empty
    const cellEmpty = row.getCell(4);
    cellEmpty.value = !result.exists ? 'N/A' : result.isEmpty ? '✘ EMPTY' : '✔ Has Files';
    applyDataCell(cellEmpty, !result.exists ? rowBg : result.isEmpty ? COLORS.FAIL_BG : COLORS.PASS_BG, !result.exists ? undefined : result.isEmpty ? COLORS.FAIL_FONT : COLORS.PASS_FONT);
    cellEmpty.alignment = { horizontal: 'center', vertical: 'middle' };

    // Name check
    const nameMatch = result.folderName.toLowerCase() === result.standardName.toLowerCase();
    const cellNameCheck = row.getCell(5);
    cellNameCheck.value = nameMatch ? '✔ Name OK' : '⚠ Check Name';
    applyDataCell(cellNameCheck, nameMatch ? COLORS.PASS_BG : COLORS.WARNING_BG, nameMatch ? COLORS.PASS_FONT : COLORS.WARNING_FONT);
    cellNameCheck.alignment = { horizontal: 'center', vertical: 'middle' };

    // Status
    const cellStatus = row.getCell(6);
    cellStatus.value = statusEmoji(result.status);
    applyDataCell(cellStatus, sColors.bg, sColors.font);
    cellStatus.font = { bold: true, color: { argb: sColors.font }, size: 10 };
    cellStatus.alignment = { horizontal: 'center', vertical: 'middle' };

    // Link to detail sheet
    const cellLink = row.getCell(7);
    const sheetIndex = sheetNames.indexOf(result.folderName.substring(0, 31));
    if (sheetIndex >= 0) {
      cellLink.value = { text: '📂 View Details →', hyperlink: `#'${sheetNames[sheetIndex]}'!A1` };
      cellLink.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LINK_BG } };
      cellLink.font = { color: { argb: COLORS.LINK_FONT }, bold: true, underline: true, size: 10 };
    } else {
      cellLink.value = result.exists ? '(No Sheet)' : 'Missing';
      applyDataCell(cellLink, rowBg);
    }
    cellLink.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

// ─── Sheet 2: Auditor Comments ─────────────────────────────
function buildCommentsSheet(ws: ExcelJS.Worksheet, comments: AuditorComment[]) {
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
  ws.mergeCells('A1:E1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '📝 AUDITOR COMMENTS & FEEDBACK';
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TITLE_BG } };
  titleCell.font = { bold: true, size: 14, color: { argb: COLORS.HEADER_FONT } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:E2');
  const noteCell = ws.getCell('A2');
  noteCell.value = 'Human-readable auditor observations. Edit as needed before submission.';
  noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUBHEADER_BG } };
  noteCell.font = { italic: true, size: 10, color: { argb: COLORS.HEADER_BG } };
  noteCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;

  const headers = ['#', 'Severity', 'Folder Reference', 'Auditor Comment', 'Action Required'];
  const colWidths = [5, 14, 26, 62, 24];
  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
    ws.getColumn(i + 1).width = colWidths[i];
  });
  ws.getRow(3).height = 22;

  comments.forEach((comment, idx) => {
    const rowNum = idx + 4;
    const row = ws.getRow(rowNum);
    row.height = 36;

    const sev = comment.severity;
    const sevColors =
      sev === 'ERROR' ? { bg: COLORS.FAIL_BG, font: COLORS.FAIL_FONT }
      : sev === 'WARNING' ? { bg: COLORS.WARNING_BG, font: COLORS.WARNING_FONT }
      : { bg: COLORS.INFO_BG, font: COLORS.INFO_FONT };
    const rowBg = idx % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY;

    const cellNo = row.getCell(1);
    cellNo.value = idx + 1;
    applyDataCell(cellNo, rowBg);
    cellNo.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellSev = row.getCell(2);
    cellSev.value = sev === 'ERROR' ? '🔴 ERROR' : sev === 'WARNING' ? '🟡 WARNING' : 'ℹ INFO';
    applyDataCell(cellSev, sevColors.bg, sevColors.font);
    cellSev.font = { bold: true, color: { argb: sevColors.font }, size: 10 };
    cellSev.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellRef = row.getCell(3);
    cellRef.value = comment.folderRef;
    applyDataCell(cellRef, rowBg);

    const cellText = row.getCell(4);
    cellText.value = comment.text;
    applyDataCell(cellText, rowBg);
    cellText.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    const cellAction = row.getCell(5);
    cellAction.value = sev === 'INFO' ? 'Acceptable — No Action' : 'Action Required';
    applyDataCell(cellAction, sevColors.bg, sevColors.font);
    cellAction.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

// ─── Sheet per folder: File listings ──────────────────────
function buildFolderSheet(ws: ExcelJS.Worksheet, result: FolderAuditResult, summarySheetName: string) {
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

  // Back link
  const backCell = ws.getCell('A1');
  backCell.value = { text: '← Back to Summary', hyperlink: `#'${summarySheetName}'!A1` };
  backCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LINK_BG } };
  backCell.font = { bold: true, color: { argb: COLORS.LINK_FONT }, underline: true, size: 11 };
  backCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(1).height = 22;
  ws.mergeCells('A1:F1');

  // Folder title
  ws.mergeCells('A2:F2');
  const titleCell = ws.getCell('A2');
  titleCell.value = `📁 ${result.folderName} — ${statusEmoji(result.status)}`;
  const sColors = statusColors(result.status);
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sColors.bg } };
  titleCell.font = { bold: true, size: 13, color: { argb: sColors.font } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 26;

  // Checklist sub-section header
  ws.mergeCells('A3:F3');
  const checkHeader = ws.getCell('A3');
  checkHeader.value = '✅ CHECKLIST RESULTS';
  checkHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUBHEADER_BG } };
  checkHeader.font = { bold: true, size: 11, color: { argb: COLORS.HEADER_BG } };
  checkHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 20;

  // Checklist headers
  const checklistHeaders = ['#', 'Check', 'Status', 'Details'];
  ws.getRow(4).height = 20;
  [5, 40, 14, 50].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  checklistHeaders.forEach((h, i) => {
    const cell = ws.getCell(4, i + 1);
    cell.value = h;
    applyHeaderStyle(cell, COLORS.ACCENT_BG);
  });

  let currentRow = 5;
  result.checks.forEach((check, idx) => {
    const row = ws.getRow(currentRow++);
    row.height = 20;
    const rowBg = idx % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY;
    const cs = statusColors(check.status);

    const c1 = row.getCell(1); c1.value = idx + 1; applyDataCell(c1, rowBg); c1.alignment = { horizontal: 'center', vertical: 'middle' };
    const c2 = row.getCell(2); c2.value = check.label; applyDataCell(c2, rowBg);
    const c3 = row.getCell(3); c3.value = statusEmoji(check.status); applyDataCell(c3, cs.bg, cs.font); c3.font = { bold: true, color: { argb: cs.font }, size: 10 }; c3.alignment = { horizontal: 'center', vertical: 'middle' };
    const c4 = row.getCell(4); c4.value = check.detail; applyDataCell(c4, rowBg);
  });

  // Spacer
  currentRow++;

  // Files section header
  ws.mergeCells(`A${currentRow}:F${currentRow}`);
  const fileHeader = ws.getCell(`A${currentRow}`);
  fileHeader.value = `📄 FILES IN THIS FOLDER (${result.files.length} files)`;
  fileHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUBHEADER_BG } };
  fileHeader.font = { bold: true, size: 11, color: { argb: COLORS.HEADER_BG } };
  fileHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(currentRow).height = 20;
  currentRow++;

  // Files table headers
  const fileHeaders = ['#', 'Folder', 'File Name', 'Size', 'File Link', 'Full Path'];
  const fileColWidths = [5, 28, 38, 10, 14, 55];
  fileHeaders.forEach((h, i) => {
    const cell = ws.getCell(currentRow, i + 1);
    cell.value = h;
    applyHeaderStyle(cell, COLORS.ACCENT_BG);
    ws.getColumn(i + 1).width = fileColWidths[i];
  });
  ws.getRow(currentRow).height = 20;
  currentRow++;

  if (result.files.length === 0) {
    ws.mergeCells(`A${currentRow}:F${currentRow}`);
    const emptyCell = ws.getCell(`A${currentRow}`);
    emptyCell.value = 'No files found in this folder';
    emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.FAIL_BG } };
    emptyCell.font = { color: { argb: COLORS.FAIL_FONT }, italic: true };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(currentRow).height = 18;
    return;
  }

  result.files.forEach((file, idx) => {
    const row = ws.getRow(currentRow++);
    row.height = 18;
    const rowBg = idx % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY;
    const isSmall = file.size < 1100;

    const c1 = row.getCell(1); c1.value = idx + 1; applyDataCell(c1, rowBg); c1.alignment = { horizontal: 'center', vertical: 'middle' };
    const c2 = row.getCell(2); c2.value = file.parentFolder; applyDataCell(c2, rowBg);
    const c3 = row.getCell(3); c3.value = file.name; applyDataCell(c3, rowBg);
    const c4 = row.getCell(4); c4.value = formatFileSize(file.size); applyDataCell(c4, isSmall ? COLORS.FAIL_BG : rowBg, isSmall ? COLORS.FAIL_FONT : undefined); c4.alignment = { horizontal: 'right', vertical: 'middle' };

    const c5 = row.getCell(5);
    const linkData = safeHyperlink(file.path, 'Open File');
    if (linkData.hyperlink) {
      c5.value = { text: linkData.text, hyperlink: linkData.hyperlink };
      c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LINK_BG } };
      c5.font = { color: { argb: COLORS.LINK_FONT }, underline: true, size: 10 };
    } else {
      c5.value = 'Path too long';
      applyDataCell(c5, COLORS.WARNING_BG, COLORS.WARNING_FONT);
    }
    c5.alignment = { horizontal: 'center', vertical: 'middle' };

    const c6 = row.getCell(6); c6.value = file.path; applyDataCell(c6, rowBg); c6.font = { size: 9, color: { argb: '88000000' } };
  });
}

// ─── Sheet: All Files Summary ──────────────────────────────
function buildAllFilesSheet(ws: ExcelJS.Worksheet, report: AuditReport) {
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '📋 ALL FILES — COMPLETE LISTING';
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TITLE_BG } };
  titleCell.font = { bold: true, size: 13, color: { argb: COLORS.HEADER_FONT } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const headers = ['#', 'CAF Folder', 'File Name', 'Extension', 'Size', 'File Link', 'Full Path'];
  const colWidths = [5, 28, 38, 10, 12, 14, 60];
  headers.forEach((h, i) => {
    const cell = ws.getCell(2, i + 1);
    cell.value = h;
    applyHeaderStyle(cell);
    ws.getColumn(i + 1).width = colWidths[i];
  });
  ws.getRow(2).height = 22;

  let globalIdx = 1;
  for (const result of report.folderResults) {
    for (const file of result.files) {
      const row = ws.getRow(globalIdx + 2);
      row.height = 18;
      const rowBg = globalIdx % 2 === 0 ? COLORS.WHITE : COLORS.LIGHT_GRAY;
      const isSmall = file.size < 1100;

      const c1 = row.getCell(1); c1.value = globalIdx; applyDataCell(c1, rowBg); c1.alignment = { horizontal: 'center', vertical: 'middle' };
      const c2 = row.getCell(2); c2.value = result.folderName; applyDataCell(c2, rowBg);
      const c3 = row.getCell(3); c3.value = file.name; applyDataCell(c3, rowBg);
      const c4 = row.getCell(4); c4.value = file.extension.toUpperCase(); applyDataCell(c4, rowBg); c4.alignment = { horizontal: 'center', vertical: 'middle' };
      const c5 = row.getCell(5); c5.value = formatFileSize(file.size); applyDataCell(c5, isSmall ? COLORS.FAIL_BG : rowBg, isSmall ? COLORS.FAIL_FONT : undefined); c5.alignment = { horizontal: 'right', vertical: 'middle' };

      const c6 = row.getCell(6);
      const linkData = safeHyperlink(file.path, 'Open');
      if (linkData.hyperlink) {
        c6.value = { text: 'Open File', hyperlink: linkData.hyperlink };
        c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LINK_BG } };
        c6.font = { color: { argb: COLORS.LINK_FONT }, underline: true, size: 10 };
      } else {
        c6.value = 'Path too long'; applyDataCell(c6, rowBg);
      }
      c6.alignment = { horizontal: 'center', vertical: 'middle' };

      const c7 = row.getCell(7); c7.value = file.path; applyDataCell(c7, rowBg); c7.font = { size: 9, color: { argb: '88000000' } };

      globalIdx++;
    }
  }
}

// ─── Main export function ──────────────────────────────────
export async function exportToExcel(report: AuditReport): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EMET CAF Integrity Checker';
  wb.created = new Date();
  wb.modified = new Date();

  // Sheet names (Excel has 31-char limit)
  const summarySheetName = 'CAF_Summary';
  const commentsSheetName = 'Auditor_Comments';
  const allFilesSheetName = 'All_Files';

  const folderSheetNames: string[] = report.folderResults
    .filter((r) => r.exists)
    .map((r) => r.folderName.substring(0, 31).replace(/[\[\]\\\/\?\*\:]/g, '_'));

  // Create worksheets
  const summaryWs = wb.addWorksheet(summarySheetName, { properties: { tabColor: { argb: COLORS.TITLE_BG } } });
  const commentsWs = wb.addWorksheet(commentsSheetName, { properties: { tabColor: { argb: COLORS.FAIL_BG } } });
  const allFilesWs = wb.addWorksheet(allFilesSheetName, { properties: { tabColor: { argb: COLORS.INFO_BG } } });

  // Build summary sheet
  buildSummarySheet(summaryWs, report, folderSheetNames);
  buildCommentsSheet(commentsWs, report.auditorComments);
  buildAllFilesSheet(allFilesWs, report);

  // Build per-folder sheets
  const existingFolderResults = report.folderResults.filter((r) => r.exists);
  for (let i = 0; i < existingFolderResults.length; i++) {
    const result = existingFolderResults[i];
    const sheetName = folderSheetNames[i];
    const ws = wb.addWorksheet(sheetName, {
      properties: {
        tabColor: {
          argb: result.status === 'PASS' ? COLORS.PASS_BG : result.status === 'FAIL' ? COLORS.FAIL_BG : COLORS.WARNING_BG,
        },
      },
    });
    buildFolderSheet(ws, result, summarySheetName);
  }

  // Save
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CAF_Audit_${report.rootFolderName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
