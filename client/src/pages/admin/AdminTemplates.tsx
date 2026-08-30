import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Template } from "../../api/types";

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const { data } = await api.get<Template[]>("/admin/templates");
    setTemplates(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/templates/${editingId}`, { title, content });
      } else {
        await api.post("/admin/templates", { title, content });
      }
      resetForm();
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(t: Template) {
    setEditingId(t.id);
    setTitle(t.title);
    setContent(t.content);
  }

  async function handleDelete(id: string) {
    await api.delete(`/admin/templates/${id}`);
    if (editingId === id) resetForm();
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingId ? "Edit Template" : "Template Baru"}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pesan</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {editingId ? "Simpan Perubahan" : "Tambah Template"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Daftar Template</h2>
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{t.title}</p>
                  <p className="text-sm text-slate-500 whitespace-pre-wrap mt-1">{t.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(t)} className="text-sm text-emerald-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && <p className="text-sm text-slate-400">Belum ada template</p>}
        </div>
      </div>
    </div>
  );
}
