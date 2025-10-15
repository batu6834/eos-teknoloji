import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabaseAdmin from '../../supabaseAdminClient';
import PartsPanel from "../workorders/PartsPanel";
import LaborPanel from "../workorders/LaborPanel";

const TL = (n) =>
    Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusBadge = ({ value }) => {
    const map = {
        NEW: 'bg-gray-100 text-gray-800',
        IN_PROGRESS: 'bg-blue-100 text-blue-800',
        ON_HOLD: 'bg-yellow-100 text-yellow-800',
        DONE: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };
    const cls = map[value] || 'bg-gray-100 text-gray-800';
    return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{value}</span>;
};

export default function WorkOrderDetail() {
    const { id } = useParams(); // work_order id
    const [wo, setWo] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);

    async function fetchWo() {
        const { data, error } = await supabaseAdmin
            .from('work_orders')
            .select('id, status, ticket_id, assigned_to, started_at, completed_at, hold_reason, notes')
            .eq('id', id)
            .single();
        if (error) setErr(error.message);
        setWo(data || null);

        // ilgili ticket'tan firma id'sini çek
        if (data?.ticket_id) {
            const { data: t } = await supabaseAdmin
                .from('support_tickets')
                .select('user_id, user_uuid')
                .eq('id', data.ticket_id)
                .single();
            const cId = t?.user_id || t?.user_uuid;
            if (cId) setCompanyId(cId);
        }
    }

    useEffect(() => { fetchWo(); /* eslint-disable-next-line */ }, [id]);

    async function updateStatus(next, extra = {}) {
        if (!wo) return;
        setSaving(true);

        // 1) work_order'ı güncelle
        const { error } = await supabaseAdmin
            .from('work_orders')
            .update({ status: next, ...extra })
            .eq('id', id);
        if (error) { setSaving(false); alert(error.message); return; }

        // 2) ilgili ticket'ı senkronize et (ticket varsa)
        if (wo.ticket_id) {
            if (next === 'IN_PROGRESS') {
                await supabaseAdmin.from('support_tickets')
                    .update({ status: 'IN_PROGRESS' })
                    .eq('id', wo.ticket_id);
            } else if (next === 'ON_HOLD') {
                // şemadaki bekleme değeri: WAITING_PARTS
                await supabaseAdmin.from('support_tickets')
                    .update({ status: 'WAITING_PARTS' })
                    .eq('id', wo.ticket_id);
            } else if (next === 'DONE') {
                await supabaseAdmin.from('support_tickets')
                    .update({ status: 'RESOLVED' })
                    .eq('id', wo.ticket_id);
            }
        }

        setSaving(false);
        fetchWo();
    }

    // >>> TEKLİF OLUŞTUR: quotes'a PENDING kayıt aç + WO & Ticket senkronu
    async function sendOffer() {
        if (!wo) return;
        setSaving(true);
        try {
            // 1) Kalemleri oku
            const { data: items, error: itemsErr } = await supabaseAdmin
                .from("work_order_items")
                .select("kind, amount, qty, unit_price, hours, hourly_rate")
                .eq("work_order_id", id);
            if (itemsErr) throw itemsErr;

            const partsTotal = (items || [])
                .filter(r => r.kind === "PART")
                .reduce((s, r) => s + Number(r.amount ?? (r.qty || 0) * (r.unit_price || 0)), 0);

            const laborTotal = (items || [])
                .filter(r => r.kind === "LABOR")
                .reduce((s, r) => s + Number(r.amount ?? (r.hours || 0) * (r.hourly_rate || 0)), 0);

            const grand = partsTotal + laborTotal;

            if (!companyId) throw new Error("Firma (company_id) bulunamadı. Ticket ilişkisini kontrol edin.");

            // 2) quotes'a ekle (ENUM: PENDING)
            const { error: qErr } = await supabaseAdmin
                .from("quotes")
                .insert({
                    ticket_id: wo.ticket_id,
                    company_id: companyId,
                    status: "PENDING",
                    currency: "TRY",
                    notes: wo.hold_reason || "Teklif gönderildi",
                    subtotal: grand,
                    grand_total: grand,
                });
            if (qErr) throw qErr;

            // 3) WO ve ticket senkronu
            await supabaseAdmin
                .from("work_orders")
                .update({ status: "ON_HOLD", hold_reason: "Teklif gönderildi / müşteri onayı bekleniyor" })
                .eq("id", id);

            if (wo.ticket_id) {
                await supabaseAdmin
                    .from("support_tickets")
                    .update({ status: "WAITING_PARTS" })
                    .eq("id", wo.ticket_id);
            }

            await fetchWo();
            alert("Teklif oluşturuldu ve firmaya gönderildi.");
        } catch (e) {
            alert(e.message || "Teklif gönderilemedi.");
        } finally {
            setSaving(false);
        }
    }
    // <<<

    if (!wo) return <div className="p-6">{err || 'Yükleniyor...'}</div>;

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">İş Emri #{wo.id.slice(0, 8)}</h1>
                {companyId && (
                    <Link
                        to={`/admin/company/${companyId}?tab=tickets`}
                        className="text-sm underline"
                    >
                        Geri
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-2">
                <StatusBadge value={wo.status} />
                <button
                    disabled={saving || wo.status !== 'NEW'}
                    onClick={() => updateStatus('IN_PROGRESS', { started_at: new Date().toISOString() })}
                    className="px-3 py-1.5 border rounded disabled:opacity-50"
                >
                    Başlat
                </button>
                <button
                    disabled={saving || wo.status !== 'IN_PROGRESS'}
                    onClick={() => updateStatus('ON_HOLD', { hold_reason: 'Müşteri onayı / parça bekliyor' })}
                    className="px-3 py-1.5 border rounded disabled:opacity-50"
                >
                    Beklet
                </button>
                <button
                    disabled={saving || wo.status !== 'ON_HOLD'}
                    onClick={() => updateStatus('IN_PROGRESS')}
                    className="px-3 py-1.5 border rounded disabled:opacity-50"
                >
                    Devam
                </button>
                <button
                    disabled={saving || wo.status !== 'IN_PROGRESS'}
                    onClick={() => updateStatus('DONE', { completed_at: new Date().toISOString() })}
                    className="px-3 py-1.5 border rounded bg-green-600 text-white disabled:opacity-50"
                >
                    Tamamla
                </button>
            </div>

            {/* Parça & İşçilik panelleri */}
            <div className="grid md:grid-cols-2 gap-4">
                <section className="border rounded p-3">
                    <div className="font-medium mb-2">Parça</div>
                    <PartsPanel workOrderId={wo.id} />
                </section>

                <section className="border rounded p-3">
                    <div className="font-medium mb-2">İşçilik</div>
                    <LaborPanel workOrderId={wo.id} />
                </section>
            </div>

            <button
                disabled={saving}
                onClick={sendOffer}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
                Firmaya Teklif Gönder
            </button>
        </div>
    );
}
