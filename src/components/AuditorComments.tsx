import { useState } from 'react';
import type { AuditorComment } from '../types/audit';

interface AuditorCommentsProps {
  comments: AuditorComment[];
  onUpdate: (updated: AuditorComment[]) => void;
}

const ACTION_OPTIONS = ['Action Required', 'Acceptable — No Action', 'Needs Clarification', 'Minor Issue'];

export default function AuditorComments({ comments, onUpdate }: AuditorCommentsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');
  const [actionMap, setActionMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      comments.map((c) => [
        c.id,
        c.severity === 'INFO' ? 'Acceptable — No Action' : 'Action Required',
      ])
    )
  );

  const filtered =
    filterSeverity === 'ALL' ? comments : comments.filter((c) => c.severity === filterSeverity);

  const counts = {
    ALL: comments.length,
    ERROR: comments.filter((c) => c.severity === 'ERROR').length,
    WARNING: comments.filter((c) => c.severity === 'WARNING').length,
    INFO: comments.filter((c) => c.severity === 'INFO').length,
  };

  const startEdit = (comment: AuditorComment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = comments.map((c) =>
      c.id === editingId ? { ...c, text: editText } : c
    );
    onUpdate(updated);
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const deleteComment = (id: string) => {
    onUpdate(comments.filter((c) => c.id !== id));
  };

  const addComment = () => {
    const newComment: AuditorComment = {
      id: `c_custom_${Date.now()}`,
      folderRef: 'GENERAL',
      text: 'New auditor observation — edit this comment',
      severity: 'INFO',
      editable: true,
    };
    onUpdate([...comments, newComment]);
    setActionMap((prev) => ({ ...prev, [newComment.id]: 'Acceptable — No Action' }));
    setTimeout(() => startEdit(newComment), 50);
  };

  const updateAction = (id: string, action: string) => {
    setActionMap((prev) => ({ ...prev, [id]: action }));
  };

  const severityStyles: Record<string, { bg: string; border: string; badge: string; icon: string; label: string }> = {
    ERROR: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200',
      icon: '🔴',
      label: 'ERROR',
    },
    WARNING: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: '🟡',
      label: 'WARNING',
    },
    INFO: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: 'ℹ️',
      label: 'INFO',
    },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            📝 Auditor Comments
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              Human-like feedback • Editable
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Click ✏️ to edit any comment before export. Click + Add to insert new comments.
          </p>
        </div>
        <button
          onClick={addComment}
          className="text-xs bg-[#1a3a6e] hover:bg-[#2c4f8c] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
        >
          ＋ Add Comment
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'ERROR', 'WARNING', 'INFO'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
              filterSeverity === sev
                ? sev === 'ALL' ? 'bg-gray-700 text-white border-gray-700'
                : sev === 'ERROR' ? 'bg-red-600 text-white border-red-600'
                : sev === 'WARNING' ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {sev === 'ALL' ? '📋' : sev === 'ERROR' ? '🔴' : sev === 'WARNING' ? '🟡' : 'ℹ️'} {sev} ({counts[sev]})
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm">No issues for this filter</p>
          </div>
        )}

        {filtered.map((comment, idx) => {
          const style = severityStyles[comment.severity] ?? severityStyles['INFO'];
          const isEditing = editingId === comment.id;
          const currentAction = actionMap[comment.id] ?? 'Action Required';

          return (
            <div
              key={comment.id}
              className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all`}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Number badge */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/70 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {idx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${style.badge}`}>
                      {style.icon} {style.label}
                    </span>
                    <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full border border-gray-100">
                      📁 {comment.folderRef}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-sm text-gray-800 bg-white border border-blue-300 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') cancelEdit();
                          if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEdit}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          ✔ Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          ✕ Cancel
                        </button>
                        <span className="text-xs text-gray-400">Ctrl+Enter to save, Esc to cancel</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800 leading-relaxed">{comment.text}</p>
                  )}

                  {/* Action dropdown */}
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 font-medium">Action:</label>
                      <select
                        value={currentAction}
                        onChange={(e) => updateAction(comment.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                          currentAction === 'Acceptable — No Action'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : currentAction === 'Action Required'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ACTION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(comment)}
                      className="w-7 h-7 flex items-center justify-center text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit comment"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="w-7 h-7 flex items-center justify-center text-sm text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500">
        <p className="font-medium text-gray-700 mb-1">Comment Style Guide (EMET Auditor Format):</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Use numbered, concise professional language</li>
          <li>Combine related issues where possible</li>
          <li>Reference specific folder/file names</li>
          <li>Flag severity: 🔴 Error (blocking), 🟡 Warning (review), ℹ Info (acceptable)</li>
        </ul>
      </div>
    </div>
  );
}
