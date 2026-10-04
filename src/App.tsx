import { useState, useCallback } from 'react';
import Header from './components/Header';
import FolderInput from './components/FolderInput';
import ScanProgress from './components/ScanProgress';
import SummaryDashboard from './components/SummaryDashboard';
import FolderChecklist from './components/FolderChecklist';
import AuditorComments from './components/AuditorComments';
import FolderConfig from './components/FolderConfig';
import type { AuditReport, CAFType, AuditorComment } from './types/audit';
import type { CAFFolderConfig } from './types/audit';
import { runAudit } from './utils/auditEngine';
import { exportToExcel } from './utils/excelExport';

type AppState = 'IDLE' | 'SCANNING' | 'DONE' | 'ERROR';
type Tab = 'SUMMARY' | 'CHECKLIST' | 'COMMENTS';

export default function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [scanStage, setScanStage] = useState('Initializing...');
  const [currentFolder, setCurrentFolder] = useState('');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('SUMMARY');
  const [cafType, setCafType] = useState<CAFType>('COURSE');
  const [customConfigs, setCustomConfigs] = useState<CAFFolderConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleFolderSelect = useCallback(
    async (handle: FileSystemDirectoryHandle, cafTypeOverride?: CAFType) => {
      setAppState('SCANNING');
      setError(null);
      setReport(null);
      setCurrentFolder(handle.name);
      setScanStage('Reading folder structure...');

      try {
        setScanStage('Scanning files and subfolders...');
        const result = await runAudit(handle, cafTypeOverride);
        setScanStage('Running audit checks...');
        await new Promise((r) => setTimeout(r, 300)); // brief pause for UX
        setScanStage('Generating auditor feedback...');
        await new Promise((r) => setTimeout(r, 200));
        setReport(result);
        setCafType(result.cafType === 'UNKNOWN' ? 'COURSE' : result.cafType);
        setAppState('DONE');
        setActiveTab('SUMMARY');
      } catch (err) {
        console.error('Audit error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error during scan');
        setAppState('ERROR');
      }
    },
    []
  );

  const handleExport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      await exportToExcel(report);
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setAppState('IDLE');
    setReport(null);
    setError(null);
    setCurrentFolder('');
    setCustomConfigs([]);
  };

  const handleUpdateComments = (updated: AuditorComment[]) => {
    if (!report) return;
    setReport({ ...report, auditorComments: updated });
  };

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'SUMMARY', label: 'Summary', icon: '📊' },
    {
      id: 'CHECKLIST',
      label: 'Folder Checklist',
      icon: '📋',
      count: report?.folderResults.filter((r) => r.status !== 'PASS').length,
    },
    {
      id: 'COMMENTS',
      label: 'Auditor Comments',
      icon: '📝',
      count: report?.auditorComments.filter((c) => c.severity === 'ERROR').length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-5">
        {/* IDLE State */}
        {appState === 'IDLE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <FolderInput
                onFolderSelect={handleFolderSelect}
                isScanning={false}
              />
            </div>
            <div className="space-y-4">
              <FolderConfig
                cafType={cafType}
                onChangeCafType={setCafType}
                customConfigs={customConfigs}
                onUpdateConfigs={setCustomConfigs}
              />
              {/* Quick Reference */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-4 py-3">
                  <p className="text-white font-semibold text-sm">📚 CAF Structure Reference</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1.5">📚 Course (13 folders)</p>
                    <div className="space-y-1">
                      {[
                        '01_CAF Sheets', '02_BlackBoard Extraction', '03_Lecture Notes',
                        '04_Projects and HWs', '05_Quizzes', '06_Labs and Reports',
                        '07_Midterm exam', '08_Final Exam', '09_Syllabus',
                        '10_Student Course Survey', '11_Improvement Report',
                        '12_Supporting Materials', '13_Students Attendance',
                      ].map((f, i) => (
                        <div key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate">{f.replace(/^\d+_/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-bold text-gray-600 mb-1.5">🔬 OCT (11 folders)</p>
                    <div className="space-y-1">
                      {[
                        '01_CAF SHEETS', '02_BLACKBOARD EXTRACTION', '03_LAB REPORTS',
                        '04_QUIZZES', '05_PROJECT', '06_FINAL PRACTICAL TEST',
                        '07_SYLLABUS', '08_STUDENT COURSE SURVEY', '09_IMPROVEMENT REPORT',
                        '10_SUPPORTING MATERIAL', '11_STUDENTS ATTENDANCE',
                      ].map((f, i) => (
                        <div key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate">{f.replace(/^\d+_/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCANNING State */}
        {appState === 'SCANNING' && (
          <ScanProgress folderName={currentFolder} stage={scanStage} />
        )}

        {/* ERROR State */}
        {appState === 'ERROR' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-red-700">Scan Failed</h3>
            <p className="text-red-600 mt-2 text-sm">{error}</p>
            <button
              onClick={handleReset}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* DONE State */}
        {appState === 'DONE' && report && (
          <div className="space-y-5">
            {/* Action bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📁</div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{report.rootFolderName}</p>
                  <p className="text-xs text-gray-500">
                    {report.cafType} • {report.totalFiles} files • Scanned {report.scanDate}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleReset}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                >
                  🔄 New Scan
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="text-sm bg-gradient-to-r from-[#1a3a6e] to-[#2c4f8c] hover:from-[#0f2550] hover:to-[#1a3a6e] text-white px-5 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-all shadow-md disabled:opacity-60"
                >
                  {isExporting ? '⏳ Exporting...' : '📤 Export Excel'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#1a3a6e] to-[#2c4f8c] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === tab.id
                          ? 'bg-white/30 text-white'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'SUMMARY' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <SummaryDashboard report={report} />
                  </div>
                  <div className="space-y-4">
                    <FolderConfig
                      cafType={cafType}
                      onChangeCafType={setCafType}
                      customConfigs={customConfigs}
                      onUpdateConfigs={setCustomConfigs}
                    />
                    {/* Quick issues panel */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                      <div className="bg-red-600 px-4 py-3">
                        <p className="text-white font-semibold text-sm">🚨 Quick Issues</p>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto space-y-1.5">
                        {report.auditorComments.filter((c) => c.severity === 'ERROR').length === 0 ? (
                          <p className="text-green-600 text-sm text-center py-4">✅ No critical errors!</p>
                        ) : (
                          report.auditorComments
                            .filter((c) => c.severity === 'ERROR')
                            .map((c, i) => (
                              <div key={c.id} className="text-xs text-red-700 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                                <span className="font-bold flex-shrink-0">{i + 1}.</span>
                                <span>{c.text}</span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'CHECKLIST' && (
                <FolderChecklist
                  results={report.folderResults}
                  cafType={report.cafType}
                  rootFolderName={report.rootFolderName}
                />
              )}

              {activeTab === 'COMMENTS' && (
                <div className="max-w-4xl">
                  <AuditorComments
                    comments={report.auditorComments}
                    onUpdate={handleUpdateComments}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a3a6e] text-blue-200 text-center py-3 mt-auto">
        <p className="text-xs">
          EMET CAF Folder Integrity Checker • Read-Only Audit Tool • No files modified or uploaded
        </p>
      </footer>
    </div>
  );
}
