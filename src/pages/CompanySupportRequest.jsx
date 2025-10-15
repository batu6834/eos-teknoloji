import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CompanySupportRequest = () => {
    // AuthContext'ten global Supabase istemcisini ve kullanıcı bilgisini alıyoruz
    const { supabase, user } = useAuth();

    // Form verilerini saklamak için state
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage('');

        // user objesi AuthContext'ten geliyor, userId yerine user.id kullanıyoruz
        if (!user) {
            setStatusMessage('Lütfen önce giriş yapın.');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .insert([
                    {
                        user_id: user.id, // user objesinden id'yi alıyoruz
                        subject: subject,
                        message: message,
                        // created_at, veritabanında otomatik olarak ayarlanabilir, bu satırı kaldırabilirsiniz
                        // ancak tutmak da bir hata yaratmaz
                        created_at: new Date().toISOString()
                    },
                ]);

            if (error) {
                throw error;
            }

            setStatusMessage('Destek talebiniz başarıyla gönderildi!');
            setSubject('');
            setMessage('');
        } catch (err) {
            console.error('Destek talebi gönderilirken hata oluştu:', err.message);
            setStatusMessage('Talebiniz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-lg">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Yeni Talep Oluştur</h2>
                {statusMessage && (
                    <p className={`text-center mb-6 py-2 rounded-md ${statusMessage.includes('başarıyla') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {statusMessage}
                    </p>
                )}
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="subject">
                            Talep Konusu
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Örn: Yazıcı toner değişimi"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="message">
                            Talep Detayları
                        </label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="6"
                            placeholder="Talep detaylarını buraya girin..."
                            required
                        ></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanySupportRequest;
