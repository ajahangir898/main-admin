import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Calendar, Edit2, Trash2, ChevronLeft, ChevronRight, X, StickyNote, Tag, Pin, PinOff } from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  date: string;
  isPinned?: boolean;
  color?: string;
}

interface AdminNoteProps {
  tenantId?: string;
}

const NOTE_COLORS = [
  { name: 'Default', value: '#1e1e2e' },
  { name: 'Yellow', value: '#3d3a1d' },
  { name: 'Green', value: '#1d3d2a' },
  { name: 'Blue', value: '#1d2e3d' },
  { name: 'Purple', value: '#2d1d3d' },
  { name: 'Red', value: '#3d1d1d' },
];

const NOTE_CATEGORIES = ['General', 'Important', 'Reminder', 'Business', 'Personal', 'Todo'];

// Get tenant-specific notes storage key
const getNotesStorageKey = (tenantId?: string) => {
  if (!tenantId) return 'admin_notes';
  return `admin_notes_${tenantId}`;
};

const AdminNote: React.FC<AdminNoteProps> = ({ tenantId }) => {
  const notesStorageKey = useMemo(() => getNotesStorageKey(tenantId), [tenantId]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [newNote, setNewNote] = useState<Partial<NoteItem>>({ color: NOTE_COLORS[0].value });
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Load notes from localStorage (tenant-specific)
  useEffect(() => {
    setLoading(true);
    try {
      const saved = localStorage.getItem(notesStorageKey);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        setNotes([]);
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
      setNotes([]);
    }
    setLoading(false);
  }, [notesStorageKey]);

  // Save notes to localStorage (tenant-specific)
  const saveNotes = (updatedNotes: NoteItem[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(notesStorageKey, JSON.stringify(updatedNotes));
  };

  const filtered = useMemo(() => {
    return notes
      .filter(n =>
        (!query || n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase())) &&
        (!selectedCategory || n.category === selectedCategory)
      )
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [notes, query, selectedCategory]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleAdd = () => {
    if (!newNote.title || !newNote.content) return;

    const note: NoteItem = {
      id: editingNote?.id || String(Date.now()),
      title: newNote.title!,
      content: newNote.content!,
      category: newNote.category || 'General',
      date: newNote.date || new Date().toISOString(),
      isPinned: newNote.isPinned || false,
      color: newNote.color || NOTE_COLORS[0].value,
    };

    if (editingNote) {
      saveNotes(notes.map(n => n.id === editingNote.id ? note : n));
    } else {
      saveNotes([note, ...notes]);
    }

    setIsAddOpen(false);
    setEditingNote(null);
    setNewNote({ color: NOTE_COLORS[0].value });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this note?')) return;
    saveNotes(notes.filter(n => n.id !== id));
  };

  const handleEdit = (note: NoteItem) => {
    setNewNote(note);
    setEditingNote(note);
    setIsAddOpen(true);
  };

  const togglePin = (id: string) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  return (
    <div className="p-6 bg-[#0a0a0f] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-7 h-7 text-yellow-500" />
            Notes
          </h1>
          <p className="text-slate-400 text-sm mt-1">Keep track of important information and reminders</p>
        </div>
        <button
          onClick={() => { setNewNote({ color: NOTE_COLORS[0].value, date: new Date().toISOString() }); setEditingNote(null); setIsAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#12121a] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
          >
            <option value="">All Categories</option>
            {NOTE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {paged.length === 0 ? (
        <div className="bg-[#12121a] rounded-xl border border-white/5 p-12 text-center">
          <StickyNote className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No notes yet</p>
          <p className="text-slate-500 text-sm mt-1">Click "Add Note" to create your first note</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-white/5 overflow-hidden hover:border-yellow-500/30 transition group"
              style={{ backgroundColor: note.color || NOTE_COLORS[0].value }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold line-clamp-1">{note.title}</h3>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`p-1 rounded-lg transition ${note.isPinned ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                  >
                    {note.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-slate-300 text-sm line-clamp-4 mb-3">{note.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white/10 text-xs rounded-full text-slate-300">
                      {note.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 px-4 py-2 bg-black/20 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleEdit(note)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {Math.ceil(filtered.length / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * pageSize >= filtered.length}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] rounded-xl border border-white/10 w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">
                {editingNote ? 'Edit Note' : 'Add New Note'}
              </h2>
              <button
                onClick={() => { setIsAddOpen(false); setEditingNote(null); setNewNote({ color: NOTE_COLORS[0].value }); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={newNote.title || ''}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Note title"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Content *</label>
                <textarea
                  value={newNote.content || ''}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note..."
                  rows={5}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select
                    value={newNote.category || 'General'}
                    onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none"
                  >
                    {NOTE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewNote(prev => ({ ...prev, color: color.value }))}
                        className={`w-8 h-8 rounded-lg border-2 transition ${
                          newNote.color === color.value ? 'border-yellow-400' : 'border-transparent hover:border-white/30'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={newNote.isPinned || false}
                  onChange={(e) => setNewNote(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-yellow-500 focus:ring-yellow-500/50"
                />
                <label htmlFor="pinned" className="text-sm text-slate-400">Pin this note</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={() => { setIsAddOpen(false); setEditingNote(null); setNewNote({ color: NOTE_COLORS[0].value }); }}
                className="px-4 py-2 text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newNote.title || !newNote.content}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {editingNote ? 'Update' : 'Add'} Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNote;
