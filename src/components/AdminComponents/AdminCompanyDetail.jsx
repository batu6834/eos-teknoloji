// src/components/AdminComponents/AdminCompanyDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import supabaseAdmin from "../../supabaseAdminClient";
import { Loader2, Paperclip, X } from "lucide-react";
import TicketsSection from "../tickets/TicketsSection";

export default function AdminCompanyDetail() {
    const { id } = useParams();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // Sekme
    const [params, setParams] = useSearchParams();
    const activeTab = params.get("tab") || "overview";

    // Metrikler
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsErr, setStatsErr] = useState(null);

    // Firma bilgisi
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setErr(null);
            const { data, error } = await supabaseAdmin
                .from("profiles")
                .select("id, company_name, approved, role")
                .eq("id", id)
                .eq("role", "company")
                .single();

            if (!alive) return;
            if (error) {
                setErr(error.message);
                setCompany(null);
            } else {
                setCompany(data);
            }
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, [id]);

    // Destek kayıt sayıları — OR filtresi ile tek seferde (çift sayımı engeller)
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setStatsLoading(true);
            setStatsErr(null);

            const filterByCompany = (q) =>
                q.or(`user_uuid.eq.${id},user_id.eq.${id}`);

            try {
                // total
                const { count: total, error: tErr } = await filterByCompany(
                    supabaseAdmin
                        .from("support_tickets")
                        .select("id", { count: "exact", head: true })
                );

                // open
                const { count: openC, error: oErr } = await filterByCompany(
                    supabaseAdmin
                        .from("support_tickets")
                        .select("id", { count: "exact", head: true })
                        .eq("status", "OPEN")
                );

                // closed
                const { count: closedC, error: cErr } = await filterByCompany(
                    supabaseAdmin
                        .from("support_tickets")
                        .select("id", { count: "exact", head: true })
                        .eq("status", "CLOSED")
                );

                if (cancelled) return;
                if (tErr || oErr || cErr) {
                    setStatsErr(
                        (tErr || oErr || cErr)?.message || "İstatistikler alınamadı."
                    );
                }

                setStats({
                    total: total ?? 0,
                    open: openC ?? 0,
                    closed: closedC ?? 0,
                });
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) return <div className="p-6">Yükleniyor…</div>;
    if (err || !company) {
        return (
            <div className="p-6 space-y-3">
                <p>Firma bulunamadı veya hata: {err || "—"}</p>
                <Link to="/admin?tab=firmalar" className="text-blue-600 underline">
                    Firmalara dön
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        {company.company_name || "İsimsiz Firma"}
                    </h1>
                    <p className="text-sm text-gray-500">ID: {company.id}</p>
                </div>
                <div>
                    {company.approved ? (
                        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
                            Onaylı
                        </span>
                    ) : (
                        <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-700">
                            Askıda
                        </span>
                    )}
                </div>
            </div>

            {/* Sekme barı */}
            <div className="flex gap-2">
                {[
                    { key: "overview", label: "Genel Bakış" },
                    { key: "tickets", label: "Destek Kayıtları" },
                    { key: "printers", label: "Yazıcılar" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setParams({ tab: t.key })}
                        className={`px-3 py-2 rounded-lg border ${activeTab === t.key ? "bg-gray-900 text-white" : "bg-white"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Sekmeler */}
            {activeTab === "overview" && (
                <>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <MetricCard
                            label="Toplam Kayıt"
                            value={statsLoading ? "—" : stats.total}
                        />
                        <MetricCard
                            label="Açık Kayıt"
                            value={statsLoading ? "—" : stats.open}
                        />
                        <MetricCard
                            label="Kapalı Kayıt"
                            value={statsLoading ? "—" : stats.closed}
                        />
                    </div>
                    {statsErr && (
                        <div className="rounded-md bg-red-50 p-3 text-red-700 border border-red-200">
                            {statsErr}
                        </div>
                    )}
                </>
            )}

            {activeTab === "tickets" && <TicketsSection companyId={id} />}
            {activeTab === "printers" && (
                <PrintersSection companyId={id} companyName={company.company_name} />
            )}

            {/* Geri dönüş */}
            <div className="flex gap-3">
                <Link to="/admin?tab=firmalar" className="px-4 py-2 rounded-xl border">
                    ← Firmalara Dön
                </Link>
            </div>
        </div>
    );
}

/* ------------------------------- küçük yardımcılar ------------------------------- */

function MetricCard({ label, value }) {
    return (
        <div className="p-4 rounded-xl border bg-white">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    );
}

/* ------------------------------- Printers Section -------------------------------- */
function PrintersSection({ companyId, companyName }) {
    const BUCKET = process.env.REACT_APP_TICKET_BUCKET || "ticket-attachments";

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [assetCode, setAssetCode] = useState("");
    const [model, setModel] = useState("");
    const [serial, setSerial] = useState("");
    const [department, setDepartment] = useState("");
    const [floor, setFloor] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formErr, setFormErr] = useState("");

    // Talep aç (inline)
    const [ticketFor, setTicketFor] = useState(null); // row | null
    const [tSubject, setTSubject] = useState("");
    const [tMessage, setTMessage] = useState("");
    const [tPriority, setTPriority] = useState("Normal"); // Düşük | Normal | Yüksek
    const [tCategory, setTCategory] = useState("Donanım"); // Donanım | Yazılım | Sarf
    const [tAssign, setTAssign] = useState(""); // teknisyen id
    const [tVisible, setTVisible] = useState(true);
    const [tFiles, setTFiles] = useState([]); // File[]
    const [tUploading, setTUploading] = useState(false);
    const [tSubmitting, setTSubmitting] = useState(false);
    const [tErr, setTErr] = useState("");

    // Teknisyen listesi
    const [techs, setTechs] = useState([]);

    const fetchPrinters = async () => {
        setLoading(true);
        setErr(null);
        const { data, error } = await supabaseAdmin
            .from("company_printers")
            .select(
                "id, asset_code, model, serial_no, department, floor, notes, created_at"
            )
            .eq("company_id", companyId)
            .order("created_at", { ascending: false });

        if (error) {
            setErr(error.message);
            setRows([]);
        } else {
            setRows(data ?? []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPrinters();
        // eslint-disable-next-line
    }, [companyId]);

    useEffect(() => {
        const ch = supabaseAdmin
            .channel(`printers-${companyId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "company_printers",
                    filter: `company_id=eq.${companyId}`,
                },
                () => fetchPrinters()
            )
            .subscribe();
        return () => {
            supabaseAdmin.removeChannel(ch);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    // Basit kod önerici
    const suggestAssetCode = async () => {
        const prefix = (companyName?.trim()?.[0] || "X").toUpperCase();
        const { data, error } = await supabaseAdmin
            .from("company_printers")
            .select("asset_code")
            .eq("company_id", companyId)
            .ilike("asset_code", `${prefix}%`);
        if (error) {
            setFormErr("Kod önerilemedi: " + error.message);
            return;
        }
        let maxN = 0;
        for (const r of data || []) {
            const m = (r.asset_code || "")
                .toUpperCase()
                .trim()
                .match(new RegExp(`^${prefix}(\\d+)$`, "i"));
            if (m) maxN = Math.max(maxN, parseInt(m[1], 10) || 0);
        }
        setAssetCode(`${prefix}${String(maxN + 1).padStart(3, "0")}`);
        setFormErr("");
    };

    const onAdd = async (e) => {
        e.preventDefault();
        setFormErr("");

        const code = (assetCode || "").toUpperCase().trim();
        if (!code) {
            setFormErr("Lütfen yazıcı kodu girin (örn: P001).");
            return;
        }
        if (!/^[A-Z][0-9]{3,}$/.test(code)) {
            setFormErr("Kod biçimi geçersiz. Örn: P001");
            return;
        }
        if (!model.trim() && !serial.trim()) {
            setFormErr("En azından Model veya Seri No girin.");
            return;
        }

        setSubmitting(true);
        const { error } = await supabaseAdmin.from("company_printers").insert({
            company_id: companyId,
            asset_code: code,
            model: model.trim() || null,
            serial_no: serial.trim() || null,
            department: department.trim() || null,
            floor: floor.trim() || null,
            notes: notes.trim() || null,
        });
        setSubmitting(false);

        if (error) {
            if (error.code === "23505")
                setFormErr("Bu kod bu firmada zaten kullanılıyor.");
            else setFormErr("Eklenemedi: " + error.message);
            return;
        }

        setAssetCode("");
        setModel("");
        setSerial("");
        setDepartment("");
        setFloor("");
        setNotes("");
        setShowForm(false);
        fetchPrinters();
    };

    const onDelete = async (row) => {
        if (!window.confirm("Bu yazıcıyı silmek istediğinize emin misiniz?")) return;
        const { error } = await supabaseAdmin
            .from("company_printers")
            .delete()
            .eq("id", row.id);
        if (error) alert("Silinemedi: " + error.message);
        else fetchPrinters();
    };

    // Teknisyenleri çek
    useEffect(() => {
        let alive = true;
        (async () => {
            const { data, error } = await supabaseAdmin
                .from("profiles")
                .select("id, role, display_name")
                .eq("role", "tech");
            if (!alive) return;
            if (error) {
                setTechs([]);
                return;
            }
            setTechs(data || []);
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Kategori/Öncelik değişince mesaj içinde senkron tut
    useEffect(() => {
        setTMessage((prev) => {
            if (!prev) return prev;
            const lines = prev.split("\n");
            const iK = lines.findIndex((l) => l.startsWith("[Kategori]"));
            const iP = lines.findIndex((l) => l.startsWith("[Öncelik]"));
            if (iK !== -1) lines[iK] = `[Kategori] ${tCategory}`;
            if (iP !== -1) lines[iP] = `[Öncelik] ${tPriority}`;
            return lines.join("\n");
        });
    }, [tCategory, tPriority]);

    const openTicketFor = (row) => {
        setTicketFor(row);
        const label = [
            row.asset_code ? `Kod: ${row.asset_code}` : null,
            row.model ? `Model: ${row.model}` : null,
            row.department ? `Departman: ${row.department}` : null,
            row.floor ? `Kat: ${row.floor}` : null,
            row.serial_no ? `Seri: ${row.serial_no}` : null,
        ]
            .filter(Boolean)
            .join(" • ");

        setTSubject(
            row.asset_code ? `${row.asset_code} için destek talebi` : "Yazıcı için destek talebi"
        );
        setTMessage(
            `[Kategori] ${tCategory}
[Öncelik] ${tPriority}

Firma: ${companyName || companyId}
${label || "Yazıcı detayları belirtilmedi."}

Lütfen problemi burada özetleyin...
- Belirtiler:
- Ne zaman başladı:
- Ekran/LED uyarısı:`
        );
        setTPriority("Normal");
        setTCategory("Donanım");
        setTAssign("");
        setTVisible(true);
        setTFiles([]);
        setTErr("");
    };

    const onPickFiles = (e) => {
        const chosen = Array.from(e.target.files || []);
        const all = [...tFiles, ...chosen];
        if (all.length > 5) {
            setTErr("En fazla 5 dosya ekleyebilirsiniz.");
            return;
        }
        for (const f of chosen) {
            if (!(f.type.startsWith("image/") || f.type === "application/pdf")) {
                setTErr("Sadece resim veya PDF yükleyin.");
                return;
            }
            if (f.size > 5 * 1024 * 1024) {
                setTErr("Her dosya en fazla 5MB olabilir.");
                return;
            }
        }
        setTFiles(all);
        setTErr("");
    };
    const removeFile = (i) => setTFiles((arr) => arr.filter((_, idx) => idx !== i));

    const uploadAttachments = async (ticketId) => {
        if (!tFiles.length) return;
        setTUploading(true);
        try {
            for (const f of tFiles) {
                const ext = f.name.split(".").pop() || "bin";
                const path = `tickets/${ticketId}/${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}.${ext}`;
                const { error: upErr } = await supabaseAdmin.storage
                    .from(BUCKET)
                    .upload(path, f, { cacheControl: "3600", upsert: false });
                if (upErr) throw upErr;
                const { error: rowErr } = await supabaseAdmin
                    .from("ticket_attachments")
                    .insert({ ticket_id: ticketId, path });
                if (rowErr) throw rowErr;
            }
        } finally {
            setTUploading(false);
        }
    };

    const submitTicket = async (e) => {
        e.preventDefault();
        setTErr("");
        if (!tSubject.trim() || !tMessage.trim()) {
            setTErr("Lütfen konu ve mesaj girin.");
            return;
        }

        setTSubmitting(true);
        const payload = {
            user_uuid: companyId,
            printer_id: ticketFor?.id || null,
            subject: tSubject.trim(),
            message: tMessage.trim(),
            status: "OPEN",            // ✅ BÜYÜK HARF
            source: "admin",
            visible_to_company: tVisible,
            assigned_to: tAssign || null,
            assigned_at: tAssign ? new Date().toISOString() : null,
            category: tCategory,
            priority: tPriority,
        };

        const { data, error } = await supabaseAdmin
            .from("support_tickets")
            .insert(payload)
            .select("id")
            .single();

        if (error) {
            setTSubmitting(false);
            setTErr("Talep açılamadı: " + error.message);
            return;
        }

        const ticketId = data.id;
        await uploadAttachments(ticketId);

        setTSubmitting(false);
        setTicketFor(null);
        setTSubject("");
        setTMessage("");
        setTFiles([]);
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Yazıcılar</h2>
                <button
                    onClick={() => setShowForm((s) => !s)}
                    className="px-3 py-2 rounded-lg border"
                >
                    {showForm ? "Formu Kapat" : "Yazıcı Ekle"}
                </button>
            </div>

            {/* Yazıcı ekleme formu */}
            {showForm && (
                <form
                    onSubmit={onAdd}
                    className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-4"
                >
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Yazıcı Kodu</label>
                        <div className="flex gap-2">
                            <input
                                value={assetCode}
                                onChange={(e) => setAssetCode(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Örn: P001"
                            />
                            <button
                                type="button"
                                onClick={suggestAssetCode}
                                className="px-3 py-2 rounded-lg border"
                            >
                                Kod Öner
                            </button>
                        </div>
                        {formErr && <div className="mt-2 text-sm text-red-600">{formErr}</div>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Model</label>
                        <input
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Örn: HP LaserJet Pro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Seri No</label>
                        <input
                            value={serial}
                            onChange={(e) => setSerial(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Örn: SN123456"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Departman</label>
                        <input
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Örn: Muhasebe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Kat</label>
                        <input
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Örn: 3. Kat"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Notlar</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Opsiyonel açıklama…"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-4 py-2 rounded-lg text-white ${submitting ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            {submitting ? "Ekleniyor…" : "Ekle"}
                        </button>
                    </div>
                </form>
            )}

            {/* Liste */}
            <div className="bg-white rounded-xl border overflow-x-auto">
                {loading ? (
                    <div className="p-10 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Yükleniyor…
                    </div>
                ) : err ? (
                    <div className="p-5 text-red-600">{err}</div>
                ) : rows.length === 0 ? (
                    <div className="p-10 text-gray-600">Bu firmaya ait yazıcı bulunamadı.</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="uppercase text-xs tracking-wide">
                                <th className="px-4 py-3 text-left">Kod</th>
                                <th className="px-4 py-3 text-left">Model</th>
                                <th className="px-4 py-3 text-left">Seri No</th>
                                <th className="px-4 py-3 text-left">Departman</th>
                                <th className="px-4 py-3 text-left">Kat</th>
                                <th className="px-4 py-3 text-left">Notlar</th>
                                <th className="px-4 py-3 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t align-top">
                                    <td className="px-4 py-3 font-medium">{r.asset_code || <em>—</em>}</td>
                                    <td className="px-4 py-3">{r.model || <em>—</em>}</td>
                                    <td className="px-4 py-3">{r.serial_no || <em>—</em>}</td>
                                    <td className="px-4 py-3">{r.department || <em>—</em>}</td>
                                    <td className="px-4 py-3">{r.floor || <em>—</em>}</td>
                                    <td className="px-4 py-3">{r.notes || <em>—</em>}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openTicketFor(r)}
                                                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                                            >
                                                Talep Aç
                                            </button>
                                            <button
                                                onClick={() => onDelete(r)}
                                                className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                                            >
                                                Sil
                                            </button>
                                        </div>

                                        {/* Inline gelişmiş ticket formu */}
                                        {ticketFor?.id === r.id && (
                                            <form
                                                onSubmit={submitTicket}
                                                className="mt-3 p-4 border rounded-lg bg-gray-50 space-y-3"
                                            >
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">
                                                            Konu
                                                        </label>
                                                        <input
                                                            value={tSubject}
                                                            onChange={(e) => setTSubject(e.target.value)}
                                                            className="w-full border rounded px-2 py-1.5"
                                                            placeholder="Konu"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="block text-xs text-gray-600 mb-1">
                                                                Kategori
                                                            </label>
                                                            <select
                                                                value={tCategory}
                                                                onChange={(e) => setTCategory(e.target.value)}
                                                                className="w-full border rounded px-2 py-1.5"
                                                            >
                                                                <option>Donanım</option>
                                                                <option>Yazılım</option>
                                                                <option>Sarf</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-600 mb-1">
                                                                Öncelik
                                                            </label>
                                                            <select
                                                                value={tPriority}
                                                                onChange={(e) => setTPriority(e.target.value)}
                                                                className="w-full border rounded px-2 py-1.5"
                                                            >
                                                                <option value="LOW">Düşük</option>
                                                                <option value="NORMAL">Normal</option>
                                                                <option value="HIGH">Yüksek</option>
                                                            </select>

                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-600 mb-1">
                                                                Teknisyen
                                                            </label>
                                                            <select
                                                                value={tAssign}
                                                                onChange={(e) => setTAssign(e.target.value)}
                                                                className="w-full border rounded px-2 py-1.5"
                                                            >
                                                                <option value="">— seçilmedi —</option>
                                                                {techs.map((t) => (
                                                                    <option key={t.id} value={t.id}>
                                                                        {t.display_name?.trim()
                                                                            ? t.display_name
                                                                            : `#${t.id.slice(0, 8)}`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Kategori: <b>{tCategory}</b> • Öncelik:{" "}
                                                        <b>{tPriority}</b>
                                                    </div>
                                                    <label className="block text-xs text-gray-600 mb-1">
                                                        Mesaj
                                                    </label>
                                                    <textarea
                                                        value={tMessage}
                                                        onChange={(e) => setTMessage(e.target.value)}
                                                        rows={5}
                                                        className="w-full border rounded px-2 py-1.5"
                                                        placeholder="Sorunu detaylandırın"
                                                    />
                                                    <div className="mt-1 text-[11px] text-gray-400">
                                                        Kategori/Öncelik bilgisi üstte satır olarak mesajın
                                                        içine gömülür.
                                                    </div>
                                                </div>

                                                {/* Dosya ekleri */}
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">
                                                        Ekler (isteğe bağlı)
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="inline-flex items-center px-2 py-1.5 border rounded cursor-pointer bg-white hover:bg-gray-50">
                                                            <Paperclip size={14} className="mr-1" />
                                                            Dosya Seç
                                                            <input
                                                                type="file"
                                                                multiple
                                                                accept="image/*,application/pdf"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const chosen = Array.from(
                                                                        e.target.files || []
                                                                    );
                                                                    const all = [...tFiles, ...chosen];
                                                                    if (all.length > 5) {
                                                                        setTErr(
                                                                            "En fazla 5 dosya ekleyebilirsiniz."
                                                                        );
                                                                        return;
                                                                    }
                                                                    for (const f of chosen) {
                                                                        if (
                                                                            !(
                                                                                f.type.startsWith("image/") ||
                                                                                f.type === "application/pdf"
                                                                            )
                                                                        ) {
                                                                            setTErr(
                                                                                "Sadece resim veya PDF yükleyin."
                                                                            );
                                                                            return;
                                                                        }
                                                                        if (f.size > 5 * 1024 * 1024) {
                                                                            setTErr(
                                                                                "Her dosya en fazla 5MB olabilir."
                                                                            );
                                                                            return;
                                                                        }
                                                                    }
                                                                    setTFiles(all);
                                                                    setTErr("");
                                                                }}
                                                            />
                                                        </label>
                                                        <span className="text-[11px] text-gray-400">
                                                            En fazla 5 dosya, her biri 5MB.
                                                        </span>
                                                    </div>
                                                    {tFiles.length > 0 && (
                                                        <ul className="mt-2 space-y-1">
                                                            {tFiles.map((f, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="flex items-center justify-between text-xs bg-white border rounded px-2 py-1"
                                                                >
                                                                    <span className="truncate">{f.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setTFiles((arr) =>
                                                                                arr.filter((_, idx) => idx !== i)
                                                                            )
                                                                        }
                                                                        className="text-gray-500 hover:text-gray-700"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={tVisible}
                                                            onChange={(e) => setTVisible(e.target.checked)}
                                                        />
                                                        Firmaya görünür olsun
                                                    </label>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setTicketFor(null)}
                                                            className="px-3 py-1.5 rounded-md border bg-white"
                                                        >
                                                            Vazgeç
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={tSubmitting || tUploading}
                                                            className={`px-3 py-1.5 rounded-md text-white ${tSubmitting || tUploading
                                                                    ? "bg-indigo-400"
                                                                    : "bg-indigo-600 hover:bg-indigo-700"
                                                                }`}
                                                        >
                                                            {tUploading
                                                                ? "Ekler yükleniyor…"
                                                                : tSubmitting
                                                                    ? "Gönderiliyor…"
                                                                    : "Talebi Gönder"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {tErr && (
                                                    <div className="text-xs text-red-600">{tErr}</div>
                                                )}
                                            </form>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

