// src/pages/CompanyLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CompanyLogin = () => {
    const { supabase } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1) Şifre ile giriş
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;

            // 2) Kullanıcıyı al
            const user = data?.user;
            if (!user) throw new Error('Kullanıcı bulunamadı.');

            // 3) Profili çek → role & approved kontrolü
            const { data: prof, error: profErr } = await supabase
                .from('profiles')
                .select('role, approved, company_name')
                .eq('id', user.id)
                .single();

            if (profErr || !prof) {
                await supabase.auth.signOut();
                throw new Error('Profil bulunamadı veya okunamadı.');
            }

            if (prof.role !== 'company') {
                await supabase.auth.signOut();
                throw new Error('Bu hesap bir firma hesabı değil.');
            }

            if (!prof.approved) {
                await supabase.auth.signOut();
                throw new Error('Hesabınız henüz onaylanmamış. Lütfen yönetici onayı bekleyin.');
            }

            // 4) Her şey yolundaysa firma alanına yönlendir
            navigate('/'); // firma panel route’un varsa örn: navigate('/firma')

        } catch (err) {
            setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            console.error('Giriş hatası:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Şirket Girişi</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Yükleniyor…' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompanyLogin;
