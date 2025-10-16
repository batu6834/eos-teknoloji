import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import servicesData from '../data/servicesData/DataAnalyticsAiData';

// --- YARDIMCI COMPONENT: Videoyu tam ekran kaplamak için ---
// Bu, diğer sayfalarda kullandığımızın aynısı. Proje boyunca tutarlılık sağlıyor.
function YouTubeBackground({ src, title }) {
    return (
        // Dış div, taşan videoyu gizler ve arkaplanı siyah yapar
        <div className="absolute inset-0 overflow-hidden bg-black z-0">
            <iframe
                src={src}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                // Bu CSS kodları, videonun oranını koruyarak ekranı tamamen kaplamasını sağlar
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100vw',
                    height: '56.25vw', // 100vw'nin 16:9 oranı
                    minWidth: '177.77vh', // 100vh'nin 16:9 oranı
                    minHeight: '100vh',
                    transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-none"
            ></iframe>
        </div>
    );
}
// --- YARDIMCI COMPONENT BİTTİ ---

function DataAnalyticsAi() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const service = servicesData[0];

    // data-analytics-video.mp4 için YouTube ID'si: 7g4G6DD0_BE
    const videoSrc = "https://www.youtube.com/embed/7g4G6DD0_BE?autoplay=1&mute=1&loop=1&playlist=7g4G6DD0_BE&controls=0&showinfo=0&modestbranding=1&autohide=1";

    if (!service) {
        return <div className="text-center text-red-500 py-10">Hizmet verisi bulunamadı.</div>;
    }

    return (
        <div>
            {/* Hero Section with Video Background */}
            <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">

                {/* --- ARKA PLAN VİDEOSU GÜNCELLENDİ --- */}
                <YouTubeBackground src={videoSrc} title={service.title} />
                {/* --- GÜNCELLEME BİTTİ --- */}

                {/* Video üzerine yarı saydam koyu katman ve metin (bu kısım aynı kaldı) */}
                <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col justify-center items-center text-white text-center p-4 z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{service.title}</h1>
                    <p className="max-w-3xl text-lg md:text-xl leading-relaxed">
                        {service.shortDescription}
                    </p>
                </div>
            </div>

            {/* Ana İçerik Bölümü (bu kısım aynı kaldı) */}
            <div className="max-w-5xl mx-auto px-4 py-10 bg-white shadow-lg rounded-lg -mt-16 relative z-20">
                <h2 className="text-3xl font-bold text-blue-600 mb-6">{service.title} Hizmet Detayları</h2>
                {service.longDescription.map((paragraph, idx) => (
                    <p key={idx} className="text-gray-700 leading-relaxed text-base mb-4">
                        {paragraph}
                    </p>
                ))}

                <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Başlıca Özelliklerimiz:</h3>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed text-base space-y-2">
                    {service.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                    ))}
                </ul>

                <div className="mt-10 text-center">
                    <p className="text-gray-600 text-lg mb-4">Veri analitiği çözümlerimiz hakkında daha fazla bilgi almak için:</p>
                    <Link
                        to="/contact"
                        className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        Bize Ulaşın
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default DataAnalyticsAi;