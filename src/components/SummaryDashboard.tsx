import type { AuditReport, FolderAuditResult } from '../types/audit';

function FolderStatusRow({ result, idx }: { result: FolderAuditResult; idx: number }) {
  const statusMap = {
    PASS: { bg: 'bg-green-50', dot: 'bg-green-500', text: 'text-green-700', label: '✔ PASS' },
    FAIL: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700', label: '✘ FAIL' },
    WARNING: { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700', label: '⚠ WARN' },
    INFO: { bg: 'bg-blue-50', dot: 'bg-blue-400', text: 'text-blue-700', label: 'ℹ INFO' },
  };
  const s = statusMap[result.status as keyof typeof statusMap] ?? statusMap.INFO;
  return (
    <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-blue-50/30 transition-colors`}>
      <td className="px-3 py-2 text-xs text-gray-400 text-center w-8">{idx + 1}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
          <span className="text-xs text-gray-700 font-medium truncate max-w-[200px]" title={result.folderName}>
            {result.folderName}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${result.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {result.exists ? '✔' : '✘'}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${result.isEmpty ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {!result.exists ? '—' : result.isEmpty ? '⚠ Empty' : `${result.files.length} files`}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
          {s.label}
        </span>
      </td>
    </tr>
  );
}

interface SummaryDashboardProps {
  report: AuditReport;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: string }> = {
    PASS: { bg: 'bg-green-100 text-green-800 border-green-200', text: 'PASS', icon: '✔' },
    FAIL: { bg: 'bg-red-100 text-red-800 border-red-200', text: 'FAIL', icon: '✘' },
    WARNING: { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'WARNING', icon: '⚠' },
    INFO: { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'INFO', icon: 'ℹ' },
  };
  const s = map[status] ?? map['INFO'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg}`}>
      {s.icon} {s.text}
    </span>
  );
}

export default function SummaryDashboard({ report }: SummaryDashboardProps) {
  const { summary } = report;
  const gaugePercent = summary.completionPercent;

  return (
    <div className="space-y-4">
      {/* Overall Status Banner */}
      <div
        className={`rounded-2xl p-4 border-2 flex items-center gap-4 ${
          report.overallStatus === 'PASS'
            ? 'bg-green-50 border-green-200'
            : report.overallStatus === 'FAIL'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="text-4xl">
          {report.overallStatus === 'PASS' ? '✅' : report.overallStatus === 'FAIL' ? '❌' : '⚠️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-gray-800">
              {report.cafType} CAF — {report.rootFolderName}
            </h3>
            <StatusBadge status={report.overallStatus} />
            <span className="text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
              🗓 {report.scanDate}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {report.foundFolders}/{report.totalFolders} folders found •{' '}
            {report.missingFolders > 0 ? (
              <span className="text-red-600 font-medium">{report.missingFolders} missing</span>
            ) : (
              <span className="text-green-600">all present</span>
            )}{' '}
            • {report.totalFiles} total files
          </p>
        </div>
        <div className="hidden md:flex flex-col items-center">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={gaugePercent >= 80 ? '#16a34a' : gaugePercent >= 50 ? '#d97706' : '#dc2626'}
                strokeWidth="3"
                strokeDasharray={`${gaugePercent} ${100 - gaugePercent}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {gaugePercent}%
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-1">Complete</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Passed',
            value: summary.passCount,
            icon: '✅',
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-700',
            val: 'text-green-800',
          },
          {
            label: 'Failed',
            value: summary.failCount,
            icon: '❌',
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            val: 'text-red-800',
          },
          {
            label: 'Warnings',
            value: summary.warningCount,
            icon: '⚠️',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
            val: 'text-amber-800',
          },
          {
            label: 'Total Checks',
            value: summary.totalChecks,
            icon: '📋',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            val: 'text-blue-800',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`${card.bg} border ${card.border} rounded-xl p-4 text-center`}
          >
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className={`text-2xl font-bold ${card.val}`}>{card.value}</div>
            <div className={`text-xs font-medium ${card.text} mt-0.5`}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Audit Completion</span>
          <span className="text-sm font-bold text-gray-800">{gaugePercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              gaugePercent >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              gaugePercent >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
              'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${gaugePercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Folder Status Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#1a3a6e] px-4 py-2.5">
          <p className="text-white font-semibold text-sm">📁 Folder Status Overview</p>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left min-w-[420px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#2c4f8c] text-white text-xs">
                <th className="px-3 py-2 w-8">#</th>
                <th className="px-3 py-2">Folder Name</th>
                <th className="px-3 py-2 text-center">Exists</th>
                <th className="px-3 py-2 text-center">Files</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.folderResults.map((result, idx) => (
                <FolderStatusRow key={result.folderName} result={result} idx={idx} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
