import { useState } from 'react';
import type { CAFType } from '../types/audit';
import type { CAFFolderConfig } from '../types/audit';
import { COURSE_FOLDERS, OCT_FOLDERS } from '../config/cafConfig';

interface FolderConfigProps {
  cafType: CAFType;
  onChangeCafType: (t: CAFType) => void;
  customConfigs: CAFFolderConfig[];
  onUpdateConfigs: (configs: CAFFolderConfig[]) => void;
}

export default function FolderConfig({
  cafType,
  onChangeCafType,
  customConfigs,
  onUpdateConfigs,
}: FolderConfigProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const baseConfigs = cafType === 'OCT' ? OCT_FOLDERS : COURSE_FOLDERS;
  const activeConfigs = customConfigs.length > 0 ? customConfigs : baseConfigs;

  const startEdit = (config: CAFFolderConfig) => {
    setEditingId(config.id);
    setEditName(config.standardName);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = activeConfigs.map((c) =>
      c.id === editingId ? { ...c, standardName: editName, displayName: editName } : c
    );
    onUpdateConfigs(updated);
    setEditingId(null);
  };

  const resetToDefault = () => {
    onUpdateConfigs([]);
    setEditingId(null);
  };

  const switchType = (t: CAFType) => {
    onChangeCafType(t);
    onUpdateConfigs([]); // reset custom
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-700 to-slate-600 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">⚙️</span>
          <div>
            <p className="text-white font-semibold text-sm">Folder Configuration</p>
            <p className="text-slate-300 text-xs">
              {cafType} Mode — {activeConfigs.length} folders configured
              {customConfigs.length > 0 && ' (customized)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {(['COURSE', 'OCT'] as const).map((t) => (
              <button
                key={t}
                onClick={(e) => { e.stopPropagation(); switchType(t); }}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  cafType === t
                    ? 'bg-white text-slate-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {t === 'COURSE' ? '📚 Course' : '🔬 OCT'}
              </button>
            ))}
          </div>
          <span className={`text-white/70 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* Folder list */}
      {expanded && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Rename standard folder names to match your actual folder names
            </p>
            <button
              onClick={resetToDefault}
              className="text-xs text-gray-500 hover:text-red-500 underline"
            >
              ↺ Reset to defaults
            </button>
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {activeConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-100 px-3 py-2"
              >
                <span className="w-7 h-7 rounded-full bg-[#1a3a6e] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {config.order}
                </span>

                {editingId === config.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded font-medium"
                    >
                      ✔
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{config.standardName}</p>
                      <p className="text-xs text-gray-400">{config.checks.length} check(s) • {config.required ? '🔴 Required' : '🟡 Optional'}</p>
                    </div>
                    <button
                      onClick={() => startEdit(config)}
                      className="text-gray-400 hover:text-blue-600 text-sm transition-colors flex-shrink-0"
                      title="Rename folder"
                    >
                      ✏️
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg p-2 text-center">
            ⚠️ Changes apply to the next scan only. Re-select folder to apply.
          </p>
        </div>
      )}
    </div>
  );
}
