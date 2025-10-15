// src/components/tickets/TicketStatusSelect.jsx
import { useState } from "react";

const STATUS_OPTIONS = [
    { value: "OPEN", label: "Açık" },
    { value: "IN_PROGRESS", label: "İşlemde" },
    { value: "WAITING_PARTS", label: "Parça Bekleniyor" },
    { value: "RESOLVED", label: "Tamamlandı" },
    { value: "SHIPPED", label: "Kargoda" },
    { value: "CLOSED", label: "Kapandı" },
];

/**
 * Props:
 * - ticket: { id, status }
 * - adminClient: supabaseAdmin (service role)  ✅ RLS takılmaz
 * - authClient: supabase (kullanıcı client)    ✅ last_actor için kim olduğu
 * - onUpdated(nextStatus): parent state güncelle
 */
export default function TicketStatusSelect({ ticket, adminClient, authClient, onUpdated }) {
    const [value, setValue] = useState(ticket.status);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const handleChange = async (e) => {
        const next = e.target.value;
        setErr("");
        setSaving(true);

        try {
            // actor id (event/trigger’lar için faydalı)
            let actorId = null;
            if (authClient?.auth?.getUser) {
                const { data } = await authClient.auth.getUser();
                actorId = data?.user?.id || null;
            }

            // Admin client ile güncelle (RLS engeline takılmaz)
            const { error } = await adminClient
                .from("support_tickets")
                .update({ status: next, last_actor: actorId })
                .eq("id", ticket.id);

            if (error) {
                setErr(error.message || "Durum güncellenemedi.");
                return;
            }

            setValue(next);
            onUpdated?.(next);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="inline-flex items-center gap-2">
            <select
                className="border rounded-md p-2 text-sm"
                value={value}
                onChange={handleChange}
                disabled={saving}          // Sadece istek atılırken kilitle
                title="Talep durumunu değiştir"
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {saving && <span className="text-xs text-gray-500">Kaydediliyor…</span>}
            {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
    );
}
