import { useEffect, useMemo, useState } from "react";
import supabaseAdmin from "../../supabaseAdminClient";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";

const TL = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LaborPanel({ workOrderId, onChanged }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const [form, setForm] = useState({ description: "", hours: "", hourly_rate: "" });
    const [saving, setSaving] = useState(false);

    // inline edit
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ description: "", hours: "", hourly_rate: "" });

    async function load() {
        if (!workOrderId) return;
        setLoading(true); setErr(null);
        const { data, error } = await supabaseAdmin
            .from("work_order_items")
            .select("id, description, hours, hourly_rate, amount, created_at")
            .eq("work_order_id", workOrderId)
            .eq("kind", "LABOR")
            .order("created_at", { ascending: true });
        if (error) setErr(error.message);
        setRows(data || []);
        setLoading(false);
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [workOrderId]);

    async function addLabor(e) {
        e.preventDefault();
        if (!form.description?.trim()) return;
        setSaving(true);
        const payload = {
            work_order_id: workOrderId,
            kind: "LABOR",
            description: form.description.trim(),
            hours: Number(form.hours || 0),
            hourly_rate: Number(form.hourly_rate || 0),
        };
        const { error } = await supabaseAdmin.from("work_order_items").insert(payload);
        setSaving(false);
        if (error) { alert(error.message); return; }
        setForm({ description: "", hours: "", hourly_rate: "" });
        await load();
        onChanged?.();
    }

    function beginEdit(row) {
        setEditingId(row.id);
        setEditForm({
            description: row.description || "",
            hours: row.hours ?? "",
            hourly_rate: row.hourly_rate ?? "",
        });
    }
    function cancelEdit() {
        setEditingId(null);
        setEditForm({ description: "", hours: "", hourly_rate: "" });
    }
    async function saveEdit() {
        const { error } = await supabaseAdmin
            .from("work_order_items")
            .update({
                description: editForm.description?.trim() || null,
                hours: Number(editForm.hours || 0),
                hourly_rate: Number(editForm.hourly_rate || 0),
            })
            .eq("id", editingId);
        if (error) { alert(error.message); return; }
        cancelEdit();
        await load();
        onChanged?.();
    }

    async function remove(id) {
        if (!window.confirm("Bu işçilik satırını silmek istiyor musun?")) return;
        const { error } = await supabaseAdmin.from("work_order_items").delete().eq("id", id);
        if (error) { alert(error.message); return; }
        await load();
        onChanged?.();
    }

    const laborTotal = useMemo(
        () => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
        [rows]
    );

    return (
        <div className="space-y-3">
            {/* Form */}
            <form onSubmit={addLabor} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-gray-500">İşçilik Açıklaması</label>
                    <input
                        className="w-full border rounded px-2 py-1.5"
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Örn: Yerinde servis / arıza tespiti"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Saat</label>
                    <input
                        type="number"
                        step="0.25"
                        className="w-28 border rounded px-2 py-1.5"
                        value={form.hours}
                        onChange={(e) => setForm(f => ({ ...f, hours: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Saatlik Ücret</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-32 border rounded px-2 py-1.5"
                        value={form.hourly_rate}
                        onChange={(e) => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                    />
                </div>
                <button
                    disabled={saving}
                    className={`px-3 py-2 rounded bg-indigo-600 text-white ${saving ? "opacity-60" : ""}`}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Ekle"}
                </button>
            </form>

            {/* Liste */}
            <div className="border rounded overflow-x-auto">
                {loading ? (
                    <div className="p-4 text-gray-500">
                        <Loader2 className="animate-spin inline mr-2" /> Yükleniyor…
                    </div>
                ) : err ? (
                    <div className="p-3 text-red-600">{err}</div>
                ) : rows.length === 0 ? (
                    <div className="p-3 text-gray-500">İşçilik eklenmemiş.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">Açıklama</th>
                                <th className="px-3 py-2 text-right">Saat</th>
                                <th className="px-3 py-2 text-right">Saatlik</th>
                                <th className="px-3 py-2 text-right">Tutar</th>
                                <th className="px-3 py-2 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-3 py-2">
                                        {editingId === r.id ? (
                                            <input
                                                className="w-full border rounded px-2 py-1.5"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                                            />
                                        ) : r.description}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                step="0.25"
                                                className="w-24 border rounded px-2 py-1.5 text-right"
                                                value={editForm.hours}
                                                onChange={(e) => setEditForm(f => ({ ...f, hours: e.target.value }))}
                                            />
                                        ) : TL(r.hours)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-28 border rounded px-2 py-1.5 text-right"
                                                value={editForm.hourly_rate}
                                                onChange={(e) => setEditForm(f => ({ ...f, hourly_rate: e.target.value }))}
                                            />
                                        ) : TL(r.hourly_rate)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">{TL(r.amount)}</td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                        {editingId === r.id ? (
                                            <div className="inline-flex gap-1">
                                                <button onClick={saveEdit} className="p-1 rounded border text-green-700 hover:bg-green-50" title="Kaydet">
                                                    <Save size={16} />
                                                </button>
                                                <button onClick={cancelEdit} className="p-1 rounded border hover:bg-gray-50" title="Vazgeç">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="inline-flex gap-1">
                                                <button onClick={() => beginEdit(r)} className="p-1 rounded border hover:bg-gray-50" title="Düzenle">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => remove(r.id)} className="p-1 rounded border hover:bg-gray-50 text-red-600" title="Sil">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {/* toplam satırı */}
                            <tr className="bg-gray-50">
                                <td className="px-3 py-2 font-medium" colSpan={3}>İşçilik Toplamı</td>
                                <td className="px-3 py-2 text-right font-semibold">
                                    {TL(rows.reduce((s, r) => s + Number(r.amount || 0), 0))}
                                </td>
                                <td className="px-3 py-2"></td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
