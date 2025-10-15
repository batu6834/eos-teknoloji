// src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Loader2, Star, Rocket, Shield, Search, ArrowUpDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const categories = ['Tüm Ürünler', 'Bilgisayarlar', 'Yazıcılar', 'Sunucular', 'Ağ Ürünleri', 'Yazılım', 'Aksesuarlar'];

export default function Products() {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] = useState('Tüm Ürünler');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // newest | price_asc | price_desc

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);

        // her zaman sadece yayınlanmışları getir
        let query = supabase
            .from('products')
            .select('id, name, description, price, image_url, category, created_at')
            .eq('is_published', true);

        if (selectedCategory !== 'Tüm Ürünler') {
            query = query.eq('category', selectedCategory);
        }

        if (searchTerm.trim() !== '') {
            // isim veya açıklama içinde arama (ilike -> case-insensitive)
            const term = `%${searchTerm.trim()}%`;
            query = query.or(`name.ilike.${term},description.ilike.${term}`);
        }

        // sıralama
        if (sortBy === 'price_asc') {
            query = query.order('price', { ascending: true, nullsFirst: true });
        } else if (sortBy === 'price_desc') {
            query = query.order('price', { ascending: false, nullsLast: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) {
            console.error('Ürünler çekilirken hata:', error);
            setError('Ürünler yüklenirken bir hata oluştu.');
            setProducts([]);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    // arama için ufak debounce
    useEffect(() => {
        const t = setTimeout(fetchProducts, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, searchTerm, sortBy]);

    // realtime: ürünlerde değişiklik olursa listeyi tazele
    useEffect(() => {
        const ch = supabase
            .channel('public-products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const features = useMemo(() => ([
        { icon: <Star size={24} />, title: 'Yüksek Kalite', description: 'Tüm ürünlerimiz titizlikle seçilmiş malzemelerden üretilir.' },
        { icon: <Shield size={24} />, title: 'Güvenli Alışveriş', description: 'SSL sertifikalı güvenli altyapı ile endişesiz alışveriş.' },
        { icon: <Rocket size={24} />, title: 'Hızlı Teslimat', description: 'Siparişleriniz en kısa sürede kapınıza teslim edilir.' },
    ]), []);

    const formatPrice = (p) => (p == null ? 'Fiyat için iletişime geçin' : `$${Number(p).toLocaleString('en-US')}`);

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
                {/* Filtre & Arama Çubuğu */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-12">
                    <div className="flex flex-wrap gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full font-semibold transition-colors text-sm ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full md:w-72">
                            <Search size={18} className="text-gray-400" />
                            <input
                                className="w-full outline-none text-sm"
                                placeholder="Ürün veya açıklama ara…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="bg-white border rounded-lg px-3 py-2 flex items-center gap-2">
                            <ArrowUpDown size={18} className="text-gray-400" />
                            <select
                                className="text-sm outline-none bg-transparent"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">En yeni</option>
                                <option value="price_asc">Fiyat (Artan)</option>
                                <option value="price_desc">Fiyat (Azalan)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Başlık */}
                <header className="mb-8 mt-8 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                        {selectedCategory === 'Tüm Ürünler' ? 'Ürünlerimiz' : selectedCategory}
                    </h1>
                    <p className="mt-2 text-gray-500">
                        İhtiyacınıza uygun kurumsal çözümleri keşfedin.
                    </p>
                </header>

                {/* Liste */}
                <section>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
                            <p className="font-bold text-red-700">Hata!</p>
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-indigo-500" size={40} />
                        </div>
                    )}

                    {!loading && products.length === 0 && (
                        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
                            Bu kriterlere uyan ürün bulunamadı.
                        </div>
                    )}

                    {!loading && products.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    to={`/urun-detay/${product.id}`}
                                    className="group bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden"
                                >
                                    <div className="aspect-[4/3] bg-gray-100">
                                        <img
                                            src={product.image_url || 'https://placehold.co/600x450/e2e8f0/64748b?text=Ürün+Görseli'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x450/e2e8f0/64748b?text=Görsel+Bulunamadı'; }}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            {product.category && (
                                                <span className="inline-block bg-indigo-100 text-indigo-800 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                                                    {product.category}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-base font-semibold text-gray-900 line-clamp-1">{product.name}</h2>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{product.description}</p>

                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-lg font-extrabold text-indigo-600">{formatPrice(product.price)}</span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                <ShoppingCart size={16} />
                                                İncele
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Kurumsal özellikler */}
                <section className="bg-gray-100 rounded-2xl shadow-inner p-8 mt-12 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Neden Bizi Seçmelisiniz?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="flex flex-col items-center p-6 bg-white rounded-xl shadow">
                                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-4">{f.icon}</div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">{f.title}</h3>
                                <p className="text-sm text-gray-600">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
