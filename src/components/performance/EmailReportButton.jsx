import { useState } from "react";

export default function EmailReportButton({ fromISO, toISO, technicianId, companyName }) {
    const [toEmail, setToEmail] = useState("");
    const [sending, setSending] = useState(false);
    const functionUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-kpi-report`;

    async function send() {
        if (!toEmail) return alert("Alıcı e-posta girin.");
        setSending(true);
        try {
            const body = {
                toEmail,
                from: fromISO,
                to: toISO,
                tech: technicianId || undefined,
                // 🔧 ÖNEMLİ: Edge function companyName bekliyor
                companyName: companyName || undefined,
            };

            const res = await fetch(functionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const j = await res.json();
            if (!j.ok) throw new Error(j.error || "Gönderilemedi");
            alert(`Rapor gönderildi ✅ (${toEmail})`);
        } catch (e) {
            console.error(e);
            alert("Gönderim sırasında hata oluştu.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="flex flex-wrap items-end gap-2">
            <div>
                <label className="block text-xs font-medium text-gray-600">E-posta alıcısı</label>
                <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                    className="border rounded-md px-3 py-2 min-w-[260px]"
                />
            </div>
            <button
                onClick={send}
                disabled={sending}
                className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
            >
                {sending ? "Gönderiliyor…" : "📧 KPI Raporu Gönder"}
            </button>
        </div>
    );
}
