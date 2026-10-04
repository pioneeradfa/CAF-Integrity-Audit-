import { useState } from 'react';
import type { CAFType } from '../types/audit';

interface FolderInputProps {
  onFolderSelect: (handle: FileSystemDirectoryHandle, cafTypeOverride?: CAFType) => void;
  isScanning: boolean;
}

export default function FolderInput({ onFolderSelect, isScanning }: FolderInputProps) {
  const [cafTypeOverride, setCafTypeOverride] = useState<CAFType | 'AUTO'>('AUTO');
  const [dragOver, setDragOver] = useState(false);

  const handleSelectFolder = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });
      const override = cafTypeOverride === 'AUTO' ? undefined : cafTypeOverride;
      onFolderSelect(handle, override);
    } catch (err) {
      // User cancelled
      console.log('Folder selection cancelled', err);
    }
  };

  const isSupported = 'showDirectoryPicker' in window;

  return (
    <div className="space-y-6">
      {/* Input Method Tabs */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a3a6e] to-[#3d5a99] px-6 py-3">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            📥 Select CAF Folder to Audit
          </h2>
        </div>

        <div className="p-6 space-y-5">
          {/* CAF Type Override */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-semibold text-gray-700">CAF Format:</label>
            {(['AUTO', 'COURSE', 'OCT'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cafType"
                  value={type}
                  checked={cafTypeOverride === type}
                  onChange={() => setCafTypeOverride(type)}
                  className="w-4 h-4 accent-[#2c4f8c]"
                />
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
                    cafTypeOverride === type
                      ? 'bg-[#1a3a6e] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'AUTO' ? '🤖 Auto-Detect' : type === 'COURSE' ? '📚 Courses (13 folders)' : '🔬 OCTs (11 folders)'}
                </span>
              </label>
            ))}
          </div>

          {/* Folder Drop Zone */}
          {isSupported ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#2c4f8c] bg-blue-50'
                  : 'border-gray-300 hover:border-[#2c4f8c] hover:bg-blue-50/30'
              } ${isScanning ? 'pointer-events-none opacity-60' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
              onClick={handleSelectFolder}
            >
              <div className="text-5xl mb-3">📁</div>
              <p className="text-lg font-semibold text-gray-700">
                {isScanning ? '⏳ Scanning...' : 'Click to Select CAF Root Folder'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Select the CRN folder, e.g.{' '}
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  EMEX-403_Robotics_1135_S1-24_25
                </code>
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                  🔒 Read-Only
                </span>
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  📂 Local Folder
                </span>
                <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                  🚫 No Upload
                </span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-red-300 rounded-xl p-8 text-center bg-red-50">
              <p className="text-red-600 font-semibold">⚠️ Browser Not Supported</p>
              <p className="text-red-500 text-sm mt-1">
                Please use a Chromium-based browser (Chrome, Edge) for folder access.
              </p>
            </div>
          )}

          {/* SharePoint Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <span className="text-amber-500 text-lg flex-shrink-0">☁️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">SharePoint / OneDrive Folders</p>
              <p className="text-xs text-amber-700 mt-0.5">
                For SharePoint files: Sync the library to your local machine via OneDrive/SharePoint
                Sync, then select the synced folder. All operations remain{' '}
                <strong>read-only</strong> — no files will be modified.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '✅', label: 'Structured Checklist', desc: 'Per-folder validation' },
          { icon: '🧠', label: 'Smart Detection', desc: 'Auto file type analysis' },
          { icon: '📝', label: 'Editable Comments', desc: 'Human-like feedback' },
          { icon: '📤', label: 'Excel Export', desc: 'With hyperlinks & colors' },
        ].map((f) => (
          <div key={f.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{f.icon}</div>
            <p className="text-xs font-semibold text-gray-700">{f.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
