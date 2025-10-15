import { useEffect, useMemo, useState } from "react";
import supabaseAdmin from "../../supabaseAdminClient";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";

// basit para formatı
const TL = (n) =>
    Number(n || 0).toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function PartsPanel({ workOrderId, onChanged }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const [form, setForm] = useState({ description: "", qty: "", unit_price: "" });
    const [saving, setSaving] = useState(false);

    // inline edit
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ description: "", qty: "", unit_price: "" });
    const isEditing = useMemo(() => !!editingId, [editingId]);

    async function load() {
        if (!workOrderId) return;
        setLoading(true);
        setErr(null);
        const { data, error } = await supabaseAdmin
            .from("work_order_items")
            .select("id, description, qty, unit_price, amount, created_at")
            .eq("work_order_id", workOrderId)
            .eq("kind", "PART")
            .order("created_at", { ascending: true });
        if (error) setErr(error.message);
        setRows(data || []);
        setLoading(false);
    }

    useEffect(() => {
        load(); // eslint-disable-next-line
    }, [workOrderId]);

    async function addPart(e) {
        e.preventDefault();
        if (!form.description?.trim()) return;
        setSaving(true);
        try {
            const payload = {
                work_order_id: workOrderId,
                kind: "PART",
                description: form.description.trim(),
                qty: Number(form.qty || 0),
                unit_price: Number(form.unit_price || 0),
            };

            const { error } = await supabaseAdmin.from("work_order_items").insert(payload);
            if (error) throw error;

            // 🟢 HİBRİT-OTOMATİK: İlk kalem eklendiyse WO'yu otomatik başlat
            // (DB tarafında trigger da ekliyoruz; bu satırlar UI'da anında yansısın diye güvenli bir "double-ensure")
            await supabaseAdmin
                .from("work_orders")
                .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
                .eq("id", workOrderId)
                .eq("status", "NEW");

            setForm({ description: "", qty: "", unit_price: "" });
            await load();
            onChanged?.();
        } catch (err) {
            alert(err.message || "Parça eklenemedi.");
        } finally {
            setSaving(false);
        }
    }

    function beginEdit(row) {
        setEditingId(row.id);
        setEditForm({
            description: row.description || "",
            qty: row.qty ?? "",
            unit_price: row.unit_price ?? "",
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setEditForm({ description: "", qty: "", unit_price: "" });
    }

    async function saveEdit() {
        const { error } = await supabaseAdmin
            .from("work_order_items")
            .update({
                description: editForm.description?.trim() || null,
                qty: Number(editForm.qty || 0),
                unit_price: Number(editForm.unit_price || 0),
            })
            .eq("id", editingId);
        if (error) {
            alert(error.message);
            return;
        }
        cancelEdit();
        await load();
        onChanged?.();
    }

    async function remove(id) {
        if (!window.confirm("Bu parçayı silmek istiyor musun?")) return;
        const { error } = await supabaseAdmin.from("work_order_items").delete().eq("id", id);
        if (error) {
            alert(error.message);
            return;
        }
        await load();
        onChanged?.();
    }

    const partsTotal = useMemo(
        () => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
        [rows]
    );

    return (
        <div className="space-y-3">
            {/* Form */}
            <form onSubmit={addPart} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-gray-500">Parça Açıklaması</label>
                    <input
                        className="w-full border rounded px-2 py-1.5"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Örn: Fuser ünitesi"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Adet</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-28 border rounded px-2 py-1.5"
                        value={form.qty}
                        onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Birim Fiyat</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-32 border rounded px-2 py-1.5"
                        value={form.unit_price}
                        onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
                    />
                </div>
                <button
                    disabled={saving}
                    className={`px-3 py-2 rounded bg-indigo-600 text-white ${saving ? "opacity-60" : ""
                        }`}
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
                    <div className="p-3 text-gray-500">Parça eklenmemiş.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">Açıklama</th>
                                <th className="px-3 py-2 text-right">Adet</th>
                                <th className="px-3 py-2 text-right">Birim</th>
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
                                                onChange={(e) =>
                                                    setEditForm((f) => ({ ...f, description: e.target.value }))
                                                }
                                            />
                                        ) : (
                                            r.description
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-24 border rounded px-2 py-1.5 text-right"
                                                value={editForm.qty}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({ ...f, qty: e.target.value }))
                                                }
                                            />
                                        ) : (
                                            TL(r.qty)
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {editingId === r.id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-28 border rounded px-2 py-1.5 text-right"
                                                value={editForm.unit_price}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({ ...f, unit_price: e.target.value }))
                                                }
                                            />
                                        ) : (
                                            TL(r.unit_price)
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">{TL(r.amount)}</td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                        {editingId === r.id ? (
                                            <div className="inline-flex gap-1">
                                                <button
                                                    onClick={saveEdit}
                                                    className="p-1 rounded border text-green-700 hover:bg-green-50"
                                                    title="Kaydet"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1 rounded border hover:bg-gray-50"
                                                    title="Vazgeç"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="inline-flex gap-1">
                                                <button
                                                    onClick={() => beginEdit(r)}
                                                    className="p-1 rounded border hover:bg-gray-50"
                                                    title="Düzenle"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => remove(r.id)}
                                                    className="p-1 rounded border hover:bg-gray-50 text-red-600"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {/* toplam satırı */}
                            <tr className="bg-gray-50">
                                <td className="px-3 py-2 font-medium" colSpan={3}>
                                    Parça Toplamı
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">{TL(partsTotal)}</td>
                                <td className="px-3 py-2"></td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
