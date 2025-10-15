import React, { useEffect } from 'react';
import { FaHandshake, FaGlobe, FaChartLine, FaUsers, FaSearch, FaFileContract, FaCheckCircle, FaComments } from 'react-icons/fa';

// İş ortaklığı logolarınızın yolları
const partners = [
    { name: 'HP', logo: '/img/hp-logo.png' }, // HP logosu
    { name: 'Arena', logo: '/img/arena-logo.png' }, // Arena logosu
    { name: 'Partner 3', logo: '/img/microsoft-logo.png' }, // Kendi dosya adınızı buraya yazın
    { name: 'Partner 4', logo: '/img/hawlett-logo.png' }, // Kendi dosya adınızı buraya yazın
    { name: 'Partner 5', logo: '/img/index-logo.svg' }, // Kendi dosya adınızı buraya yazın
    { name: 'Partner 6', logo: '/img/vmware-logo.png' }, // Kendi dosya adınızı buraya yazın
    { name: 'Partner 7', logo: '/img/aruba-logo.png' }, // Kendi dosya adınızı buraya yazın
    { name: 'Partner 8', logo: '/img/papercut-logo.webp' }, // Kendi dosya adınızı buraya yazın
];

function Partnerships() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (
        <>
            {/* Hero Bölümü - Arka plan resmi eklendi */}
            <section
                className="relative py-20"
                style={{
                    backgroundImage: "url('/img/partner-ships-photo.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Yarı saydam koyu katman (overlay) */}
                <div className="absolute inset-0 bg-gray-800 opacity-75"></div>

                {/* İçerik */}
                <div className="container mx-auto text-center px-4 relative z-10 text-white">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in-up mt-9">İş Ortaklıkları</h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto animate-fade-in-up delay-200">
                        Birlikte daha büyük başarılara imza atalım. EOS Teknoloji Hizmetleri ile ortaklık kurarak potansiyelinizi maksimize edin.
                    </p>
                </div>
            </section>

            {/* Neden Ortak Olmalısınız? Bölümü */}
            <section className="py-16 bg-gray-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Neden Ortak Olmalısınız?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition duration-300 hover:scale-105">
                            <FaHandshake className="text-blue-600 text-5xl mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2 text-white">Güçlü İş Birliği</h3>
                            <p className="text-gray-400">Sektördeki uzmanlığımız ve geniş müşteri ağımızla işinizi büyütün.</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition duration-300 hover:scale-105">
                            <FaGlobe className="text-blue-600 text-5xl mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2 text-white">Pazar Erişimi</h3>
                            <p className="text-gray-400">Hedef pazarlarınıza daha kolay ulaşın ve yeni fırsatlar yakalayın.</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition duration-300 hover:scale-105">
                            <FaChartLine className="text-blue-600 text-5xl mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2 text-white">Büyüme Potansiyeli</h3>
                            <p className="text-gray-400">Ortak hedeflerle iş hacminizi ve karlılığınızı artırın.</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition duration-300 hover:scale-105">
                            <FaUsers className="text-blue-600 text-5xl mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2 text-white">Uzman Desteği</h3>
                            <p className="text-gray-400">Teknik ve pazarlama ekibimizle her zaman yanınızdayız.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mevcut İş Ortakları Bölümü (Sosyal Kanıt) */}
            <section className="py-16 bg-gray-800">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Referans İş Ortaklarımız</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-center">
                        {partners.map((partner, index) => (
                            <img
                                key={index}
                                src={partner.logo}
                                alt={partner.name}
                                className="mx-auto grayscale hover:grayscale-0 transition-all duration-300"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Geliştirilmiş İş Ortaklığı Süreci Bölümü */}
            <section className="bg-gray-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ortaklık Sürecimiz Nasıl İşliyor?</h2>
                    <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                        Aşağıdaki basit adımları takip ederek EOS ailesine katılın ve birlikte büyümeye başlayın.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Adım 1 */}
                        <div className="bg-gray-800 p-8 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mx-auto mb-6 text-3xl">
                                <FaComments />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">1. İletişim Kurun</h3>
                            <p className="text-gray-400">
                                İlk adım, bizimle iletişime geçmektir. İş hedeflerinizi ve beklentilerinizi konuşalım.
                            </p>
                        </div>
                        {/* Adım 2 */}
                        <div className="bg-gray-800 p-8 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mx-auto mb-6 text-3xl">
                                <FaSearch />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">2. Değerlendirme</h3>
                            <p className="text-gray-400">
                                Ekibimiz, potansiyel ortaklığımızı değerlendirir ve size özel bir teklif hazırlar.
                            </p>
                        </div>
                        {/* Adım 3 */}
                        <div className="bg-gray-800 p-8 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mx-auto mb-6 text-3xl">
                                <FaFileContract />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">3. Anlaşma</h3>
                            <p className="text-gray-400">
                                Şartlar üzerinde anlaştıktan sonra, resmi sözleşme sürecini başlatırız.
                            </p>
                        </div>
                        {/* Adım 4 */}
                        <div className="bg-gray-800 p-8 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mx-auto mb-6 text-3xl">
                                <FaCheckCircle />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">4. Başlayın!</h3>
                            <p className="text-gray-400">
                                Artık bir iş ortağımızsınız! Birlikte projeler geliştirmeye ve büyümeye hazırız.
                            </p>
                        </div>
                    </div>

                    {/* Softer CTA */}
                    <a href="/contact" className="mt-12 inline-block bg-blue-600 text-white py-3 px-8 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors duration-300">
                        Hemen Başlayın
                    </a>
                </div>
            </section>

            {/* Basit animasyonlar için özel CSS */}
            <style jsx>{`
                @keyframes fadeInFromBottom {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInFromBottom 0.8s ease-out forwards;
                    opacity: 0;
                }
                .delay-200 {
                    animation-delay: 0.2s;
                }
            `}</style>
        </>
    );
}

export default Partnerships;
