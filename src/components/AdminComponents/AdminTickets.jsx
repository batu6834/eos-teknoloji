// src/components/AdminComponents/AdminTickets.jsx
import React, { useEffect, useState } from 'react';
import supabaseAdmin from '../../supabaseAdminClient';
import { supabase } from '../../supabaseClient';
import { CheckCircle, Clock, Trash2, Loader2, Search, Factory, User2, Eye, ExternalLink } from 'lucide-react';
import TicketViewModal from '../tickets/TicketViewModal';

const BUCKET = process.env.REACT_APP_TICKET_BUCKET || 'ticket-attachments';
const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['all', 'OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'RESOLVED', 'SHIPPED', 'CANCELLED'];
const STATUS_LABELS = {
    all: 'Tümü',
    OPEN: 'Açık',
    IN_PROGRESS: 'İşlemde',
    WAITING_PARTS: 'Parça Bekliyor',
    RESOLVED: 'Çözüldü',
    SHIPPED: 'Kargolandı',
    CANCELLED: 'İptal',
};

export default function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [viewId, setViewId] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);

    // 🔹 Yeni: teknisyen listesi ve atama spinner state
    const [techs, setTechs] = useState([]);
    const [assigningId, setAssigningId] = useState(null);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
        return () => clearTimeout(t);
    }, [q]);

    async function fetchTickets(opts = {}) {
        setLoading(true);
        setError(null);

        const curQ = opts.q ?? debouncedQ;
        const curStatus = opts.status ?? status;
        const curPage = opts.page ?? page;

        const from = (curPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabaseAdmin
            .from('v_admin_tickets')
            // 🔹 assigned_to eklendi
            .select('id, subject, message, status, created_at, company_name, company_id, printer_code, assigned_name, assigned_to', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (curStatus !== 'all') query = query.eq('status', curStatus);

        if (curQ) {
            query = query.or(
                `subject.ilike.%${curQ}%,` +
                `message.ilike.%${curQ}%,` +
                `company_name.ilike.%${curQ}%,` +
                `printer_code.ilike.%${curQ}%`
            );
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[tickets] select error:', error);
            setError('Talepler yüklenirken bir hata oluştu.');
            setTickets([]);
            setLoading(false);
            return;
        }

        const list = data ?? [];
        setTotal(count ?? 0);
        console.log(
            '[v_admin_tickets sample]',
            (list[0] ? {
                id: list[0].id,
                company_id: list[0].company_id,
                company_name: list[0].company_name,
                printer_code: list[0].printer_code,
                assigned_name: list[0].assigned_name,
            } : null)
        );


        if (list.length === 0) {
            setTickets([]);
            if (curPage > 1) setPage(curPage - 1);
            setLoading(false);
            return;
        }

        // Ekler
        const ids = list.map((t) => t.id);
        if (ids.length === 0) {
            setTickets(list.map((t) => ({ ...t, attachments: [] })));
            setLoading(false);
            return;
        }

        const { data: atts, error: attErr } = await supabaseAdmin
            .from('ticket_attachments')
            .select('id, ticket_id, path, created_at')
            .in('ticket_id', ids);

        if (attErr) {
            console.error('[attachments] select error:', attErr);
            setError('Ekler okunamadı (RLS/izin).');
        }

        const byTicket = {};
        if (Array.isArray(atts)) {
            for (const a of atts) {
                const { data: pu } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(a.path);
                const url = pu?.publicUrl || '';
                if (!byTicket[a.ticket_id]) byTicket[a.ticket_id] = [];
                byTicket[a.ticket_id].push({
                    id: a.id,
                    path: a.path,
                    url,
                    created_at: a.created_at,
                });
            }
        }

        const withFiles = list.map((t) => ({
            ...t,
            attachments: byTicket[t.id] || [],
        }));

        setTickets(withFiles);
        setLoading(false);
    }

    useEffect(() => {
        fetchTickets({ q: debouncedQ, status, page });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ, status, page]);

    // 🔹 Yeni: teknisyenleri bir kez çek (global)
    useEffect(() => {
        (async () => {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, display_name')
                .eq('role', 'tech')
                .eq('approved', true)
                .order('display_name', { ascending: true });

            if (!error && Array.isArray(data)) setTechs(data);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const channel = supabaseAdmin
            .channel('admin-tickets')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, () =>
                fetchTickets()
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' }, () =>
                fetchTickets()
            )
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'support_tickets' }, () =>
                fetchTickets()
            )
            .subscribe();

        return () => supabaseAdmin.removeChannel(channel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function toggleStatus(ticket) {
        let newStatus = 'OPEN';
        if (ticket.status === 'OPEN') newStatus = 'IN_PROGRESS';
        else if (ticket.status === 'IN_PROGRESS') newStatus = 'SHIPPED';
        else newStatus = 'OPEN';

        const { data: { user } } = await supabase.auth.getUser();
        const actorId = user?.id || null;

        const { error } = await supabaseAdmin
            .from('support_tickets')
            .update({ status: newStatus, last_actor: actorId })
            .eq('id', ticket.id);

        if (error) {
            console.error('[tickets] update error:', error);
            setError('Durum güncellenirken hata oluştu.');
            return;
        }
        setTickets((prev) =>
            prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
        );
    }

    async function deleteTicket(id) {
        if (!window.confirm('Bu destek talebini silmek istediğinizden emin misiniz?')) return;
        const { error } = await supabaseAdmin.from('support_tickets').delete().eq('id', id);
        if (error) {
            console.error('[tickets] delete error:', error);
            setError('Talep silinirken hata oluştu.');
        }
    }

    // 🔹 Yeni: atama fonksiyonu
    // 🔧 Güvenli ve sade atama — RETURNING yok, sonra listeyi tazeliyoruz
    async function assignTechnician(ticketId, newAssigneeId) {
        try {
            setAssigningId(ticketId);

            // select'ten gelen boş string, "null" vb. durumlar için normalleştir
            const assignee =
                newAssigneeId && newAssigneeId !== 'null' && newAssigneeId !== ''
                    ? newAssigneeId
                    : null;

            const { data: { user } } = await supabase.auth.getUser();
            const actorId = user?.id || null;

            const updates = {
                assigned_to: assignee,
                assigned_at: new Date().toISOString(),
                last_actor: actorId,
                // İstersen otomatik durum; istemezsen bu satırı sil
                status: assignee ? 'IN_PROGRESS' : 'OPEN',
            };

            const { error } = await supabaseAdmin
                .from('support_tickets')
                .update(updates)
                .eq('id', ticketId);

            if (error) throw error;

            // İyileştirme: UI’yı hemen de güncelle (optimistic),
            // ama asıl doğru veriyi fetchTickets sonrası alacağız.
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? {
                        ...t,
                        assigned_to: assignee,
                        assigned_name:
                            (assignee
                                ? (techs.find(x => x.id === assignee)?.display_name || t.assigned_name)
                                : null),
                        status: updates.status ?? t.status,
                    }
                    : t
            ));

            // View'den (v_admin_tickets) en güncel isim/rozet vs. gelsin
            await fetchTickets();
        } catch (e) {
            console.error('[assign] error raw:', e);
            setError(e?.message || 'Atama yapılırken hata oluştu.');
        } finally {
            setAssigningId(null);
        }
    }


    const StatusBadge = ({ status }) => {
        const map = {
            OPEN: 'bg-yellow-500 text-white',
            IN_PROGRESS: 'bg-blue-500 text-white',
            WAITING_PARTS: 'bg-orange-500 text-white',
            RESOLVED: 'bg-emerald-600 text-white',
            SHIPPED: 'bg-green-600 text-white',
            CANCELLED: 'bg-gray-500 text-white',
        };
        return (
            <span className={`${map[status] || 'bg-gray-400 text-white'} text-xs font-semibold px-2 py-1 rounded-full`}>
                {STATUS_LABELS[status] || status}
            </span>
        );
    };

    const StatusIcon = ({ status }) => {
        if (status === 'OPEN') return <Clock size={18} className="text-yellow-500" />;
        if (status === 'IN_PROGRESS') return <Clock size={18} className="text-blue-500" />;
        if (status === 'WAITING_PARTS') return <Clock size={18} className="text-orange-500" />;
        if (status === 'RESOLVED') return <CheckCircle size={18} className="text-emerald-600" />;
        if (status === 'SHIPPED') return <CheckCircle size={18} className="text-green-600" />;
        return <Clock size={18} className="text-gray-400" />;
    };

    return (
        <>
            <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800 p-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Destek Talepleri</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Toplam {total} kayıt • Sayfa {page}/{totalPages}
                        </p>
                    </header>

                    <div className="mb-6 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Konu, mesaj, firma, yazıcı kodu…"
                                className="w-full pl-9 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {STATUS_OPTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setStatus(s);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-2 rounded-lg border shadow-sm text-sm ${status === s
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    {STATUS_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md" role="alert">
                            <p className="font-bold text-red-700">Hata!</p>
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-indigo-500" size={40} />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
                            <p className="text-lg">Kayıt bulunamadı.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 mb-6">
                            {tickets.map((t) => (
                                <div
                                    key={t.id}
                                    className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-xl transition-shadow duration-300"
                                >
                                    <div className="flex-1 mb-4 md:mb-0">
                                        <div className="flex items-center gap-2 text-gray-700 font-semibold text-lg mb-1">
                                            <StatusIcon status={t.status} />
                                            <p>{t.subject || '—'}</p>

                                            {t.company_name && (
                                                <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                    <Factory size={14} /> {t.company_name}
                                                </span>
                                            )}

                                            {t.printer_code && (
                                                <span className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                                    {t.printer_code}
                                                </span>
                                            )}

                                            {/* 🔹 Atama seçimi (global teknisyen listesi) */}
                                            <div className="ml-1 inline-flex items-center gap-1 text-xs">
                                                <User2 size={14} className="text-purple-600" />
                                                {techs.length > 0 ? (
                                                    <select
                                                        className="text-xs px-2 py-1 border rounded-md bg-white"
                                                        value={t.assigned_to || ''}
                                                        onChange={(e) => assignTechnician(t.id, e.target.value || null)}
                                                        disabled={assigningId === t.id}
                                                        title="Teknisyen Ata"
                                                    >
                                                        <option value="">Atanmamış</option>
                                                        {techs.map(tech => (
                                                            <option key={tech.id} value={tech.id}>
                                                                {tech.display_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                                        {t.assigned_name || 'Atanmamış'}
                                                    </span>
                                                )}
                                                {assigningId === t.id && <Loader2 size={14} className="animate-spin text-gray-400 ml-1" />}
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-2 whitespace-pre-wrap break-words">{t.message}</p>

                                        {/* Ekler */}
                                        {t.attachments?.length > 0 && (
                                            <div className="mt-3">
                                                <div className="text-xs text-gray-500 mb-1">Ekler:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {t.attachments.map((a) => (
                                                        <a
                                                            key={a.id}
                                                            href={a.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center px-2 py-1 border rounded text-xs hover:bg-gray-50"
                                                            title={a.path}
                                                        >
                                                            {/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.path) ? (
                                                                <img
                                                                    src={a.url}
                                                                    alt="ek"
                                                                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                                                                    className="mr-2 rounded"
                                                                />
                                                            ) : null}
                                                            <span className="truncate max-w-[160px]">
                                                                {a.path.split('/').pop()}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mt-2">
                                            <StatusBadge status={t.status} />
                                            <p className="text-xs text-gray-400">
                                                Gönderilme: {t.created_at ? new Date(t.created_at).toLocaleString('tr-TR') : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleStatus(t)}
                                            className="p-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
                                            title="Durum Değiştir"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewId(t.id);
                                                setViewOpen(true);
                                            }}
                                            className="p-3 bg-white border rounded-full shadow-md hover:bg-gray-50"
                                            title="Göz At"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {/* 🔹 Firma destek sayfasında aç */}
                                        <a
                                            href={`/admin/company/${t.company_id}?tab=destek-talepleri&ticket=${t.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-colors duration-200"
                                            title="Firmanın detayında aç"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                        <button
                                            onClick={() => deleteTicket(t.id)}
                                            className="p-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-2 rounded-lg bg-white border shadow-sm disabled:opacity-50"
                        >
                            ◀︎ Önceki
                        </button>
                        <span className="text-sm text-gray-500">
                            Sayfa {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 rounded-lg bg-white border shadow-sm disabled:opacity-50"
                        >
                            Sonraki ▶︎
                        </button>
                    </div>
                </div>
            </div>
            {viewOpen && (
                <TicketViewModal
                    ticketId={viewId}
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                    onUpdated={() => fetchTickets()}
                />
            )}
        </>
    );
}
