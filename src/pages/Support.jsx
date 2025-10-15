// src/pages/Support.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Send, Loader2, Paperclip, X } from "lucide-react";

const BUCKET = process.env.REACT_APP_TICKET_BUCKET || "ticket-attachments";

const TEMPLATES = [
    {
        key: "paper_jam",
        label: "Kağıt sıkışması",
        body: `Lütfen problemi burada özetleyin...
- Belirtiler: kağıt sıkışması
- Ne zaman başladı: 
- Ekran/LED uyarısı: 
- Sıkışan kağıdın konumu:`,
    },
    {
        key: "toner_low",
        label: "Toner az/bitti",
        body: `Lütfen problemi burada özetleyin...
- Belirtiler: çıktılar soluk / toner uyarısı
- Hangi renk(ler):
- En son toner değişim tarihi:`,
    },
    {
        key: "streaks",
        label: "Çıktıda çizgiler/lekeler",
        body: `Lütfen problemi burada özetleyin...
- Belirtiler: yatay/dikey çizgiler
- Kağıt türü:
- Son bakım tarihi:`,
    },
];

export default function Support() {
    const { user } = useAuth();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // ✅ Talepler
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);

    // ✅ Form
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [printerId, setPrinterId] = useState("");

    // Yazıcı listesi
    const [printers, setPrinters] = useState([]);
    const [printersLoading, setPrintersLoading] = useState(true);

    // Ekler
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

    // Kullanıcının yazıcılarını çek (company profile id üzerinden)
    useEffect(() => {
        let alive = true;
        (async () => {
            setPrintersLoading(true);
            try {
                const { data: { user: u2 } } = await supabase.auth.getUser();
                const uid = user?.id || u2?.id;
                if (!uid) {
                    setPrinters([]);
                    return;
                }

                // 1) Oturum sahibi profili (role/approved/company_name)
                const { data: prof, error: profErr } = await supabase
                    .from("profiles")
                    .select("id, role, approved, company_name")
                    .eq("id", uid)
                    .single();

                if (!alive) return;

                if (profErr || !prof || !prof.approved) {
                    setPrinters([]);
                    return;
                }

                // 2) Şirket profil id'sini belirle
                let companyId = uid;
                if (prof.role !== "company" && prof.company_name) {
                    const { data: companyProfile, error: cpErr } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("role", "company")
                        .eq("company_name", prof.company_name)
                        .limit(1)
                        .single();

                    if (!cpErr && companyProfile?.id) {
                        companyId = companyProfile.id;
                    }
                }

                // 3) Yazıcıları şirket profil id'si ile çek
                const { data, error } = await supabase
                    .from("company_printers")
                    .select("id, asset_code, model, department, floor")
                    .eq("company_id", companyId)
                    .order("asset_code", { ascending: true });

                if (error) setPrinters([]);
                else setPrinters(data ?? []);
            } catch {
                setPrinters([]);
            } finally {
                setPrintersLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [user]);

    // ✅ Kullanıcının taleplerini çek (user_uuid ile standardize)
    useEffect(() => {
        (async () => {
            setLoadingTickets(true);
            try {
                const { data: { user: u2 } } = await supabase.auth.getUser();
                const uid = user?.id || u2?.id;
                if (!uid) {
                    setTickets([]);
                    return;
                }

                const { data, error } = await supabase
                    .from("support_tickets")
                    .select("id, subject, status, created_at")
                    .eq("user_uuid", uid)
                    .order("created_at", { ascending: false });

                if (error) setTickets([]);
                else setTickets(data || []);
            } finally {
                setLoadingTickets(false);
            }
        })();
    }, [user]);

    // Dosya seçimi
    const onPickFiles = (e) => {
        const selected = Array.from(e.target.files || []);
        if (!selected.length) return;

        const all = [...files, ...selected];
        if (all.length > 5) {
            setStatusMessage({ text: "En fazla 5 dosya ekleyebilirsiniz.", type: "error" });
            return;
        }

        for (const f of selected) {
            if (!(f.type.startsWith("image/") || f.type === "application/pdf")) {
                setStatusMessage({ text: "Sadece resim veya PDF yükleyin.", type: "error" });
                return;
            }
            if (f.size > 5 * 1024 * 1024) {
                setStatusMessage({ text: "Her dosya en fazla 5MB olabilir.", type: "error" });
                return;
            }
        }
        setFiles(all);
        setStatusMessage({ text: "", type: "" });
    };

    const removeFile = (idx) => {
        setFiles((arr) => arr.filter((_, i) => i !== idx));
    };

    // Ekleri yükle
    const uploadAttachments = async (ticketId) => {
        if (!files.length) return;
        setUploading(true);
        try {
            for (const f of files) {
                const ext = (f.name.split(".").pop() || "bin").toLowerCase();
                const path = `tickets/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

                const { error: upErr } = await supabase.storage
                    .from(BUCKET)
                    .upload(path, f, { cacheControl: "3600", upsert: false });
                if (upErr) throw upErr;

                await supabase.from("ticket_attachments").insert({ ticket_id: ticketId, path });
            }
        } finally {
            setUploading(false);
        }
    };

    // Talep gönder (RPC ile — RLS'e takılmaz, kontroller sunucuda)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ text: "", type: "" });

        if (!subject.trim() || !message.trim()) {
            setStatusMessage({ text: "Lütfen konu ve mesaj alanlarını doldurun.", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const { data: { user: u2 } } = await supabase.auth.getUser();
            const uid = user?.id || u2?.id;
            if (!uid) {
                setStatusMessage({ text: "Talep oluşturmak için önce giriş yapmalısınız.", type: "error" });
                return;
            }

            // ✅ RLS'e takılmadan güvenli RPC
            const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                "api_company_create_ticket",
                {
                    p_subject: subject.trim(),
                    p_message: message.trim(),
                    p_printer_id: printerId || null,
                    p_priority: "Normal",
                }
            );
            if (rpcErr) throw rpcErr;

            const ticketId = rpcRes; // UUID döner
            await uploadAttachments(ticketId);

            setStatusMessage({ text: "Destek talebiniz başarıyla gönderildi!", type: "success" });
            setSubject("");
            setMessage("");
            setPrinterId("");
            setFiles([]);

            // Listeyi tazele
            const { data: fresh } = await supabase
                .from("support_tickets")
                .select("id, subject, status, created_at")
                .eq("user_uuid", uid)
                .order("created_at", { ascending: false });
            setTickets(fresh || []);
        } catch (err) {
            console.error("Destek talebi hatası:", err);
            setStatusMessage({
                text: err?.message || "Talep gönderilemedi. (Yetki/RLS veya ağ hatası olabilir.)",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center font-sans antialiased pt-20">
            <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200 mt-8">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Destek Taleplerim</h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Mevcut taleplerinizi görüntüleyebilir veya yeni talep açabilirsiniz.
                    </p>
                </header>

                {/* ✅ Talepler listesi */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold mb-3">Taleplerim</h2>
                    {loadingTickets ? (
                        <div className="text-gray-500">Yükleniyor…</div>
                    ) : tickets.length === 0 ? (
                        <div className="text-gray-500">Henüz bir talebiniz yok.</div>
                    ) : (
                        <div className="border rounded-lg divide-y">
                            {tickets.map((t) => (
                                <div key={t.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                    <div>
                                        <div className="font-medium">{t.subject}</div>
                                        <div className="text-gray-500 text-xs">
                                            #{t.id.slice(0, 8)} • {t.status} • {new Date(t.created_at).toLocaleString("tr-TR")}
                                        </div>
                                    </div>
                                    <Link to={`/support/${t.id}`} className="text-blue-600 underline text-sm">
                                        Detay
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ✅ Yeni talep formu */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Yeni Talep Oluştur</h2>

                    {statusMessage.text && (
                        <div
                            className={`p-4 mb-6 rounded-lg font-semibold ${statusMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}
                        >
                            {statusMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Yazıcı seçimi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Yazıcı (opsiyonel)</label>
                            {printersLoading ? (
                                <div className="text-sm text-gray-500">Yazıcılar yükleniyor…</div>
                            ) : printers.length === 0 ? (
                                <div className="text-sm text-gray-500">Firmanız için kayıtlı yazıcı bulunamadı.</div>
                            ) : (
                                <select
                                    value={printerId}
                                    onChange={(e) => setPrinterId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">— Yazıcı seçmeyin —</option>
                                    {printers.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.asset_code || "Kod yok"} • {p.model || "Model yok"}
                                            {p.department ? ` • ${p.department}` : ""}
                                            {p.floor ? ` • ${p.floor}` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Şablonlar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hızlı Şablonlar</label>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATES.map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setMessage((prev) => (prev ? `${prev}\n\n${t.body}` : t.body))}
                                        className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Konu & Mesaj */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                    Konu
                                </label>
                                <input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Talebinizin konusunu yazın"
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                    Mesajınız
                                </label>
                                <textarea
                                    id="message"
                                    rows={8}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Sorunu detaylı olarak açıklayın."
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Dosya ekleri */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosya/Fotoğraf Ekle (isteğe bağlı)</label>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <Paperclip size={16} className="mr-2" />
                                    Dosya Seç
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={onPickFiles}
                                    />
                                </label>
                                <span className="text-xs text-gray-400">En fazla 5 dosya, her biri 5MB.</span>
                            </div>

                            {files.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {files.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm bg-gray-50 border rounded px-3 py-2">
                                            <span className="truncate">
                                                {f.name} ({Math.round(f.size / 1024)} KB)
                                            </span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-gray-700">
                                                <X size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-6 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                        >
                            {loading || uploading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>{uploading ? "Ekler yükleniyor…" : "Gönderiliyor..."}</span>
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    <span>Talebi Gönder</span>
                                </>
                            )}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
