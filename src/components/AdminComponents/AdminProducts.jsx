import React, { useEffect, useState } from 'react';
import supabaseAdmin from '../../supabaseAdminClient';
import { Pencil, Trash2, X, Loader2 } from 'lucide-react';

const CATEGORIES = ['Bilgisayarlar', 'Yazıcılar', 'Sunucular', 'Ağ Ürünleri', 'Yazılım', 'Aksesuarlar'];

const AdminProducts = () => {
    // UI state
    const [products, setProducts] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form state
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: '',
        is_published: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProductData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const resetForm = () => {
        setEditingProduct(null);
        setProductData({
            name: '',
            description: '',
            price: '',
            image_url: '',
            category: '',
            is_published: false,
        });
    };

    const fetchProducts = async () => {
        setBusy(true);
        setError(null);

        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[products] select error:', error);
            setError('Ürünler yüklenirken bir hata oluştu.');
            setProducts([]);
        } else {
            setProducts(data || []);
        }
        setBusy(false);
    };

    // İlk yükleme + realtime
    useEffect(() => {
        let mounted = true;
        (async () => {
            const { data: { session } } = await supabaseAdmin.auth.getSession();
            if (!session) return; // ProtectedAdminRoute zaten yönlendirecek
            if (mounted) fetchProducts();
        })();

        const ch = supabaseAdmin
            .channel('admin-products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
            .subscribe();

        return () => {
            supabaseAdmin.removeChannel(ch);
            mounted = false;
        };
    }, []);

    // Ekle/Düzenle
    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);

        const payload = {
            name: productData.name.trim(),
            description: productData.description.trim(),
            price: productData.price === '' ? null : parseFloat(productData.price),
            image_url: productData.image_url.trim() || null,
            category: productData.category,
            is_published: !!productData.is_published,
        };

        let resp;
        if (editingProduct) {
            resp = await supabaseAdmin.from('products').update(payload).eq('id', editingProduct.id);
        } else {
            resp = await supabaseAdmin.from('products').insert([payload]);
        }

        if (resp.error) {
            console.error('[products] upsert error:', resp.error);
            setError('İşlem sırasında bir hata oluştu.');
        } else {
            resetForm();
            fetchProducts();
        }
        setBusy(false);
    };

    // Sil
    const handleDelete = async (id) => {
        if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
        setBusy(true);
        const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
        if (error) {
            console.error('[products] delete error:', error);
            setError('Ürün silinirken bir hata oluştu.');
        }
        setBusy(false);
    };

    // Düzenle
    const handleEdit = (p) => {
        setEditingProduct(p);
        setProductData({
            name: p.name || '',
            description: p.description || '',
            price: p.price ?? '',
            image_url: p.image_url || '',
            category: p.category || '',
            is_published: !!p.is_published,
        });
    };

    // Yayın durumunu değiştir
    const togglePublish = async (p) => {
        const { error } = await supabaseAdmin
            .from('products')
            .update({ is_published: !p.is_published })
            .eq('id', p.id);
        if (error) {
            console.error('[products] publish toggle error:', error);
            setError('Yayın durumunu güncellerken hata oluştu.');
        }
    };

    // UI
    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">Ürün Yönetim Paneli</h1>
                    <p className="mt-2 text-lg text-gray-500">Ürün ekle, düzenle, yayınla veya kaldır.</p>
                </header>

                {/* Form */}
                <section className="bg-white p-8 rounded-xl shadow-lg mb-10">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-700">
                        {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4" role="alert">
                            <p className="font-bold text-red-700">Hata!</p>
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                            <input
                                name="name"
                                value={productData.name}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Örn: Akıllı Yazıcı X"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat ($)</label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                value={productData.price}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Örn: 199.99"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select
                                name="category"
                                value={productData.category}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="" disabled>Bir kategori seçin</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                            <textarea
                                name="description"
                                rows="3"
                                value={productData.description}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Ürün hakkında detaylı bilgi girin..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
                            <input
                                name="image_url"
                                value={productData.image_url}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://example.com/urun.jpg"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3">
                            <input
                                id="is_published"
                                type="checkbox"
                                name="is_published"
                                checked={productData.is_published}
                                onChange={handleChange}
                            />
                            <label htmlFor="is_published" className="text-sm text-gray-700">
                                Yayınla (web sitesinde görünsün)
                            </label>
                        </div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 mt-2">
                            <button
                                type="submit"
                                disabled={busy}
                                className={`w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${busy ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                            >
                                {busy && <Loader2 className="animate-spin" size={20} />}
                                {editingProduct ? 'Kaydet' : 'Ürünü Ekle'}
                            </button>
                            {editingProduct && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300 transform hover:scale-105"
                                >
                                    <X size={20} />
                                    İptal
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Liste */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-gray-700">Mevcut Ürünler</h2>

                    {busy && (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-indigo-500" size={40} />
                        </div>
                    )}

                    {!busy && products.length === 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                            <p className="text-lg">Henüz hiç ürün eklenmemiş.</p>
                        </div>
                    )}

                    {!busy && products.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((p) => (
                                <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <img
                                        src={p.image_url || 'https://placehold.co/400x300/e2e8f0/64748b?text=Ürün+Görseli'}
                                        alt={p.name}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=Görsel+Bulunamadı'; }}
                                    />
                                    <div className="p-6">
                                        <div className="mb-2 flex items-center justify-between">
                                            {p.category && (
                                                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                    {p.category}
                                                </span>
                                            )}
                                            <span className={`text-xs font-semibold ${p.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {p.is_published ? 'Yayında' : 'Taslak'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <p className="text-2xl font-extrabold text-indigo-600">
                                                {p.price == null ? '—' : `$${p.price}`}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => togglePublish(p)}
                                                    className={`p-2 ${p.is_published ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-full shadow-md transition-colors duration-200`}
                                                    title={p.is_published ? 'Yayından Kaldır' : 'Yayınla'}
                                                >
                                                    {p.is_published ? 'Kaldır' : 'Yayınla'}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="p-2 bg-yellow-500 text-white rounded-full shadow-md hover:bg-yellow-600 transition-colors duration-200"
                                                    title="Düzenle"
                                                >
                                                    <Pencil size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default AdminProducts;
