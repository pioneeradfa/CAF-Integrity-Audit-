// ============================================================
// EMET CAF FOLDER INTEGRITY CHECKER - Core Types
// ============================================================

export type CAFType = 'COURSE' | 'OCT' | 'UNKNOWN';

export interface FileEntry {
  name: string;
  path: string;
  size: number;
  extension: string;
  parentFolder: string;
  relativePath: string;
  handle?: FileSystemFileHandle;
}

export interface FolderEntry {
  name: string;
  path: string;
  files: FileEntry[];
  subfolders: FolderEntry[];
  isEmpty: boolean;
  handle?: FileSystemDirectoryHandle;
}

export type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'INFO' | 'SKIP';

export interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  files?: FileEntry[];
}

export interface FolderAuditResult {
  folderName: string;
  standardName: string;
  exists: boolean;
  isEmpty: boolean;
  folderPath: string;
  checks: CheckItem[];
  issues: string[];
  files: FileEntry[];
  subfolders: string[];
  status: CheckStatus;
}

export interface AuditReport {
  cafType: CAFType;
  rootPath: string;
  rootFolderName: string;
  scanDate: string;
  totalFolders: number;
  foundFolders: number;
  missingFolders: number;
  totalFiles: number;
  folderResults: FolderAuditResult[];
  auditorComments: AuditorComment[];
  overallStatus: CheckStatus;
  summary: AuditSummary;
}

export interface AuditorComment {
  id: string;
  folderRef: string;
  text: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  editable: boolean;
  isEditing?: boolean;
}

export interface AuditSummary {
  passCount: number;
  failCount: number;
  warningCount: number;
  totalChecks: number;
  completionPercent: number;
}

export interface CAFFolderConfig {
  id: string;
  standardName: string;
  displayName: string;
  order: number;
  required: boolean;
  checks: CheckConfig[];
}

export interface CheckConfig {
  id: string;
  label: string;
  type: CheckType;
  params?: Record<string, unknown>;
}

export type CheckType =
  | 'has_files'
  | 'has_xlsx'
  | 'has_archive'
  | 'has_pdf'
  | 'min_count'
  | 'has_samples'
  | 'has_answer_key'
  | 'has_rubric'
  | 'has_hse'
  | 'has_syllabus_pair'
  | 'has_survey_files'
  | 'has_improvement_report'
  | 'custom';
