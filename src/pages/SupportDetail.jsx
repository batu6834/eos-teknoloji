import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";
import CompanyQuoteCell from "../components/quotes/CompanyQuoteCell"; // 👈 EKLENDİ

const BUCKET = process.env.REACT_APP_TICKET_BUCKET || "ticket-attachments";
const TL = (n) =>
    Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TicketBadge = ({ status }) => {
    const labelMap = {
        OPEN: "Açık",
        IN_PROGRESS: "Devam Ediyor",
        WAITING_PARTS: "Teklif/Parça Beklemede",
        RESOLVED: "Çözüldü",
        SHIPPED: "Kargolandı",
    };
    const colorMap = {
        OPEN: "bg-gray-100 text-gray-800",
        IN_PROGRESS: "bg-blue-100 text-blue-800",
        WAITING_PARTS: "bg-yellow-100 text-yellow-800",
        RESOLVED: "bg-green-100 text-green-800",
        SHIPPED: "bg-purple-100 text-purple-800",
    };
    const label = labelMap[status] || status;
    const cls = colorMap[status] || "bg-gray-100 text-gray-800";
    return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{label}</span>;
};

export default function SupportDetail() {
    const { id } = useParams(); // ticket id
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [bump, setBump] = useState(0); // 👈 karar sonrası yeniden yüklemek için

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // Ticket
                const { data, error } = await supabase
                    .from("support_tickets")
                    .select(
                        "id, subject, message, status, created_at, printer_id, printer:company_printers(asset_code, model)"
                    )
                    .eq("id", id)
                    .single();
                if (cancelled) return;
                if (error) throw error;
                setTicket(data);

                // Attachments
                const { data: att } = await supabase
                    .from("ticket_attachments")
                    .select("id, path, created_at")
                    .eq("ticket_id", id)
                    .order("created_at", { ascending: true });
                if (!cancelled) setAttachments(att || []);

                // Offer (latest work order + items)
                const { data: wo } = await supabase
                    .from("work_orders")
                    .select("id, status, hold_reason, created_at")
                    .eq("ticket_id", id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (wo?.id) {
                    const { data: parts } = await supabase
                        .from("work_order_items")
                        .select("id, description, qty, unit_price, amount")
                        .eq("work_order_id", wo.id)
                        .eq("kind", "PART")
                        .order("created_at", { ascending: true });

                    const { data: labor } = await supabase
                        .from("work_order_items")
                        .select("id, description, hours, hourly_rate, amount")
                        .eq("work_order_id", wo.id)
                        .eq("kind", "LABOR")
                        .order("created_at", { ascending: true });

                    setOffer({
                        workOrder: wo,
                        parts: parts || [],
                        labor: labor || [],
                    });
                } else {
                    setOffer(null);
                }
            } catch (e) {
                if (!cancelled) {
                    setErr(e?.message || "Kayıt yüklenemedi.");
                    setTicket(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, bump]); // 👈 bump değişince yeniden yükle

    const partsTotal = useMemo(
        () =>
            (offer?.parts || []).reduce(
                (s, r) => s + Number(r.amount || r.qty * r.unit_price || 0),
                0
            ),
        [offer]
    );
    const laborTotal = useMemo(
        () =>
            (offer?.labor || []).reduce(
                (s, r) => s + Number(r.amount || r.hours * r.hourly_rate || 0),
                0
            ),
        [offer]
    );
    const grandTotal = partsTotal + laborTotal;

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Yükleniyor…
            </div>
        );
    }
    if (err || !ticket) {
        return (
            <div className="p-6">
                <p className="text-red-600">Talep bulunamadı: {err || "—"}</p>
                <Link to="/support" className="text-blue-600 underline">
                    ← Destek Taleplerime Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-20">
            <div className="w-full max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
                {/* Back */}
                <div className="mb-4">
                    <Link to="/support" className="text-sm text-blue-600 underline hover:text-blue-800">
                        ← Destek Taleplerime Dön
                    </Link>
                </div>

                {/* Header */}
                <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
                <div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
                    <span>#{ticket.id.slice(0, 8)}</span>
                    <span>•</span>
                    <TicketBadge status={ticket.status} />
                    <span>•</span>
                    <span>{new Date(ticket.created_at).toLocaleString("tr-TR")}</span>
                </div>

                {/* Printer */}
                {ticket.printer_id && (
                    <div className="mb-6 p-3 rounded-lg border bg-gray-50 text-sm">
                        <div className="font-medium mb-1">Yazıcı</div>
                        <div>
                            {ticket.printer?.asset_code || "Kod yok"} • {ticket.printer?.model || "Model yok"}
                        </div>
                    </div>
                )}

                {/* Message */}
                <div className="mb-6">
                    <div className="font-medium mb-2">Mesaj</div>
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                        {ticket.message}
                    </pre>
                </div>

                {/* Teklif */}
                {offer?.workOrder && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Teklif</div>
                            {/* 👇 Teklif durumu + Onayla/Reddet (PENDING iken) */}
                            <CompanyQuoteCell ticketId={id} onChanged={() => setBump((x) => x + 1)} />
                        </div>

                        <div className="rounded-lg border bg-gray-50 p-3 text-sm mb-3">
                            <div>İş Emri Durumu: <b>{offer.workOrder.status}</b></div>
                            {offer.workOrder.hold_reason && (
                                <div>Nedeni: {offer.workOrder.hold_reason}</div>
                            )}
                        </div>

                        {/* Parts */}
                        <div className="mb-4">
                            <div className="font-medium mb-2">Parçalar</div>
                            {offer.parts.length === 0 ? (
                                <div className="text-gray-500 text-sm">Parça kalemi yok.</div>
                            ) : (
                                <table className="w-full text-sm border rounded overflow-hidden">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Açıklama</th>
                                            <th className="px-3 py-2 text-right">Adet</th>
                                            <th className="px-3 py-2 text-right">Birim</th>
                                            <th className="px-3 py-2 text-right">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {offer.parts.map((r) => (
                                            <tr key={r.id}>
                                                <td className="px-3 py-2">{r.description}</td>
                                                <td className="px-3 py-2 text-right">{TL(r.qty)}</td>
                                                <td className="px-3 py-2 text-right">{TL(r.unit_price)}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {TL(r.amount ?? r.qty * r.unit_price)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50">
                                            <td className="px-3 py-2 font-medium" colSpan={3}>
                                                Parça Toplamı
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{TL(partsTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Labor */}
                        <div className="mb-4">
                            <div className="font-medium mb-2">İşçilik</div>
                            {offer.labor.length === 0 ? (
                                <div className="text-gray-500 text-sm">İşçilik kalemi yok.</div>
                            ) : (
                                <table className="w-full text-sm border rounded overflow-hidden">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Açıklama</th>
                                            <th className="px-3 py-2 text-right">Saat</th>
                                            <th className="px-3 py-2 text-right">Saatlik</th>
                                            <th className="px-3 py-2 text-right">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {offer.labor.map((r) => (
                                            <tr key={r.id}>
                                                <td className="px-3 py-2">{r.description}</td>
                                                <td className="px-3 py-2 text-right">{TL(r.hours)}</td>
                                                <td className="px-3 py-2 text-right">{TL(r.hourly_rate)}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {TL(r.amount ?? r.hours * r.hourly_rate)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50">
                                            <td className="px-3 py-2 font-medium" colSpan={3}>
                                                İşçilik Toplamı
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">{TL(laborTotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Grand total */}
                        <div className="flex items-center justify-end text-sm">
                            <div className="px-4 py-2 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200">
                                <span className="font-medium mr-2">Genel Toplam:</span> {TL(grandTotal)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Attachments (altta da olabilir, yukarıda kaldıysa kalsın) */}
                {attachments.length > 0 && (
                    <div className="mb-6">
                        <div className="font-medium mb-2">Ekler</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {attachments.map((a) => {
                                const url = supabase.storage.from(BUCKET).getPublicUrl(a.path).data.publicUrl;
                                return (
                                    <li key={a.id}>
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {a.path.split("/").pop()}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
