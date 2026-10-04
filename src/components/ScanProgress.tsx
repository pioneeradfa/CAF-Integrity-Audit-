interface ScanProgressProps {
  folderName: string;
  stage: string;
}

export default function ScanProgress({ folderName, stage }: ScanProgressProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#2c4f8c] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800">Scanning CAF Folder...</h3>
          <p className="text-sm text-[#2c4f8c] font-medium mt-1">{stage}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 px-3 py-1 rounded-full inline-block">
            📁 {folderName}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">🔒 Read-Only Mode Active</span>
          <span className="flex items-center gap-1">🚫 No Files Modified</span>
        </div>

        {/* Animated progress bar */}
        <div className="w-full max-w-sm bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#2c4f8c] to-[#3d5a99] rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}
