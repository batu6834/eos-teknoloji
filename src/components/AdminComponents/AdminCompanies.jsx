// src/components/admin/AdminCompanies.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import supabaseAdmin from "../../supabaseAdminClient";

/* -------------------------------------------------------
 * AdminCompanies
 * - Firma için: Davet e-postası (şifreyi kullanıcı belirler)
 * - Teknisyen için: Mevcut geçici şifreli akış
 * ----------------------------------------------------- */
export default function AdminCompanies() {
    // --- Firma oluşturma (invite)
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [okMsg, setOkMsg] = useState("");
    const [errMsg, setErrMsg] = useState("");

    // Davet linkini debug için ayrı göstereceğiz
    const [inviteLink, setInviteLink] = useState("");

    // --- Teknisyen oluşturma (mevcut akış)
    const [tEmail, setTEmail] = useState("");
    const [tPassword, setTPassword] = useState("Tmp!abc123A1");
    const [tDisplayName, setTDisplayName] = useState("");
    const [tLoading, setTLoading] = useState(false);
    const [tOk, setTOk] = useState("");
    const [tErr, setTErr] = useState("");

    // --- Listeler
    const [companies, setCompanies] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [q, setQ] = useState("");

    const [techs, setTechs] = useState([]);
    const [techLoading, setTechLoading] = useState(true);
    const [techError, setTechError] = useState(null);

    // Arama filtresi
    const filteredCompanies = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return companies;
        return companies.filter(
            (c) =>
                (c.company_name || "").toLowerCase().includes(needle) ||
                (c.id || "").toLowerCase().includes(needle)
        );
    }, [q, companies]);

    // Rastgele teknisyen şifresi
    const genTechPassword = () => {
        const rnd = Math.random().toString(36).slice(-8);
        setTPassword(`Tmp!${rnd}A1`);
    };

    // Firmaları çek
    const fetchCompanies = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("id, company_name, approved")
            .eq("role", "company")
            .order("approved", { ascending: false })
            .order("company_name", { ascending: true });

        if (error) setListError("Firmalar yüklenirken hata oluştu.");
        else setCompanies(data ?? []);
        setListLoading(false);
    }, []);

    // Teknisyenleri çek
    const fetchTechs = useCallback(async () => {
        setTechLoading(true);
        setTechError(null);

        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, role, is_active")
            .eq("role", "tech")
            .order("is_active", { ascending: false })
            .order("display_name", { ascending: true, nullsFirst: false });

        if (error) setTechError("Teknisyenler yüklenirken hata oluştu.");
        else setTechs(data ?? []);

        setTechLoading(false);
    }, []);

    // Mount + Realtime
    useEffect(() => {
        let mounted = true;
        (async () => {
            const {
                data: { session },
            } = await supabaseAdmin.auth.getSession();
            if (!session) return;
            if (mounted) {
                fetchCompanies();
                fetchTechs();
            }
        })();

        const chCompanies = supabaseAdmin
            .channel("companies-admin")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "profiles" },
                (payload) => {
                    const row = payload.new || payload.old;
                    if (row?.role === "company") fetchCompanies();
                }
            )
            .subscribe();

        const chTechs = supabaseAdmin
            .channel("techs-admin")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "profiles" },
                (payload) => {
                    const row = payload.new || payload.old;
                    if (row?.role === "tech") fetchTechs();
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabaseAdmin.removeChannel(chCompanies);
            supabaseAdmin.removeChannel(chTechs);
        };
    }, [fetchCompanies, fetchTechs]);

    /* ------------------------------
     * Handlers
     * ---------------------------- */

    // Firma: davet e-postası akışı
    const handleSubmitCompany = async (e) => {
        e.preventDefault();
        setInviteLink("");
        setOkMsg("");
        setErrMsg("");
        setFormLoading(true);
        try {
            const {
                data: { session },
            } = await supabaseAdmin.auth.getSession();
            if (!session) throw new Error("Admin oturumu bulunamadı.");

            const url = process.env.REACT_APP_CREATE_USER_INVITE_URL;
            if (!url) throw new Error("REACT_APP_CREATE_USER_INVITE_URL tanımlı değil.");

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    role: "company",
                    company_name: companyName.trim(),
                }),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "İstek başarısız.");
            }

            const json = await res.json();

            // Kullanıcı mesajı
            setOkMsg(
                json?.mode === "existing_user_recovery_sent"
                    ? "Kullanıcı mevcut. Şifre belirleme bağlantısı gönderildi."
                    : "Davet e-postası gönderildi. Kullanıcı linke tıklayıp şifresini belirleyecek."
            );

            // Debug için linki ayrıca göster
            setInviteLink(json?.action_link || "");

            // formu temizle + listeyi yenile
            setEmail("");
            setCompanyName("");
            fetchCompanies();
        } catch (err) {
            setErrMsg(err.message || "Beklenmedik bir hata oluştu.");
        } finally {
            setFormLoading(false);
        }
    };

    // Firma: daveti yeniden gönder (basit prompt ile email alıyoruz)
    const resendInvite = async () => {
        let targetEmail = window.prompt(
            "Davet göndermek istediğiniz e-postayı girin:",
            email || ""
        );
        if (!targetEmail) return;
        targetEmail = String(targetEmail).trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail)) {
            alert("Geçerli bir e-posta giriniz.");
            return;
        }

        setInviteLink("");
        setOkMsg("");
        setErrMsg("");
        setFormLoading(true);
        try {
            const {
                data: { session },
            } = await supabaseAdmin.auth.getSession();
            if (!session) throw new Error("Admin oturumu bulunamadı.");

            const url = process.env.REACT_APP_CREATE_USER_INVITE_URL;
            if (!url) throw new Error("REACT_APP_CREATE_USER_INVITE_URL tanımlı değil.");

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: targetEmail,
                    role: "company",
                    company_name: companyName.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "İstek başarısız.");
            }

            const json = await res.json();
            setOkMsg(
                json?.mode === "existing_user_recovery_sent"
                    ? "Kullanıcı mevcut. Şifre belirleme bağlantısı gönderildi."
                    : "Davet e-postası gönderildi."
            );
            setInviteLink(json?.action_link || "");
        } catch (err) {
            setErrMsg(err.message || "Beklenmedik bir hata oluştu.");
        } finally {
            setFormLoading(false);
        }
    };

    // Teknisyen: mevcut geçici şifreli akış
    const handleCreateTech = async (e) => {
        e.preventDefault();
        setTOk("");
        setTErr("");
        setTLoading(true);
        try {
            const {
                data: { session },
            } = await supabaseAdmin.auth.getSession();
            if (!session) throw new Error("Admin oturumu yok.");

            const url = process.env.REACT_APP_CREATE_COMPANY_URL;
            if (!url) throw new Error("REACT_APP_CREATE_COMPANY_URL tanımlı değil.");

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: tEmail.trim(),
                    password: tPassword,
                    role: "tech",
                    display_name: tDisplayName.trim(),
                }),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "İstek başarısız.");
            }
            const json = await res.json();
            setTOk(`Teknisyen oluşturuldu. user_id: ${json.user_id}`);
            setTEmail("");
            setTDisplayName("");
            genTechPassword();
        } catch (err) {
            setTErr(err.message || "Beklenmedik bir hata oluştu.");
        } finally {
            setTLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* --------- SATIR 1: Firma Formu ↔ Firmalar --------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form */}
                <Card>
                    <h2 className="text-2xl font-bold mb-4 min-h-[44px] flex items-end">
                        Firma Kullanıcısı Oluştur
                    </h2>

                    {okMsg && <Alert kind="success">{okMsg}</Alert>}
                    {errMsg && <Alert kind="error">{errMsg}</Alert>}

                    {/* Debug: action_link'i tam ve kopyalanabilir göster */}
                    {inviteLink && (
                        <div className="mb-3 rounded-md p-3 bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <div className="font-medium mb-2">Test linki (tek kullanımlık):</div>
                            <div className="flex items-center gap-2">
                                <input
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 text-xs border rounded p-2 bg-white overflow-x-auto"
                                />
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                                    className="px-2 py-1 text-xs rounded border"
                                >
                                    Kopyala
                                </button>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={inviteLink}
                                    className="px-2 py-1 text-xs rounded border"
                                >
                                    Aç
                                </a>
                            </div>
                            <div className="text-[11px] mt-1 opacity-80">
                                Not: Link kısa süre geçerlidir ve tek kullanımlıktır.
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmitCompany} className="space-y-4">
                        <Field label="Firma Adı">
                            <input
                                className="w-full p-3 border rounded-lg"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Örn: Deneme AŞ"
                                required
                            />
                        </Field>

                        <Field label="E-posta">
                            <input
                                type="email"
                                className="w-full p-3 border rounded-lg"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@firma.com"
                                required
                            />
                        </Field>

                        <Field hint="Bu işlemle firmaya davet e-postası gönderilir. Kullanıcı linke tıklayıp kendi şifresini belirler.">
                            {/* Şifre alanı kaldırıldı */}
                        </Field>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className={`flex-1 py-3 rounded-lg text-white font-semibold ${formLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                                    }`}
                            >
                                {formLoading ? "Gönderiliyor…" : "Davet Gönder"}
                            </button>

                            <button
                                type="button"
                                onClick={resendInvite}
                                disabled={formLoading}
                                className="px-4 py-3 rounded-lg border font-semibold text-indigo-700 hover:bg-indigo-50"
                                title="Aynı e-postaya yeniden davet / recovery linki gönder"
                            >
                                Daveti Yeniden Gönder
                            </button>
                        </div>
                    </form>
                </Card>

                {/* Firmalar */}
                <CompanyList
                    companies={filteredCompanies}
                    loading={listLoading}
                    error={listError}
                    q={q}
                    setQ={setQ}
                    onToggle={async (c) => {
                        const { error } = await supabaseAdmin
                            .from("profiles")
                            .update({ approved: !c.approved })
                            .eq("id", c.id);
                        if (error) alert("Güncellenemedi: " + error.message);
                        else fetchCompanies();
                    }}
                />
            </div>

            {/* --------- SATIR 2: Teknisyen Formu ↔ Teknisyenler --------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <h2 className="text-2xl font-bold mb-4 min-h-[44px] flex items-end">
                        Teknisyen Ekle
                    </h2>

                    {tOk && <Alert kind="success">{tOk}</Alert>}
                    {tErr && <Alert kind="error">{tErr}</Alert>}

                    <form onSubmit={handleCreateTech} className="space-y-4">
                        <Field label="Görünen İsim">
                            <input
                                className="w-full p-3 border rounded-lg"
                                value={tDisplayName}
                                onChange={(e) => setTDisplayName(e.target.value)}
                                placeholder="Örn: Ahmet K. (Saha 1)"
                                required
                            />
                        </Field>

                        <Field label="E-posta">
                            <input
                                type="email"
                                className="w-full p-3 border rounded-lg"
                                value={tEmail}
                                onChange={(e) => setTEmail(e.target.value)}
                                placeholder="tech@eos.com"
                                required
                            />
                        </Field>

                        <Field
                            label={
                                <div className="flex items-center justify-between">
                                    <span>Geçici Şifre</span>
                                    <button
                                        type="button"
                                        onClick={genTechPassword}
                                        className="text-sm text-indigo-600 hover:underline"
                                    >
                                        Rastgele üret
                                    </button>
                                </div>
                            }
                        >
                            <input
                                className="w-full p-3 border rounded-lg"
                                value={tPassword}
                                onChange={(e) => setTPassword(e.target.value)}
                                required
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={tLoading}
                            className={`w-full py-3 rounded-lg text-white font-semibold ${tLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            {tLoading ? "Oluşturuluyor…" : "Teknisyen Oluştur"}
                        </button>
                    </form>
                </Card>

                <TechnicianList techs={techs} loading={techLoading} error={techError} />
            </div>
        </div>
    );
}

/* -------------------------------------------------------
 * Kart/Field/Alert yardımcıları
 * ----------------------------------------------------- */
function Card({ className = "", children }) {
    return (
        <div className={`bg-white rounded-xl shadow p-5 flex flex-col ${className}`}>
            {children}
        </div>
    );
}
function Field({ label, hint, children }) {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}
            {children}
            {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
    );
}
function Alert({ kind = "info", children }) {
    const map = {
        success: "bg-green-50 text-green-700 border border-green-200",
        error: "bg-red-50 text-red-700 border border-red-200",
        info: "bg-sky-50 text-sky-700 border-sky-200",
    };
    return <div className={`mb-3 rounded-md p-3 ${map[kind]}`}>{children}</div>;
}

/* -------------------------------------------------------
 * Firmalar Tablosu (4/sayfa paginasyon)
 * ----------------------------------------------------- */
function CompanyList({ companies, loading, error, q, setQ, onToggle }) {
    const navigate = useNavigate();
    const openDetail = (id) => navigate(`/admin/company/${id}`);

    // Paginate: 4/sayfa
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(4);
    const total = companies.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        setPage(1); // arama / page size değişince başa dön
    }, [q, pageSize, total]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = companies.slice(start, end);

    return (
        <Card>
            <div className="flex items-end justify-between mb-4 gap-3 min-h-[44px]">
                <h2 className="text-2xl font-bold">Firmalar</h2>
                <div className="flex items-end gap-2">
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="border rounded-lg px-2 py-1 text-sm"
                        title="Sayfa başına"
                    >
                        {[4, 8, 12, 16].map((n) => (
                            <option key={n} value={n}>
                                {n}/sayfa
                            </option>
                        ))}
                    </select>
                    <div className="w-56">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Ara (ad / id)…"
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                </div>
            </div>

            {error ? (
                <Alert kind="error">{error}</Alert>
            ) : loading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            ) : total === 0 ? (
                <div className="text-gray-600">Kayıt bulunamadı.</div>
            ) : (
                <>
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left">Şirket</th>
                                    <th className="px-4 py-3 text-left">ID</th>
                                    <th className="px-4 py-3 text-left">Durum</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((c) => (
                                    <tr key={c.id} className="border-t hover:bg-gray-50">
                                        <td
                                            className="px-4 py-3 cursor-pointer"
                                            onClick={() => openDetail(c.id)}
                                        >
                                            {c.company_name || <em>—</em>}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-gray-500 cursor-pointer"
                                            onClick={() => openDetail(c.id)}
                                        >
                                            {c.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.approved
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {c.approved ? "Onaylı" : "Beklemede"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={async () => {
                                                    const { error } = await supabaseAdmin
                                                        .from("profiles")
                                                        .update({ approved: !c.approved })
                                                        .eq("id", c.id);
                                                    if (error) alert("Güncellenemedi: " + error.message);
                                                    else onToggle(c);
                                                }}
                                                className={`px-3 py-1.5 rounded-md font-semibold text-white ${c.approved
                                                        ? "bg-gray-600 hover:bg-gray-700"
                                                        : "bg-green-600 hover:bg-green-700"
                                                    }`}
                                            >
                                                {c.approved ? "Askıya Al" : "Onayla"}
                                            </button>

                                            {/* İsteğe bağlı: Listeden de davet/recovery yollamak istersen */}
                                            <button
                                                onClick={async () => {
                                                    const targetEmail = window.prompt(
                                                        "Bu firma için davet/recovery göndermek istediğiniz e-posta:",
                                                        ""
                                                    );
                                                    if (!targetEmail) return;
                                                    try {
                                                        const {
                                                            data: { session },
                                                        } = await supabaseAdmin.auth.getSession();
                                                        if (!session) throw new Error("Admin oturumu yok.");
                                                        const url = process.env.REACT_APP_CREATE_USER_INVITE_URL;
                                                        if (!url)
                                                            throw new Error(
                                                                "REACT_APP_CREATE_USER_INVITE_URL tanımlı değil."
                                                            );
                                                        const res = await fetch(url, {
                                                            method: "POST",
                                                            headers: {
                                                                Authorization: `Bearer ${session.access_token}`,
                                                                apikey:
                                                                    process.env.REACT_APP_SUPABASE_ANON_KEY,
                                                                "Content-Type": "application/json",
                                                            },
                                                            body: JSON.stringify({
                                                                email: String(targetEmail).trim(),
                                                                role: "company",
                                                                company_name: c.company_name ?? undefined,
                                                            }),
                                                        });
                                                        if (!res.ok) {
                                                            const txt = await res.text().catch(() => "");
                                                            throw new Error(txt || "İstek başarısız.");
                                                        }
                                                        const json = await res.json();
                                                        alert(
                                                            json?.mode === "existing_user_recovery_sent"
                                                                ? "Kullanıcı mevcut. Şifre sıfırlama linki gönderildi."
                                                                : "Davet e-postası gönderildi."
                                                        );
                                                    } catch (e) {
                                                        alert(e.message || "Beklenmedik hata.");
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-md font-semibold border text-indigo-700 hover:bg-indigo-50"
                                            >
                                                Daveti Yeniden Gönder
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* footer / pagination */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            {total === 0 ? 0 : start + 1}–{Math.min(end, total)} / {total}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
                            >
                                ← Önceki
                            </button>
                            <span className="text-sm">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
                            >
                                Sonraki →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}

/* -------------------------------------------------------
 * Teknisyenler Tablosu
 * ----------------------------------------------------- */
function TechnicianList({ techs, loading, error }) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const total = techs.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        setPage(1);
    }, [pageSize, total]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = techs.slice(start, end);

    return (
        <Card>
            <div className="flex items-end justify-between mb-4 gap-3 min-h-[44px]">
                <h2 className="text-2xl font-bold">Teknisyenler</h2>
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border rounded-lg px-2 py-1 text-sm"
                    title="Sayfa başına"
                >
                    {[5, 10, 15, 25].map((n) => (
                        <option key={n} value={n}>
                            {n}/sayfa
                        </option>
                    ))}
                </select>
            </div>

            {error ? (
                <Alert kind="error">{error}</Alert>
            ) : loading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            ) : total === 0 ? (
                <div className="text-gray-600">Kayıt bulunamadı.</div>
            ) : (
                <>
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left">Görünen İsim</th>
                                    <th className="px-4 py-3 text-left">ID</th>
                                    <th className="px-4 py-3 text-left">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((t) => (
                                    <tr key={t.id} className="border-t">
                                        <td className="px-4 py-3">{t.display_name || <em>—</em>}</td>
                                        <td className="px-4 py-3 text-gray-500">{t.id}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {t.is_active ? "Aktif" : "Pasif"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            {total === 0 ? 0 : start + 1}–{Math.min(end, total)} / {total}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
                            >
                                ← Önceki
                            </button>
                            <span className="text-sm">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
                            >
                                Sonraki →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}







// // src/components/admin/AdminCompanies.jsx
// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { Loader2 } from "lucide-react";
// import supabaseAdmin from "../../supabaseAdminClient";

// /* -------------------------------------------------------
//  * Ana Sayfa
//  * ----------------------------------------------------- */
// export default function AdminCompanies() {
//     // --- Firma oluşturma formu
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("Temp1234!");
//     const [companyName, setCompanyName] = useState("");
//     const [formLoading, setFormLoading] = useState(false);
//     const [okMsg, setOkMsg] = useState("");
//     const [errMsg, setErrMsg] = useState("");

//     // --- Teknisyen oluşturma formu
//     const [tEmail, setTEmail] = useState("");
//     const [tPassword, setTPassword] = useState("Tmp!abc123A1");
//     const [tDisplayName, setTDisplayName] = useState("");
//     const [tLoading, setTLoading] = useState(false);
//     const [tOk, setTOk] = useState("");
//     const [tErr, setTErr] = useState("");

//     // --- Listeler
//     const [companies, setCompanies] = useState([]);
//     const [listLoading, setListLoading] = useState(true);
//     const [listError, setListError] = useState(null);
//     const [q, setQ] = useState("");

//     const [techs, setTechs] = useState([]);
//     const [techLoading, setTechLoading] = useState(true);
//     const [techError, setTechError] = useState(null);

//     const filteredCompanies = useMemo(() => {
//         const needle = q.trim().toLowerCase();
//         if (!needle) return companies;
//         return companies.filter(
//             (c) =>
//                 (c.company_name || "").toLowerCase().includes(needle) ||
//                 (c.id || "").toLowerCase().includes(needle)
//         );
//     }, [q, companies]);

//     const generatePassword = () => {
//         const rnd = Math.random().toString(36).slice(-8);
//         setPassword(`Tmp!${rnd}A1`);
//     };
//     const genTechPassword = () => {
//         const rnd = Math.random().toString(36).slice(-8);
//         setTPassword(`Tmp!${rnd}A1`);
//     };

//     const fetchCompanies = useCallback(async () => {
//         setListLoading(true);
//         setListError(null);
//         const { data, error } = await supabaseAdmin
//             .from("profiles")
//             .select("id, company_name, approved")
//             .eq("role", "company")
//             .order("approved", { ascending: false })
//             .order("company_name", { ascending: true });

//         if (error) setListError("Firmalar yüklenirken hata oluştu.");
//         else setCompanies(data ?? []);
//         setListLoading(false);
//     }, []);

//     const fetchTechs = useCallback(async () => {
//         setTechLoading(true);
//         setTechError(null);

//         const { data, error } = await supabaseAdmin
//             .from("profiles")
//             .select("id, display_name, role, is_active")
//             .eq("role", "tech")
//             .order("is_active", { ascending: false })
//             .order("display_name", { ascending: true, nullsFirst: false });

//         if (error) setTechError("Teknisyenler yüklenirken hata oluştu.");
//         else setTechs(data ?? []);

//         setTechLoading(false);
//     }, []);

//     // Mount + realtime
//     useEffect(() => {
//         let mounted = true;
//         (async () => {
//             const { data: { session } } = await supabaseAdmin.auth.getSession();
//             if (!session) return;
//             if (mounted) {
//                 fetchCompanies();
//                 fetchTechs();
//             }
//         })();

//         const chCompanies = supabaseAdmin
//             .channel("companies-admin")
//             .on(
//                 "postgres_changes",
//                 { event: "*", schema: "public", table: "profiles" },
//                 (payload) => {
//                     const row = payload.new || payload.old;
//                     if (row?.role === "company") fetchCompanies();
//                 }
//             )
//             .subscribe();

//         const chTechs = supabaseAdmin
//             .channel("techs-admin")
//             .on(
//                 "postgres_changes",
//                 { event: "*", schema: "public", table: "profiles" },
//                 (payload) => {
//                     const row = payload.new || payload.old;
//                     if (row?.role === "tech") fetchTechs();
//                 }
//             )
//             .subscribe();

//         return () => {
//             mounted = false;
//             supabaseAdmin.removeChannel(chCompanies);
//             supabaseAdmin.removeChannel(chTechs);
//         };
//     }, [fetchCompanies, fetchTechs]);

//     // Handlers
//     const handleSubmitCompany = async (e) => {
//         e.preventDefault();
//         setOkMsg("");
//         setErrMsg("");
//         setFormLoading(true);
//         try {
//             const { data: { session } } = await supabaseAdmin.auth.getSession();
//             if (!session) throw new Error("Admin oturumu bulunamadı.");

//             const res = await fetch(process.env.REACT_APP_CREATE_COMPANY_URL, {
//                 method: "POST",
//                 headers: {
//                     Authorization: `Bearer ${session.access_token}`,
//                     apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     email: email.trim(),
//                     password,
//                     company_name: companyName.trim(),
//                 }),
//             });

//             if (!res.ok) {
//                 const txt = await res.text().catch(() => "");
//                 throw new Error(txt || "İstek başarısız.");
//             }

//             const json = await res.json();
//             setOkMsg(`Kullanıcı oluşturuldu. user_id: ${json.user_id}`);
//             setEmail("");
//             setCompanyName("");
//             generatePassword();
//             fetchCompanies();
//         } catch (err) {
//             setErrMsg(err.message || "Beklenmedik bir hata oluştu.");
//         } finally {
//             setFormLoading(false);
//         }
//     };

//     const handleCreateTech = async (e) => {
//         e.preventDefault();
//         setTOk("");
//         setTErr("");
//         setTLoading(true);
//         try {
//             const { data: { session } } = await supabaseAdmin.auth.getSession();
//             if (!session) throw new Error("Admin oturumu yok.");

//             const res = await fetch(process.env.REACT_APP_CREATE_COMPANY_URL, {
//                 method: "POST",
//                 headers: {
//                     Authorization: `Bearer ${session.access_token}`,
//                     apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     email: tEmail.trim(),
//                     password: tPassword,
//                     role: "tech",
//                     display_name: tDisplayName.trim(),
//                 }),
//             });

//             if (!res.ok) {
//                 const txt = await res.text().catch(() => "");
//                 throw new Error(txt || "İstek başarısız.");
//             }
//             const json = await res.json();
//             setTOk(`Teknisyen oluşturuldu. user_id: ${json.user_id}`);
//             setTEmail("");
//             setTDisplayName("");
//             genTechPassword();
//         } catch (err) {
//             setTErr(err.message || "Beklenmedik bir hata oluştu.");
//         } finally {
//             setTLoading(false);
//         }
//     };

//     return (
//         <div className="space-y-10">
//             {/* --------- SATIR 1: Firma Formu ↔ Firmalar --------- */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
//                 {/* Form: doğal yükseklik */}
//                 <Card>
//                     <h2 className="text-2xl font-bold mb-4 min-h-[44px] flex items-end">
//                         Firma Kullanıcısı Oluştur
//                     </h2>

//                     {okMsg && <Alert kind="success">{okMsg}</Alert>}
//                     {errMsg && <Alert kind="error">{errMsg}</Alert>}

//                     <form onSubmit={handleSubmitCompany} className="space-y-4">
//                         <Field label="Firma Adı">
//                             <input
//                                 className="w-full p-3 border rounded-lg"
//                                 value={companyName}
//                                 onChange={(e) => setCompanyName(e.target.value)}
//                                 placeholder="Örn: Deneme AŞ"
//                                 required
//                             />
//                         </Field>

//                         <Field label="E-posta">
//                             <input
//                                 type="email"
//                                 className="w-full p-3 border rounded-lg"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 placeholder="ornek@firma.com"
//                                 required
//                             />
//                         </Field>

//                         <Field
//                             label={
//                                 <div className="flex items-center justify-between">
//                                     <span>Geçici Şifre</span>
//                                     <button
//                                         type="button"
//                                         onClick={generatePassword}
//                                         className="text-sm text-indigo-600 hover:underline"
//                                     >
//                                         Rastgele üret
//                                     </button>
//                                 </div>
//                             }
//                             hint="Kullanıcı ilk girişten sonra şifresini değiştirebilir."
//                         >
//                             <input
//                                 className="w-full p-3 border rounded-lg"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 required
//                             />
//                         </Field>

//                         <button
//                             type="submit"
//                             disabled={formLoading}
//                             className={`w-full py-3 rounded-lg text-white font-semibold ${formLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
//                                 }`}
//                         >
//                             {formLoading ? "Oluşturuluyor…" : "Kullanıcı Oluştur"}
//                         </button>
//                     </form>
//                 </Card>

//                 {/* Firmalar: 4/sayfa gerçek paginasyon */}
//                 <CompanyList
//                     companies={filteredCompanies}
//                     loading={listLoading}
//                     error={listError}
//                     q={q}
//                     setQ={setQ}
//                     onToggle={async (c) => {
//                         const { error } = await supabaseAdmin
//                             .from("profiles")
//                             .update({ approved: !c.approved })
//                             .eq("id", c.id);
//                         if (error) alert("Güncellenemedi: " + error.message);
//                         else fetchCompanies();
//                     }}
//                 />
//             </div>

//             {/* --------- SATIR 2: Teknisyen Formu ↔ Teknisyenler --------- */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
//                 <Card>
//                     <h2 className="text-2xl font-bold mb-4 min-h-[44px] flex items-end">
//                         Teknisyen Ekle
//                     </h2>

//                     {tOk && <Alert kind="success">{tOk}</Alert>}
//                     {tErr && <Alert kind="error">{tErr}</Alert>}

//                     <form onSubmit={handleCreateTech} className="space-y-4">
//                         <Field label="Görünen İsim">
//                             <input
//                                 className="w-full p-3 border rounded-lg"
//                                 value={tDisplayName}
//                                 onChange={(e) => setTDisplayName(e.target.value)}
//                                 placeholder="Örn: Ahmet K. (Saha 1)"
//                                 required
//                             />
//                         </Field>

//                         <Field label="E-posta">
//                             <input
//                                 type="email"
//                                 className="w-full p-3 border rounded-lg"
//                                 value={tEmail}
//                                 onChange={(e) => setTEmail(e.target.value)}
//                                 placeholder="tech@eos.com"
//                                 required
//                             />
//                         </Field>

//                         <Field
//                             label={
//                                 <div className="flex items-center justify-between">
//                                     <span>Geçici Şifre</span>
//                                     <button
//                                         type="button"
//                                         onClick={genTechPassword}
//                                         className="text-sm text-indigo-600 hover:underline"
//                                     >
//                                         Rastgele üret
//                                     </button>
//                                 </div>
//                             }
//                         >
//                             <input
//                                 className="w-full p-3 border rounded-lg"
//                                 value={tPassword}
//                                 onChange={(e) => setTPassword(e.target.value)}
//                                 required
//                             />
//                         </Field>

//                         <button
//                             type="submit"
//                             disabled={tLoading}
//                             className={`w-full py-3 rounded-lg text-white font-semibold ${tLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
//                                 }`}
//                         >
//                             {tLoading ? "Oluşturuluyor…" : "Teknisyen Oluştur"}
//                         </button>
//                     </form>
//                 </Card>

//                 <TechnicianList techs={techs} loading={techLoading} error={techError} />
//             </div>
//         </div>
//     );
// }

// /* -------------------------------------------------------
//  * Kart/Field/Alert yardımcıları
//  * ----------------------------------------------------- */
// function Card({ className = "", children }) {
//     return (
//         <div className={`bg-white rounded-xl shadow p-5 flex flex-col ${className}`}>
//             {children}
//         </div>
//     );
// }
// function Field({ label, hint, children }) {
//     return (
//         <div>
//             {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
//             {children}
//             {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
//         </div>
//     );
// }
// function Alert({ kind = "info", children }) {
//     const map = {
//         success: "bg-green-50 text-green-700 border border-green-200",
//         error: "bg-red-50 text-red-700 border border-red-200",
//         info: "bg-sky-50 text-sky-700 border-sky-200",
//     };
//     return <div className={`mb-3 rounded-md p-3 ${map[kind]}`}>{children}</div>;
// }

// /* -------------------------------------------------------
//  * Firmalar Tablosu (4/sayfa paginasyon)
//  * ----------------------------------------------------- */
// function CompanyList({ companies, loading, error, q, setQ, onToggle }) {
//     const navigate = useNavigate();
//     const openDetail = (id) => navigate(`/admin/company/${id}`);

//     // Paginate: 4/sayfa default
//     const [page, setPage] = useState(1);
//     const [pageSize, setPageSize] = useState(4);
//     const total = companies.length;
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     useEffect(() => {
//         // Arama / sayfa boyutu değişince ilk sayfaya dön
//         setPage(1);
//     }, [q, pageSize, total]);

//     // Kayıt azaldığında, geçerli sayfa üst sınırın üstünde kalmasın
//     useEffect(() => {
//         if (page > totalPages) setPage(totalPages);
//     }, [page, totalPages]);

//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;
//     const pageRows = companies.slice(start, end);

//     return (
//         <Card>
//             <div className="flex items-end justify-between mb-4 gap-3 min-h-[44px]">
//                 <h2 className="text-2xl font-bold">Firmalar</h2>
//                 <div className="flex items-end gap-2">
//                     <select
//                         value={pageSize}
//                         onChange={(e) => setPageSize(Number(e.target.value))}
//                         className="border rounded-lg px-2 py-1 text-sm"
//                         title="Sayfa başına"
//                     >
//                         {[4, 8, 12, 16].map((n) => (
//                             <option key={n} value={n}>{n}/sayfa</option>
//                         ))}
//                     </select>
//                     <div className="w-56">
//                         <input
//                             value={q}
//                             onChange={(e) => setQ(e.target.value)}
//                             placeholder="Ara (ad / id)…"
//                             className="w-full border rounded-lg px-3 py-2"
//                         />
//                     </div>
//                 </div>
//             </div>

//             {error ? (
//                 <Alert kind="error">{error}</Alert>
//             ) : loading ? (
//                 <div className="py-12 flex justify-center">
//                     <Loader2 className="animate-spin text-indigo-500" size={40} />
//                 </div>
//             ) : total === 0 ? (
//                 <div className="text-gray-600">Kayıt bulunamadı.</div>
//             ) : (
//                 <>
//                     <div className="rounded-lg border">
//                         <table className="min-w-full text-sm">
//                             <thead className="bg-gray-50 sticky top-0">
//                                 <tr>
//                                     <th className="px-4 py-3 text-left">Şirket</th>
//                                     <th className="px-4 py-3 text-left">ID</th>
//                                     <th className="px-4 py-3 text-left">Durum</th>
//                                     <th className="px-4 py-3"></th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {pageRows.map((c) => (
//                                     <tr
//                                         key={c.id}
//                                         className="border-t hover:bg-gray-50 cursor-pointer"
//                                         onClick={() => openDetail(c.id)}
//                                     >
//                                         <td className="px-4 py-3">{c.company_name || <em>—</em>}</td>
//                                         <td className="px-4 py-3 text-gray-500">{c.id}</td>
//                                         <td className="px-4 py-3">
//                                             <span
//                                                 className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
//                                                     }`}
//                                             >
//                                                 {c.approved ? "Onaylı" : "Beklemede"}
//                                             </span>
//                                         </td>
//                                         <td className="px-4 py-3 text-right">
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     onToggle(c);
//                                                 }}
//                                                 className={`px-3 py-1.5 rounded-md font-semibold text-white ${c.approved ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"
//                                                     }`}
//                                             >
//                                                 {c.approved ? "Askıya Al" : "Onayla"}
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* footer / pagination */}
//                     <div className="mt-3 flex items-center justify-between">
//                         <div className="text-xs text-gray-600">
//                             {total === 0 ? 0 : start + 1}–{Math.min(end, total)} / {total}
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <button
//                                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                                 disabled={page <= 1}
//                                 className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
//                             >
//                                 ← Önceki
//                             </button>
//                             <span className="text-sm">
//                                 {page} / {totalPages}
//                             </span>
//                             <button
//                                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                                 disabled={page >= totalPages}
//                                 className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
//                             >
//                                 Sonraki →
//                             </button>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </Card>
//     );
// }

// /* -------------------------------------------------------
//  * Teknisyenler Tablosu
//  * ----------------------------------------------------- */
// function TechnicianList({ techs, loading, error }) {
//     // Paginate (kullanıcı seçebilir) – burada 10/sayfa bırakıyorum
//     const [page, setPage] = useState(1);
//     const [pageSize, setPageSize] = useState(10);
//     const total = techs.length;
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     useEffect(() => {
//         setPage(1);
//     }, [pageSize, total]);
//     useEffect(() => {
//         if (page > totalPages) setPage(totalPages);
//     }, [page, totalPages]);

//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;
//     const pageRows = techs.slice(start, end);

//     return (
//         <Card>
//             <div className="flex items-end justify-between mb-4 gap-3 min-h-[44px]">
//                 <h2 className="text-2xl font-bold">Teknisyenler</h2>
//                 <select
//                     value={pageSize}
//                     onChange={(e) => setPageSize(Number(e.target.value))}
//                     className="border rounded-lg px-2 py-1 text-sm"
//                     title="Sayfa başına"
//                 >
//                     {[5, 10, 15, 25].map((n) => (
//                         <option key={n} value={n}>{n}/sayfa</option>
//                     ))}
//                 </select>
//             </div>

//             {error ? (
//                 <Alert kind="error">{error}</Alert>
//             ) : loading ? (
//                 <div className="py-12 flex justify-center">
//                     <Loader2 className="animate-spin text-indigo-500" size={40} />
//                 </div>
//             ) : total === 0 ? (
//                 <div className="text-gray-600">Kayıt bulunamadı.</div>
//             ) : (
//                 <>
//                     <div className="rounded-lg border">
//                         <table className="min-w-full text-sm">
//                             <thead className="bg-gray-50 sticky top-0">
//                                 <tr>
//                                     <th className="px-4 py-3 text-left">Görünen İsim</th>
//                                     <th className="px-4 py-3 text-left">ID</th>
//                                     <th className="px-4 py-3 text-left">Durum</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {pageRows.map((t) => (
//                                     <tr key={t.id} className="border-t">
//                                         <td className="px-4 py-3">{t.display_name || <em>—</em>}</td>
//                                         <td className="px-4 py-3 text-gray-500">{t.id}</td>
//                                         <td className="px-4 py-3">
//                                             <span
//                                                 className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
//                                                     }`}
//                                             >
//                                                 {t.is_active ? "Aktif" : "Pasif"}
//                                             </span>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     <div className="mt-3 flex items-center justify-between">
//                         <div className="text-xs text-gray-600">
//                             {total === 0 ? 0 : start + 1}–{Math.min(end, total)} / {total}
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <button
//                                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                                 disabled={page <= 1}
//                                 className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
//                             >
//                                 ← Önceki
//                             </button>
//                             <span className="text-sm">
//                                 {page} / {totalPages}
//                             </span>
//                             <button
//                                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                                 disabled={page >= totalPages}
//                                 className="px-2.5 py-1.5 rounded-md border disabled:opacity-40"
//                             >
//                                 Sonraki →
//                             </button>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </Card>
//     );
// }
