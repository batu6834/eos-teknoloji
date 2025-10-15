import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";

const TL = (n) =>
    Number(n || 0).toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

/**
 * Props:
 * - ticketId: string (zorunlu)
 * - onChanged?: () => void (opsiyonel)
 * - showActions?: boolean | undefined
 *      undefined => otomatik (sadece şirket ve kendi teklifi ise)
 *      true      => her durumda göster
 *      false     => asla gösterme
 */
export default function CompanyQuoteCell({ ticketId, onChanged, showActions }) {
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState(null); // { id, status, grand_total, currency, company_id, ... }
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);

    // aktif kullanıcının rolü/id'si
    const [me, setMe] = useState({ id: null, role: null, ready: false });

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const uid = user?.id || null;
            if (!uid) return setMe({ id: null, role: null, ready: true });

            const { data: prof } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", uid)
                .single();

            setMe({ id: uid, role: prof?.role || null, ready: true });
        })();
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        const { data, error } = await supabase
            .from("quotes")
            .select(
                "id, status, grand_total, currency, company_id, created_at, approved_at, rejected_at, reject_reason"
            )
            .eq("ticket_id", ticketId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) setErr(error.message);
        setQuote(data || null);
        setLoading(false);
    }, [ticketId]);

    useEffect(() => {
        load();
    }, [load]);

    async function decide(nextStatus) {
        if (!quote) return;
        try {
            setBusy(true);
            if (nextStatus === "APPROVED") {
                const { error } = await supabase.rpc("approve_quote", { p_quote_id: quote.id });
                if (error) throw error;
            } else if (nextStatus === "REJECTED") {
                const reason = prompt("Red nedeni (opsiyonel):") || null;
                const { error } = await supabase.rpc("reject_quote", {
                    p_quote_id: quote.id,
                    p_reason: reason,
                });
                if (error) throw error;
            }
            await load();
            onChanged?.();
        } catch (e) {
            setErr(e.message || "Beklenmedik hata");
        } finally {
            setBusy(false);
        }
    }

    if (loading || !me.ready) {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="animate-spin" size={16} /> Yükleniyor…
            </div>
        );
    }

    if (err) return <span className="text-xs text-red-600">Hata: {err}</span>;
    if (!quote) return <span className="text-xs text-gray-400">—</span>;

    const badgeCls =
        quote.status === "PENDING"
            ? "bg-blue-100 text-blue-700"
            : quote.status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : quote.status === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700";

    // Aksiyon görünebilir mi?
    const autoCanAct = me.role === "company" && me.id && quote.company_id === me.id;
    const canAct =
        showActions === undefined ? autoCanAct : Boolean(showActions);

    return (
        <div className="flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${badgeCls}`}>
                {quote.status} • {TL(quote.grand_total)} {quote.currency || "TRY"}
            </span>

            {canAct && quote.status === "PENDING" && (
                <div className="inline-flex gap-1">
                    <button
                        onClick={() => decide("APPROVED")}
                        disabled={busy}
                        className="px-2 py-0.5 text-xs rounded border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-60"
                    >
                        Onayla
                    </button>
                    <button
                        onClick={() => decide("REJECTED")}
                        disabled={busy}
                        className="px-2 py-0.5 text-xs rounded border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                        Reddet
                    </button>
                </div>
            )}
        </div>
    );
}
