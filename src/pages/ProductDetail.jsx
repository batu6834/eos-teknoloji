// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Loader2, ShieldCheck, PackageOpen, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ProductDetail() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!id) { setLoading(false); setError('Ürün ID’si bulunamadı.'); return; }

        (async () => {
            // sadece yayında olan tek ürünü getir
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('is_published', true)
                .single();

            if (error) {
                console.error('Ürün detayı hatası:', error);
                setError('Ürün bulunamadı veya yayında değil.');
                setProduct(null);
            } else {
                setProduct(data);
            }
            setLoading(false);
        })();
    }, [id]);

    const formatPrice = (p) => (p == null ? 'Fiyat için iletişime geçin' : `$${Number(p).toLocaleString('en-US')}`);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <PackageOpen size={56} className="text-gray-400 mb-3" />
                <p className="text-xl font-semibold text-gray-800 mb-1">Ürün bulunamadı</p>
                <p className="text-gray-500 mb-6">{error || 'Aradığınız ürün yayında değil olabilir.'}</p>
                <Link to="/products" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                    <ArrowLeft size={16} /> Ürünlere Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800 pt-20 pb-16">
            <div className="max-w-6xl mx-auto px-6 md:px-8">
                {/* Breadcrumb */}
                <nav className="text-sm text-gray-500 mb-4">
                    <Link to="/products" className="hover:underline">Ürünler</Link>
                    <span className="mx-2">/</span>
                    {product.category && (<>
                        <span className="text-gray-400">{product.category}</span>
                        <span className="mx-2">/</span>
                    </>)}
                    <span className="text-gray-700">{product.name}</span>
                </nav>

                {/* Üst blok */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Görsel */}
                        <div className="bg-gray-100">
                            <div className="aspect-[4/3]">
                                <img
                                    src={product.image_url || 'https://placehold.co/800x600/e2e8f0/64748b?text=Ürün+Görseli'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/e2e8f0/64748b?text=Görsel+Bulunamadı'; }}
                                />
                            </div>
                        </div>

                        {/* Bilgiler */}
                        <div className="p-8 md:p-10">
                            {product.category && (
                                <span className="inline-block mb-3 bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {product.category}
                                </span>
                            )}

                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                                {product.name}
                            </h1>

                            <p className="text-gray-600 mt-3 leading-relaxed">
                                {product.description}
                            </p>

                            <div className="mt-6 flex items-center gap-4">
                                <span className="text-3xl font-extrabold text-indigo-600">
                                    {formatPrice(product.price)}
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    Stok Durumu: Mevcut
                                </span>
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md">
                                    <ShoppingCart size={20} />
                                    Sepete Ekle
                                </button>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg border"
                                >
                                    <ShieldCheck size={20} />
                                    Satış Ekibiyle İletişim
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alt bilgilendirme (opsiyonel) */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">Kurumsal Garanti</h3>
                        <p className="text-sm text-gray-600">Tüm ürünler üretici garantisi kapsamındadır.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">Teknik Destek</h3>
                        <p className="text-sm text-gray-600">Kurulum ve bakım süreçlerinde uzman desteği sağlıyoruz.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">Hızlı Teslimat</h3>
                        <p className="text-sm text-gray-600">Sözleşmeli kargo ile güvenli ve hızlı teslimat.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
