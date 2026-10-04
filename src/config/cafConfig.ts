// ============================================================
// EMET CAF FOLDER INTEGRITY CHECKER - Configurable Settings
// ============================================================
// This file is the single source of truth for all CAF audit rules.
// Modify here to update folder names, checks, and thresholds.

import type { CAFFolderConfig, CAFType } from '../types/audit';

// ─── Minimum Thresholds (configurable) ────────────────────
export const AUDIT_THRESHOLDS = {
  MIN_HWS: 5,
  MIN_QUIZZES: 5,
  MIN_LABS: 1,
  MIN_FILE_SIZE_BYTES: 1100, // Files smaller than this are flagged
  MAX_PATH_LENGTH: 256,
} as const;

// ─── Keywords for intelligent file detection ──────────────
export const FILE_KEYWORDS = {
  QUESTION: ['question', 'quiz', 'exam', 'test', 'hw', 'homework', 'assignment', 'q&a', 'q_a', 'problem'],
  ANSWER_KEY: ['answer', 'key', 'solution', 'sol', 'ans', 'marking', 'rubric'],
  MIN_SAMPLE: ['min', 'minimum', 'low', 'lowest', 'weak'],
  AVG_SAMPLE: ['avg', 'average', 'mid', 'median', 'mean'],
  MAX_SAMPLE: ['max', 'maximum', 'high', 'highest', 'best', 'top'],
  BANNER: ['banner', 'grade', 'grades', 'banner grade', 'banner_grade'],
  OVERALL: ['overall', 'final grade', 'final_grade', 'overall final', 'grade sheet'],
  CAF_EXCEL: ['caf', 'assessment', 'evaluation', 'form'],
  ARCHIVE: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  BB_EXTRACTION: ['bb', 'blackboard', 'extraction', 'export', 'gradebook', 'grade center'],
  SYLLABUS: ['syllabus', 'course outline', 'course plan', 'outline'],
  HSE: ['hse', 'health', 'safety', 'environment', 'risk', 'hazard'],
  CLO: ['clo', 'course learning', 'learning outcome', 'statistics'],
  SURVEY: ['survey', 'feedback', 'evaluation', 'response', 'attempt'],
  IMPROVEMENT: ['improvement', 'action plan', 'corrective', 'recommendation'],
  RUBRIC: ['rubric', 'grading', 'marking scheme', 'criteria', 'scoring'],
  MANUAL: ['manual', 'handout', 'procedure', 'instruction', 'guide', 'lab sheet'],
  ATTENDANCE: ['attendance', 'attend', 'sign', 'present', 'absence'],
} as const;

