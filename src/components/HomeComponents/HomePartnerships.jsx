import React from 'react';
import { Link } from 'react-router-dom';

// Logo partner listesi
const partners = [
    { name: 'HP', logo: '/img/hp-logo.png' },
    { name: 'Arena', logo: '/img/arena-logo.png' },
    { name: 'Microsoft', logo: '/img/microsoft-logo.png' },
    { name: 'Hawlett', logo: '/img/hawlett-logo.png' },
    { name: 'Index', logo: '/img/index-logo.svg' },
    { name: 'VMware', logo: '/img/vmware-logo.png' },
    { name: 'Aruba', logo: '/img/aruba-logo.png' },
    { name: 'Papercut', logo: '/img/papercut-logo.webp' },
    { name: 'Partner 9', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+9' },
    { name: 'Partner 10', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+10' },
    { name: 'Partner 10', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+10' },
    { name: 'Partner 10', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+10' },
    { name: 'Partner 10', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+10' },
    { name: 'Partner 10', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+10' },
    { name: 'Partner 10', logo: 'https://placehold.co/150x50/111827/9ca3af?text=Partner+10' },
];

function HomePartnerships() {
    return (
        // Arka plan için gradyan renk geçişi
        <section className="py-16 bg-gradient-to-br from-white-100 to-gray-950">
            <div className="container mx-auto px-4 text-center">
                {/* Başlık ve paragraf metinlerini yeni arka plana uygun olarak beyaz ve açık gri yaptık */}
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                    Güvenilir İş Ortaklarımız
                </h2>
                <p className="text-gray-900 max-w-2xl mx-auto mb-12">
                    Sektörün en güçlü markalarıyla kurduğumuz iş birlikleri sayesinde en güncel ve en etkili çözümleri sunuyoruz.
                </p>

                {/* Partner logolarını sergileyen responsive grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 place-items-center">
                    {partners.map((partner, index) => (
                        <div
                            key={index}
                            // Glassmorphism efekti için arka planı bulanıklaştıran ve şeffaflaştıran stiller
                            // Hover'da hafif bir beyaz arka plan geçişi ekledik
                            // Kartın dolgusunu (p-6 -> p-8) ve border-opacity'i güncelledik
                            className="relative p-8 rounded-xl backdrop-filter backdrop-blur-lg bg-white bg-opacity-10 hover:bg-opacity-20 border border-gray-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
                        >
                            {/* Tüm logoların boyutunu eşitlemek için h-16 w-48 yaptık */}
                            {/* Bu sayede hepsi aynı boyuttaki bir kutuya sığacak ve daha büyük görünecek */}
                            <img
                                src={partner.logo}
                                alt={partner.name}
                                className="mx-auto h-16 w-48 object-contain"
                            />
                        </div>
                    ))}
                </div>

                {/* CTA Butonu */}
                <div className="mt-12">
                    <Link
                        to="/partnerships"
                        className="inline-block bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105"
                    >
                        Tüm İş Ortaklıklarını Görüntüle
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default HomePartnerships;
