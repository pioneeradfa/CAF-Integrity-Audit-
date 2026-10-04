import { useState } from 'react';
import type { FolderAuditResult, FileEntry } from '../types/audit';

interface FolderChecklistProps {
  results: FolderAuditResult[];
  cafType: string;
  rootFolderName: string;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'PASS') return <span className="text-green-600 font-bold text-sm">✔ PASS</span>;
  if (status === 'FAIL') return <span className="text-red-600 font-bold text-sm">✘ FAIL</span>;
  if (status === 'WARNING') return <span className="text-amber-600 font-bold text-sm">⚠ WARN</span>;
  return <span className="text-blue-600 font-bold text-sm">ℹ INFO</span>;
}

function FileRow({ file, index, rootFolderName }: { file: FileEntry; index: number; rootFolderName: string }) {
  const isSmall = file.size < 1100;
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const openFile = async () => {
    if (file.handle) {
      try {
        const fileObj = await file.handle.getFile();
        const url = URL.createObjectURL(fileObj);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch {
        alert(`Cannot open file. Path: ${file.path}`);
      }
    }
  };

  return (
    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors group`}>
      <td className="px-3 py-2 text-xs text-gray-400 text-center">{index + 1}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{getFileEmoji(file.extension)}</span>
          <span className="text-xs text-gray-700 font-medium truncate max-w-[220px]" title={file.name}>
            {file.name}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-gray-400 truncate max-w-[140px]" title={file.parentFolder}>
        {file.parentFolder.replace(rootFolderName, '').replace(/^\//, '') || file.parentFolder}
      </td>
      <td className={`px-3 py-2 text-xs text-right font-mono ${isSmall ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
        {isSmall && <span title="Small/Empty file" className="mr-1">⚠</span>}
        {formatSize(file.size)}
      </td>
      <td className="px-3 py-2 text-center">
        {file.handle ? (
          <button
            onClick={openFile}
            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-medium transition-colors"
          >
            📂 Open
          </button>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}

function getFileEmoji(ext: string): string {
  const map: Record<string, string> = {
    pdf: '📕', xlsx: '📊', xls: '📊', doc: '📄', docx: '📄',
    ppt: '📎', pptx: '📎', zip: '🗜️', rar: '🗜️', '7z': '🗜️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', txt: '📃', csv: '📊',
    mp4: '🎬', mp3: '🎵', gif: '🖼️',
  };
  return map[ext] ?? '📄';
}

function FolderCard({ result, rootFolderName }: { result: FolderAuditResult; rootFolderName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const statusBg: Record<string, string> = {
    PASS: 'border-green-200 bg-green-50',
    FAIL: 'border-red-200 bg-red-50',
    WARNING: 'border-amber-200 bg-amber-50',
  };
  const statusHeader: Record<string, string> = {
    PASS: 'bg-green-100',
    FAIL: 'bg-red-100',
    WARNING: 'bg-amber-100',
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden shadow-sm ${statusBg[result.status] ?? 'border-gray-200 bg-gray-50'}`}>
      {/* Card Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${statusHeader[result.status] ?? 'bg-gray-100'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">
            {result.exists ? (result.isEmpty ? '📭' : '📁') : '🚫'}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{result.folderName}</p>
            {result.folderName !== result.standardName && (
              <p className="text-xs text-gray-400">Standard: {result.standardName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <StatusIcon status={result.status} />
          <span className="text-xs text-gray-500">{result.files.length} files</span>
          <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-3 bg-white/70">
          {/* Checklist */}
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">📋 Checklist</p>
            <div className="space-y-1.5">
              {result.checks.map((check) => (
                <div
                  key={check.id}
                  className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                    check.status === 'PASS'
                      ? 'bg-green-50 border border-green-100'
                      : check.status === 'FAIL'
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-amber-50 border border-amber-100'
                  }`}
                >
                  <span className="flex-shrink-0 mt-0.5">
                    {check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700">{check.label}</p>
                    <p className="text-gray-500 mt-0.5">{check.detail}</p>
                  </div>
                  <StatusIcon status={check.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 mb-1">🔴 Issues Detected</p>
              <ul className="space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="flex-shrink-0">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Subfolders */}
          {result.subfolders.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">📂 Subfolders</p>
              <div className="flex flex-wrap gap-1.5">
                {result.subfolders.map((sf) => (
                  <span key={sf} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    📁 {sf}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Files toggle */}
          {result.files.length > 0 && (
            <div>
              <button
                onClick={() => setShowFiles(!showFiles)}
                className="text-xs text-[#2c4f8c] hover:text-[#1a3a6e] font-medium flex items-center gap-1 hover:underline"
              >
                {showFiles ? '▲ Hide' : '▼ Show'} {result.files.length} file(s)
              </button>
              {showFiles && (
                <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead>
                        <tr className="bg-[#1a3a6e] text-white text-xs">
                          <th className="px-3 py-2 w-8">#</th>
                          <th className="px-3 py-2">File Name</th>
                          <th className="px-3 py-2">Subfolder</th>
                          <th className="px-3 py-2 text-right">Size</th>
                          <th className="px-3 py-2 text-center">Open</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.files.map((file, i) => (
                          <FileRow key={file.path} file={file} index={i} rootFolderName={rootFolderName} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {!result.exists && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-red-600 font-medium text-sm">🚫 Folder Not Found</p>
              <p className="text-red-400 text-xs mt-1">Expected: {result.standardName}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FolderChecklist({ results, cafType, rootFolderName }: FolderChecklistProps) {
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'WARNING'>('ALL');

  const filtered = filter === 'ALL' ? results : results.filter((r) => r.status === filter);

  const counts = {
    ALL: results.length,
    PASS: results.filter((r) => r.status === 'PASS').length,
    FAIL: results.filter((r) => r.status === 'FAIL').length,
    WARNING: results.filter((r) => r.status === 'WARNING').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            📋 Folder Checklist
            <span className="text-xs font-normal bg-[#1a3a6e] text-white px-2 py-0.5 rounded-full">
              {cafType}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Click a folder card to expand details</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PASS', 'FAIL', 'WARNING'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                filter === f
                  ? f === 'ALL' ? 'bg-[#1a3a6e] text-white border-[#1a3a6e]'
                  : f === 'PASS' ? 'bg-green-600 text-white border-green-600'
                  : f === 'FAIL' ? 'bg-red-600 text-white border-red-600'
                  : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'ALL' ? '📋' : f === 'PASS' ? '✅' : f === 'FAIL' ? '❌' : '⚠️'} {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Folder cards */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((result) => (
          <FolderCard key={result.folderName} result={result} rootFolderName={rootFolderName} />
        ))}
      </div>
    </div>
  );
}
