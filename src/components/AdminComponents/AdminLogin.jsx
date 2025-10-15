// src/components/AdminComponents/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabaseAdmin from '../../supabaseAdminClient';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('batuhannguzel@gmail.com');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErr('');
        setLoading(true);

        // 1) SADECE admin client ile giriş
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) {
            setErr(error.message);
            setLoading(false);
            return;
        }

        // 2) Admin profili çek (RLS: kendi satırını okuyabilmeli)
        const uid = data.user.id;
        const { data: profile, error: pErr } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', uid)
            .single();

        // Geçici debug (konsolda gör)
        // console.log('[admin-login] uid:', uid, 'profile:', profile, 'pErr:', pErr);

        if (pErr || profile?.role !== 'admin') {
            setErr('Bu hesaba admin yetkisi verilmemiş.');
            await supabaseAdmin.auth.signOut(); // sadece admin oturumunu kapatır
            setLoading(false);
            return;
        }

        navigate('/admin?tab=destek-talepleri', { replace: true });
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Yönetici Girişi</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    {err && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{err}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Yükleniyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
}
