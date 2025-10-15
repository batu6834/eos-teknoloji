// src/components/tickets/TicketsSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabaseAdmin from "../../supabaseAdminClient";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";
import TicketViewModal from "./TicketViewModal";
import CompanyQuoteCell from "../quotes/CompanyQuoteCell";

/* küçük yardımcı: debounce */
function useDebouncedValue(value, delay = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

export default function TicketsSection({ companyId }) {
    const PAGE_SIZE = 10;
    const BUCKET = process.env.REACT_APP_TICKET_BUCKET || "ticket-attachments";

    const [q, setQ] = useState("");
    const debouncedQ = useDebouncedValue(q, 300);
    const [status, setStatus] = useState("all"); // all | OPEN | CLOSED
    const [page, setPage] = useState(1);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const [viewOpen, setViewOpen] = useState(false);
    const [viewId, setViewId] = useState(null);
    const [techsById, setTechsById] = useState({});
    const [printersById, setPrintersById] = useState({});

    const navigate = useNavigate();

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil((total || 0) / PAGE_SIZE)),
        [total]
    );

    async function fetchTickets() {
        setLoading(true);
        setErr(null);

        // COUNT
        const baseCount = supabaseAdmin
            .from("support_tickets")
            .select("id", { count: "exact", head: true })
            .or(`user_uuid.eq.${companyId},user_id.eq.${companyId}`);

        if (status !== "all") baseCount.eq("status", status);
        if (debouncedQ.trim()) {
            baseCount.or(
                `subject.ilike.%${debouncedQ.trim()}%,message.ilike.%${debouncedQ.trim()}%`
            );
        }

        const { count, error: countErr } = await baseCount;
        if (countErr) {
            setErr(countErr.message);
            setLoading(false);
            return;
        }
        setTotal(count ?? 0);

        // LIST
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const applyFilters = (query) => {
            query.or(`user_uuid.eq.${companyId},user_id.eq.${companyId}`);
            if (status !== "all") query.eq("status", status);
            if (debouncedQ.trim()) {
                query.or(
                    `subject.ilike.%${debouncedQ.trim()}%,message.ilike.%${debouncedQ.trim()}%`
                );
            }
            return query;
        };

        let list = await applyFilters(
            supabaseAdmin
                .from("support_tickets")
                .select(
                    "id, status, subject, message, created_at, printer_id, assigned_to, assigned_at"
                )
                .order("created_at", { ascending: false })
                .range(from, to)
        );

        if (list.error) {
            list = await applyFilters(
                supabaseAdmin
                    .from("support_tickets")
                    .select(
                        "id, status, subject, message, printer_id, assigned_to, assigned_at"
                    )
                    .order("id", { ascending: false })
                    .range(from, to)
            );
        }

        if (list.error) {
            setErr(list.error.message);
            setRows([]);
            setLoading(false);
            return;
        }

        const tickets = list.data ?? [];

        // Ekler + public URL
        let byTicket = {};
        if (tickets.length) {
            const ids = tickets.map((t) => t.id);
            const { data: atts } = await supabaseAdmin
                .from("ticket_attachments")
                .select("id, ticket_id, path, created_at")
                .in("ticket_id", ids);

            if (Array.isArray(atts)) {
                for (const a of atts) {
                    const { data: pu } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(a.path);
                    const url = pu?.publicUrl || "";
                    (byTicket[a.ticket_id] ||= []).push({
                        id: a.id,
                        path: a.path,
                        url,
                        created_at: a.created_at,
                    });
                }
            }
        }

        setRows(tickets.map((t) => ({ ...t, attachments: byTicket[t.id] || [] })));
        setLoading(false);
    }

    // filtre → sayfa 1
    useEffect(() => {
        setPage(1);
    }, [debouncedQ, status]);

    // fetch
    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, page, status, debouncedQ]);

    // realtime
    useEffect(() => {
        const ch = supabaseAdmin
            .channel(`tickets-company-${companyId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "support_tickets", filter: `user_uuid=eq.${companyId}` },
                () => fetchTickets()
            )
            .subscribe();
        return () => supabaseAdmin.removeChannel(ch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    // yazıcı map
    useEffect(() => {
        let alive = true;
        (async () => {
            const { data, error } = await supabaseAdmin
                .from("company_printers")
                .select("id, asset_code, department, floor")
                .eq("company_id", companyId);

            if (!alive) return;
            if (error) { setPrintersById({}); return; }
            const map = {};
            for (const r of data || []) map[r.id] = r;
            setPrintersById(map);
        })();
        return () => { alive = false; };
    }, [companyId]);

    // teknisyen map
    useEffect(() => {
        let alive = true;
        (async () => {
            const { data, error } = await supabaseAdmin
                .from("profiles")
                .select("id, display_name")
                .eq("role", "tech")
                .eq("approved", true);

            if (!alive) return;
            if (error) { setTechsById({}); return; }
            const map = {};
            for (const t of data || []) map[t.id] = t.display_name;
            setTechsById(map);
        })();
        return () => { alive = false; };
    }, []);

    // durum toggle
    async function toggleStatus(t) {
        try {
            const newStatus = t.status === "CLOSED" ? "OPEN" : "CLOSED";
            const { error } = await supabaseAdmin
                .from("support_tickets")
                .update({ status: newStatus })
                .eq("id", t.id);

            if (error) {
                console.error("Durum güncellenemedi:", error);
                alert("Güncellenemedi: " + error.message);
                return;
            }
            fetchTickets();
        } catch (err) {
            console.error("toggleStatus hata:", err);
            alert("Beklenmedik hata: " + err.message);
        }
    }

    // İşi başlat / yönlendir
    async function startWork(t) {
        // mevcut iş emri var mı?
        const { data: existing } = await supabaseAdmin
            .from("work_orders")
            .select("id")
            .eq("ticket_id", t.id)
            .single();

        if (existing?.id) {
            navigate(`/admin/work-orders/${existing.id}`);
            return;
        }

        // yoksa oluştur
        const { data, error } = await supabaseAdmin
            .from("work_orders")
            .insert({
                ticket_id: t.id,
                assigned_to: t.assigned_to || null,
                created_by: (await supabase.auth.getUser())?.data?.user?.id || null,
            })
            .select("id")
            .single();

        if (error) {
            alert("İş emri oluşturulamadı: " + error.message);
            return;
        }
        navigate(`/admin/work-orders/${data.id}`);
    }

    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Destek Kayıtları</h2>

            {/* Kontroller */}
            <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Ara</label>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Konu/mesajda ara…"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>

                <div className="flex gap-2">
                    {["all", "OPEN", "CLOSED"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-3 py-2 rounded-lg border ${status === s ? "bg-gray-900 text-white" : "bg-white"
                                }`}
                        >
                            {s === "all" ? "Tümü" : s === "OPEN" ? "Açık" : "Kapalı"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tablo */}
            <div className="bg-white rounded-xl border overflow-x-auto">
                {loading ? (
                    <div className="p-10 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Yükleniyor…
                    </div>
                ) : err ? (
                    <div className="p-5 text-red-600">{err}</div>
                ) : rows.length === 0 ? (
                    <div className="p-10 text-gray-600">Kayıt bulunamadı.</div>
                ) : (
                    <table className="min-w-[1080px] table-fixed text-sm">
                        <colgroup>
                            <col className="w-24" />
                            <col className="w-20" />
                            <col className="w-64" />
                            <col className="w-[420px]" />
                            <col className="w-24" />
                            <col className="w-40" />
                            <col className="w-40" />
                            <col className="w-40" />
                            <col className="w-36" />
                        </colgroup>

                        <thead className="bg-gray-50 text-gray-700">
                            <tr className="uppercase text-xs tracking-wide">
                                <th className="px-3 py-2 text-left">Durum</th>
                                <th className="px-3 py-2 text-left">Yazıcı</th>
                                <th className="px-3 py-2 text-left">Konu</th>
                                <th className="px-3 py-2 text-left">Mesaj</th>
                                <th className="px-3 py-2 text-left">Ekler</th>
                                <th className="px-3 py-2 text-left">Atanan</th>
                                <th className="px-3 py-2 text-left">Teklif</th>
                                <th className="px-3 py-2 text-left">Tarih</th>
                                <th className="px-3 py-2 text-right">İşlem</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {rows.map((t) => {
                                const p = t.printer_id ? printersById[t.printer_id] : null;
                                return (
                                    <tr key={t.id} className="align-top group">
                                        {/* Durum */}
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status === "CLOSED"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {t.status}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                #{(t.id || "").toString().slice(0, 8)}
                                            </div>
                                        </td>

                                        {/* Yazıcı */}
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {p?.asset_code ? (
                                                <span
                                                    className="inline-block rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700"
                                                    title={[p.department, p.floor && `${p.floor}. Kat`]
                                                        .filter(Boolean)
                                                        .join(" • ")}
                                                >
                                                    {p.asset_code}
                                                </span>
                                            ) : (
                                                <em className="text-gray-400">—</em>
                                            )}
                                        </td>

                                        {/* Konu */}
                                        <td className="px-3 py-2">
                                            <div className="font-semibold text-gray-900">
                                                {t.subject || <em>—</em>}
                                            </div>
                                        </td>

                                        {/* Mesaj */}
                                        <td className="px-3 py-2 text-gray-700">
                                            <span className="line-clamp-3 max-w-[420px] block whitespace-pre-wrap">
                                                {t.message}
                                            </span>
                                        </td>

                                        {/* Ekler */}
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {t.attachments?.length ? (
                                                <div className="flex items-center gap-2">
                                                    {t.attachments.slice(0, 3).map((a) =>
                                                        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.path) ? (
                                                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                                                                <img
                                                                    src={a.url}
                                                                    alt=""
                                                                    className="w-6 h-6 rounded object-cover border"
                                                                />
                                                            </a>
                                                        ) : null
                                                    )}
                                                    {t.attachments.some((a) => !/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.path)) && (
                                                        <a
                                                            href={
                                                                t.attachments.find(
                                                                    (a) => !/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.path)
                                                                )?.url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center text-xs px-2 py-1 border rounded"
                                                        >
                                                            📎 Dosya
                                                        </a>
                                                    )}
                                                    {t.attachments.length > 3 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{t.attachments.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>

                                        {/* Atanan */}
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {t.assigned_to ? (
                                                <span
                                                    className="inline-block rounded-full px-2 py-0.5 text-xs bg-purple-100 text-purple-700"
                                                    title={
                                                        t.assigned_at
                                                            ? `Atandı: ${new Date(t.assigned_at).toLocaleString("tr-TR")}`
                                                            : ""
                                                    }
                                                >
                                                    {techsById[t.assigned_to] ||
                                                        `#${t.assigned_to.toString().slice(0, 8)}`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Atanmamış</span>
                                            )}
                                        </td>

                                        {/* Teklif */}
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <CompanyQuoteCell ticketId={t.id} showActions={false} />
                                        </td>

                                        {/* Tarih */}
                                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                                            {t.created_at ? new Date(t.created_at).toLocaleString("tr-TR") : "—"}
                                        </td>

                                        {/* İşlem */}
                                        <td className="px-3 py-2 whitespace-nowrap text-right">
                                            <div className="inline-flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setViewId(t.id);
                                                        setViewOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 rounded-md border"
                                                >
                                                    Göz At
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(t)}
                                                    className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                                                >
                                                    {t.status === "CLOSED" ? "Yeniden Aç" : "Kapat"}
                                                </button>
                                                <button
                                                    onClick={() => startWork(t)}
                                                    className="px-3 py-1.5 rounded-md border"
                                                >
                                                    İşi Başlat
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Sayfalama */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Toplam {total} kayıt • Sayfa {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className={`px-3 py-1.5 rounded-md border ${page <= 1 ? "opacity-50 cursor-not-allowed" : "bg-white"
                            }`}
                    >
                        Önceki
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className={`px-3 py-1.5 rounded-md border ${page >= totalPages ? "opacity-50 cursor-not-allowed" : "bg-white"
                            }`}
                    >
                        Sonraki
                    </button>
                </div>
            </div>

            <TicketViewModal
                open={viewOpen}
                ticketId={viewId}
                onClose={() => setViewOpen(false)}
                onChanged={() => fetchTickets()}
            />
        </section>
    );
}
