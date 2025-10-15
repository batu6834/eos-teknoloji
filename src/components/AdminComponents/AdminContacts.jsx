// src/components/AdminComponents/AdminContacts.jsx
import React, { useEffect, useState } from 'react';
import supabaseAdmin from '../../supabaseAdminClient';
import { Trash2, Loader2, Mail } from 'lucide-react';

const PAGE_SIZE = 10;

const AdminContacts = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
        return () => clearTimeout(t);
    }, [q]);

    const fetchMessages = async (opts = {}) => {
        setLoading(true);
        setError(null);

        const curQ = opts.q ?? debouncedQ;
        const curPage = opts.page ?? page;

        const from = (curPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabaseAdmin
            .from('contacts')
            .select('id, name, email, message, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (curQ) {
            query = query.or(
                `name.ilike.%${curQ}%,email.ilike.%${curQ}%,message.ilike.%${curQ}%`
            );
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[contacts] select error:', error);
            setError('Mesajlar yüklenirken bir hata oluştu.');
            setMessages([]);
        } else {
            setMessages(data ?? []);
            setTotal(count ?? 0);
            if ((data ?? []).length === 0 && curPage > 1) {
                setPage(curPage - 1);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages({ q: debouncedQ, page });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ, page]);

    useEffect(() => {
        const channel = supabaseAdmin
            .channel('admin-contacts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, fetchMessages)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'contacts' }, fetchMessages)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, fetchMessages)
            .subscribe();

        return () => {
            supabaseAdmin.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ, page]);

    const handleDeleteMessage = async (id) => {
        if (!window.confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;
        const { error } = await supabaseAdmin.from('contacts').delete().eq('id', id);
        if (error) {
            console.error('[contacts] delete error:', error);
            setError('Mesaj silinirken bir hata oluştu.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                        İletişim Mesajları
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Toplam {total} kayıt • Sayfa {page}/{totalPages}
                    </p>
                </header>

                <div className="mb-6 flex gap-3">
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        placeholder="İsim, e-posta veya mesajda ara…"
                        className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                    {q && (
                        <button
                            onClick={() => { setQ(''); setPage(1); }}
                            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                            title="Temizle"
                        >
                            Temizle
                        </button>
                    )}
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
                ) : messages.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
                        <p className="text-lg">Kayıt bulunamadı.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 mb-6">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="flex-1 mb-4 md:mb-0">
                                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-lg mb-1">
                                        <Mail size={20} />
                                        <p>{m.name}</p>
                                        <span className="text-sm font-normal text-gray-500">&lt;{m.email}&gt;</span>
                                    </div>
                                    <p className="text-gray-600 mb-2">{m.message}</p>
                                    <p className="text-xs text-gray-400">
                                        Gönderilme: {m.created_at ? new Date(m.created_at).toLocaleString('tr-TR') : '-'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteMessage(m.id)}
                                    className="p-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200"
                                    aria-label="Mesajı Sil"
                                    title="Mesajı Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
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
                    <span className="text-sm text-gray-500">Sayfa {page} / {totalPages}</span>
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
    );
};

export default AdminContacts;
