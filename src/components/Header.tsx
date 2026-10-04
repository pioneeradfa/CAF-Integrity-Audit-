

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#1a3a6e] via-[#2c4f8c] to-[#3d5a99] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow">
            🗂️
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              EMET CAF FOLDER INTEGRITY CHECKER
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">
              Academic CAF Audit System — Read-Only • Structured Validation • Intelligent Feedback
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-blue-200">
          <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
            🔒 Read-Only Mode
          </span>
          <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
            🏫 EMET Auditor v2.0
          </span>
        </div>
      </div>
    </header>
  );
}
