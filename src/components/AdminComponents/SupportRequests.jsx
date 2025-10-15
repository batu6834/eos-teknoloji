import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Trash2, Loader2 } from 'lucide-react';

const SupportRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data);
        } catch (err) {
            console.error('Destek talepleri alınırken hata oluştu:', err.message);
            setError('Destek talepleri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async (id) => {
        if (window.confirm('Bu destek talebini silmek istediğinizden emin misiniz?')) {
            const { error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Talep silinirken hata oluştu:', error);
                setError('Talep silinirken bir hata oluştu.');
            } else {
                fetchRequests();
            }
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-gray-500">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="ml-4">Talepler yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex justify-center items-center h-full text-gray-500 p-8">
                Henüz bir destek talebi bulunmamaktadır.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Destek Talepleri</h2>
            <div className="space-y-6">
                {requests.map((request) => (
                    <div key={request.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Talep ID: {request.id}</p>
                                    <p className="text-sm text-gray-500">Kullanıcı ID: {request.user_id}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(request.created_at).toLocaleString('tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">{request.subject}</h3>
                            <p className="text-gray-600 leading-relaxed">{request.message}</p>
                        </div>
                        <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="ml-4 p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200 flex-shrink-0"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SupportRequests;
