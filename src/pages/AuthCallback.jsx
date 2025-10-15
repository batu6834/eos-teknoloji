import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

// URL hash ve query karışık gelebilir; ikisini de oku
function useAuthParams() {
    const [params, setParams] = useState({ type: null });
    useEffect(() => {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const query = new URLSearchParams(window.location.search);
        // type = recovery | invite | magiclink | signup | email_change vs.
        const type = hash.get("type") || query.get("type");
        setParams({ type });
    }, []);
    return params;
}

export default function AuthCallback() {
    const { type } = useAuthParams();
    const [pwd, setPwd] = useState("");
    const [pwd2, setPwd2] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    // Oturum hazır mı? (code paramı varsa exchange et)
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let active = true;
        (async () => {
            // 1) Var olan session
            let { data: { session } } = await supabase.auth.getSession();

            // 2) Yoksa ve URL'de code varsa, code'u session'a çevir
            if (!session) {
                const url = new URL(window.location.href);
                const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
                const code = url.searchParams.get("code") || hash.get("code");
                if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession({ code });
                    if (!error) {
                        session = data.session ?? null;
                        // URL'i temizleyelim (güzel görüntü)
                        window.history.replaceState({}, "", url.pathname);
                    } else {
                        console.error("exchangeCodeForSession error:", error);
                    }
                }
            }

            if (active) setReady(!!session);
        })();
        return () => { active = false; };
    }, []);

    const title = useMemo(() => {
        if (type === "recovery") return "Şifre Sıfırla";
        if (type === "invite" || type === "signup") return "Hesabını Aktive Et ve Şifre Belirle";
        return "Giriş Doğrulanıyor";
    }, [type]);

    const onSetPassword = async (e) => {
        e.preventDefault();
        setMsg(""); setErr("");

        if (pwd.length < 8) return setErr("Şifre en az 8 karakter olmalı.");
        if (!/[A-ZÇĞİÖŞÜ]/.test(pwd)) return setErr("En az bir büyük harf içermeli.");
        if (!/[a-zçğıöşü]/.test(pwd)) return setErr("En az bir küçük harf içermeli.");
        if (!/[0-9]/.test(pwd)) return setErr("En az bir rakam içermeli.");
        if (pwd !== pwd2) return setErr("Şifreler uyuşmuyor.");

        setBusy(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: pwd });
            if (error) throw error;

            setMsg("Şifre güncellendi. Yönlendiriliyorsunuz…");
            setTimeout(() => {
                // Rolüne göre yönlendirmek istersen burada session + profile kontrol edip rota seçebilirsin.
                window.location.replace("/"); // örn. "/dashboard"
            }, 800);
        } catch (e) {
            setErr(e.message || "Beklenmedik bir hata.");
        } finally {
            setBusy(false);
        }
    };

    // İlk gelişte session yoksa kısa bilgi göster
    if (!ready) {
        return (
            <div className="max-w-md mx-auto p-6">
                <h1 className="text-xl font-semibold mb-2">{title}</h1>
                <p className="text-gray-600">Bağlantı doğrulanıyor…</p>
            </div>
        );
    }

    // recovery & invite & signup için şifre formu
    if (type === "recovery" || type === "invite" || type === "signup") {
        return (
            <div className="max-w-md mx-auto p-6">
                <h1 className="text-xl font-semibold mb-4">{title}</h1>

                {msg && (
                    <div className="mb-3 p-3 rounded bg-green-50 text-green-700 border border-green-200">
                        {msg}
                    </div>
                )}
                {err && (
                    <div className="mb-3 p-3 rounded bg-red-50 text-red-700 border border-red-200">
                        {err}
                    </div>
                )}

                <form onSubmit={onSetPassword} className="space-y-3">
                    <div>
                        <label className="block text-sm mb-1">Yeni Şifre</label>
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            required
                            minLength={8}
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Yeni Şifre (Tekrar)</label>
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2"
                            value={pwd2}
                            onChange={(e) => setPwd2(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className={`w-full py-2 rounded text-white font-semibold ${busy ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                        {busy ? "Kaydediliyor…" : "Şifreyi Kaydet"}
                    </button>
                </form>
            </div>
        );
    }

    // Diğer tipler (magiclink vs.) için sadece kısa bilgi
    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-2">Giriş Başarılı</h1>
            <p className="text-gray-600">Yönlendiriliyorsunuz…</p>
        </div>
    );
}