// ─── Course CAF Folder Configuration (13 folders) ────────
export const COURSE_FOLDERS: CAFFolderConfig[] = [
  {
    id: 'caf_sheets',
    standardName: '01_CAF Sheets',
    displayName: 'CAF Sheets',
    order: 1,
    required: true,
    checks: [
      { id: 'has_banner', label: 'Banner Grade file exists', type: 'has_files' },
      { id: 'has_overall', label: 'Overall Final Grade file exists', type: 'has_files' },
      { id: 'has_xlsx', label: 'CAF Excel (.xlsx) file exists', type: 'has_xlsx' },
    ],
  },
  {
    id: 'bb_extraction',
    standardName: '02_BlackBoard Extraction',
    displayName: 'BlackBoard Extraction',
    order: 2,
    required: true,
    checks: [
      { id: 'has_files', label: 'BB extraction files exist', type: 'has_files' },
      { id: 'has_archive', label: 'Archive file (.zip/.rar) exists', type: 'has_archive' },
    ],
  },
  {
    id: 'lecture_notes',
    standardName: '03_Lecture Notes',
    displayName: 'Lecture Notes',
    order: 3,
    required: true,
    checks: [
      { id: 'has_files', label: 'Lecture notes files available', type: 'has_files' },
    ],
  },
  {
    id: 'projects_hws',
    standardName: '04_Projects and HWs',
    displayName: 'Projects and HWs',
    order: 4,
    required: true,
    checks: [
      { id: 'hw_count', label: 'Minimum 5 HWs present', type: 'min_count', params: { min: 5, keyword: 'hw' } },
      { id: 'hw_samples', label: 'HW samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'hw_answer', label: 'HW answer keys present', type: 'has_answer_key' },
      { id: 'project_rubric', label: 'Project grading rubric present', type: 'has_rubric' },
    ],
  },
  {
    id: 'quizzes',
    standardName: '05_Quizzes',
    displayName: 'Quizzes',
    order: 5,
    required: true,
    checks: [
      { id: 'quiz_count', label: 'Minimum 5 quizzes present', type: 'min_count', params: { min: 5, keyword: 'quiz' } },
      { id: 'quiz_samples', label: 'Quiz samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'quiz_answer', label: 'Quiz answer keys present', type: 'has_answer_key' },
    ],
  },
  {
    id: 'labs_reports',
    standardName: '06_Labs and Reports',
    displayName: 'Labs and Reports',
    order: 6,
    required: true,
    checks: [
      { id: 'lab_files', label: 'Lab files exist', type: 'has_files' },
      { id: 'lab_samples', label: 'Lab samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'lab_rubric', label: 'Lab rubric present', type: 'has_rubric' },
      { id: 'lab_manual', label: 'Lab manual/handout present', type: 'has_files' },
      { id: 'hse_forms', label: 'HSE forms present (ALL attempts)', type: 'has_hse' },
    ],
  },
  {
    id: 'midterm',
    standardName: '07_Midterm exam',
    displayName: 'Midterm Exam',
    order: 7,
    required: true,
    checks: [
      { id: 'mid_files', label: 'Midterm files exist', type: 'has_files' },
      { id: 'mid_samples', label: 'Midterm samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'mid_answer', label: 'Midterm answer key present', type: 'has_answer_key' },
    ],
  },
  {
    id: 'final_exam',
    standardName: '08_Final Exam',
    displayName: 'Final Exam',
    order: 8,
    required: true,
    checks: [
      { id: 'final_files', label: 'Final exam files exist', type: 'has_files' },
      { id: 'final_samples', label: 'Final exam samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'final_answer', label: 'Final exam answer key present', type: 'has_answer_key' },
    ],
  },
  {
    id: 'syllabus',
    standardName: '09_Syllabus',
    displayName: 'Syllabus',
    order: 9,
    required: true,
    checks: [
      { id: 'current_syllabus', label: 'Current semester syllabus present', type: 'has_syllabus_pair' },
      { id: 'prev_syllabus', label: 'Previous semester syllabus present', type: 'has_syllabus_pair' },
    ],
  },
  {
    id: 'student_survey',
    standardName: '10_Student Course Survey',
    displayName: 'Student Course Survey',
    order: 10,
    required: true,
    checks: [
      { id: 'clo_pdf', label: 'CLO statistics PDF present', type: 'has_pdf' },
      { id: 'survey_excel', label: 'Survey attempts Excel/CSV present', type: 'has_survey_files' },
      { id: 'crn_data', label: 'CRN data verified (no wrong CRN)', type: 'has_survey_files' },
    ],
  },
  {
    id: 'improvement',
    standardName: '11_Improvement Report',
    displayName: 'Improvement Report',
    order: 11,
    required: true,
    checks: [
      { id: 'improvement_report', label: 'Improvement report(s) present', type: 'has_improvement_report' },
    ],
  },
  {
    id: 'supporting',
    standardName: '12_Supporting Materials',
    displayName: 'Supporting Materials',
    order: 12,
    required: false,
    checks: [
      { id: 'supporting_files', label: 'Supporting materials available', type: 'has_files' },
    ],
  },
  {
    id: 'attendance',
    standardName: '13_Students Attendance',
    displayName: 'Students Attendance',
    order: 13,
    required: true,
    checks: [
      { id: 'attendance_files', label: 'Attendance files present', type: 'has_files' },
    ],
  },
];

// ─── OCT CAF Folder Configuration (11 folders) ───────────
export const OCT_FOLDERS: CAFFolderConfig[] = [
  {
    id: 'caf_sheets_oct',
    standardName: '01_CAF SHEETS',
    displayName: 'CAF Sheets',
    order: 1,
    required: true,
    checks: [
      { id: 'has_banner', label: 'Banner Grade file exists', type: 'has_files' },
      { id: 'has_overall', label: 'Overall Final Grade file exists', type: 'has_files' },
      { id: 'has_xlsx', label: 'CAF Excel (.xlsx) file exists', type: 'has_xlsx' },
    ],
  },
  {
    id: 'bb_extraction_oct',
    standardName: '02_ BLACKBOARD EXTRACTION',
    displayName: 'Blackboard Extraction',
    order: 2,
    required: true,
    checks: [
      { id: 'has_files', label: 'BB extraction files exist', type: 'has_files' },
      { id: 'has_archive', label: 'Archive file (.zip/.rar) exists', type: 'has_archive' },
    ],
  },
  {
    id: 'lab_reports_oct',
    standardName: '03_LAB REPORTS',
    displayName: 'Lab Reports',
    order: 3,
    required: true,
    checks: [
      { id: 'lab_files', label: 'Lab report files exist', type: 'has_files' },
      { id: 'lab_samples', label: 'Lab samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'lab_rubric', label: 'Lab rubric present', type: 'has_rubric' },
      { id: 'hse_forms', label: 'HSE forms present (ALL attempts)', type: 'has_hse' },
    ],
  },
  {
    id: 'quizzes_oct',
    standardName: '04_QUIZZES',
    displayName: 'Quizzes',
    order: 4,
    required: true,
    checks: [
      { id: 'quiz_count', label: 'Minimum 5 quizzes present', type: 'min_count', params: { min: 5 } },
      { id: 'quiz_samples', label: 'Quiz samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'quiz_answer', label: 'Quiz answer keys present', type: 'has_answer_key' },
    ],
  },
  {
    id: 'project_oct',
    standardName: '05_PROJECT',
    displayName: 'Project',
    order: 5,
    required: true,
    checks: [
      { id: 'project_files', label: 'Project files exist', type: 'has_files' },
      { id: 'project_samples', label: 'Project samples present', type: 'has_samples' },
      { id: 'project_rubric', label: 'Project grading rubric present', type: 'has_rubric' },
    ],
  },
  {
    id: 'final_practical_oct',
    standardName: '06_FINAL PRACTICAL TEST',
    displayName: 'Final Practical Test',
    order: 6,
    required: true,
    checks: [
      { id: 'practical_files', label: 'Practical test files exist', type: 'has_files' },
      { id: 'practical_samples', label: 'Samples (Min, Avg, Max) present', type: 'has_samples' },
      { id: 'practical_rubric', label: 'Rubric present', type: 'has_rubric' },
    ],
  },
  {
    id: 'syllabus_oct',
    standardName: '07_SYLLABUS',
    displayName: 'Syllabus',
    order: 7,
    required: true,
    checks: [
      { id: 'current_syllabus', label: 'Current semester syllabus present', type: 'has_syllabus_pair' },
      { id: 'prev_syllabus', label: 'Previous semester syllabus present', type: 'has_syllabus_pair' },
    ],
  },
  {
    id: 'student_survey_oct',
    standardName: '08_ STUDENT COURSE SURVEY',
    displayName: 'Student Course Survey',
    order: 8,
    required: true,
    checks: [
      { id: 'clo_pdf', label: 'CLO statistics PDF present', type: 'has_pdf' },
      { id: 'survey_excel', label: 'Survey attempts Excel/CSV present', type: 'has_survey_files' },
    ],
  },
  {
    id: 'improvement_oct',
    standardName: '09_IMPROVEMENT REPORT',
    displayName: 'Improvement Report',
    order: 9,
    required: true,
    checks: [
      { id: 'improvement_report', label: 'Improvement report(s) present', type: 'has_improvement_report' },
    ],
  },
  {
    id: 'supporting_oct',
    standardName: '10_SUPPORTING MATERIAL',
    displayName: 'Supporting Material',
    order: 10,
    required: false,
    checks: [
      { id: 'supporting_files', label: 'Supporting materials available', type: 'has_files' },
    ],
  },
  {
    id: 'attendance_oct',
    standardName: '11_STUDENTS ATTENDANCE',
    displayName: 'Students Attendance',
    order: 11,
    required: true,
    checks: [
      { id: 'attendance_files', label: 'Attendance files present', type: 'has_files' },
    ],
  },
];

// ─── Helper: Get config by CAF type ──────────────────────
export function getFolderConfig(cafType: CAFType): CAFFolderConfig[] {
  return cafType === 'OCT' ? OCT_FOLDERS : COURSE_FOLDERS;
}

// ─── Auto-detect CAF type from folder names ───────────────
export function detectCAFType(folderNames: string[]): CAFType {
  const upperNames = folderNames.map((n) => n.toUpperCase());

  const courseScore = COURSE_FOLDERS.filter((cf) =>
    upperNames.some((n) => n.includes(cf.standardName.toUpperCase().replace(/\d+_/, '').trim()))
  ).length;

  const octScore = OCT_FOLDERS.filter((cf) =>
    upperNames.some((n) => n.includes(cf.standardName.toUpperCase().replace(/\d+_/, '').trim()))
  ).length;

  // OCT-specific markers
  const hasOCTMarkers = upperNames.some(
    (n) =>
      n.includes('LAB REPORTS') ||
      n.includes('FINAL PRACTICAL') ||
      n.includes('PRACTICAL TEST') ||
      n.includes('LAB REPORT')
  );

  const hasCourseMarkers = upperNames.some(
    (n) =>
      n.includes('LECTURE NOTES') ||
      n.includes('MIDTERM') ||
      n.includes('PROJECTS AND HWS') ||
      n.includes('LABS AND REPORTS')
  );

  if (hasCourseMarkers && !hasOCTMarkers) return 'COURSE';
  if (hasOCTMarkers && !hasCourseMarkers) return 'OCT';
  if (octScore > courseScore) return 'OCT';
  if (courseScore > octScore) return 'COURSE';

  // Default to COURSE if ambiguous
  return folderNames.length > 0 ? 'COURSE' : 'UNKNOWN';
}

// ─── Match a real folder name to a standard config ────────
export function matchFolderToConfig(
  folderName: string,
  configs: CAFFolderConfig[]
): CAFFolderConfig | null {
  const upper = folderName.toUpperCase().trim();

  // Exact match first
  const exact = configs.find((c) => c.standardName.toUpperCase() === upper);
  if (exact) return exact;

  // Fuzzy match: strip number prefix and compare
  const stripped = upper.replace(/^\d+[_\s]/, '').trim();
  return (
    configs.find((c) => {
      const configStripped = c.standardName.toUpperCase().replace(/^\d+[_\s]/, '').trim();
      return configStripped === stripped || stripped.includes(configStripped) || configStripped.includes(stripped);
    }) ?? null
  );
}

