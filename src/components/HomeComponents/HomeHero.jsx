import React from 'react';

// --- YARDIMCI COMPONENT: Videoyu tam ekran kaplamak için ---
// Bu, HeroSlider'da kullandığımızın aynısı. Tutarlılık için burada da kullanıyoruz.
function YouTubeBackground({ src, title }) {
    return (
        // Dış div, taşan videoyu gizler ve arkaplanı siyah yapar
        <div className="absolute inset-0 overflow-hidden bg-black">
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
                className="pointer-events-none" // Videoya tıklanmasını engeller
            ></iframe>
        </div>
    );
}
// --- YARDIMCI COMPONENT BİTTİ ---


function HomeHero() {
    // home-printer.mp4 için YouTube ID'si: zzl-n9qclNQ
    const videoSrc = "https://www.youtube.com/embed/zzl-n9qclNQ?autoplay=1&mute=1&loop=1&playlist=zzl-n9qclNQ&controls=0&showinfo=0&modestbranding=1&autohide=1";

    return (
        <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">

            {/* --- ARKA PLAN VİDEOSU GÜNCELLENDİ --- */}
            <YouTubeBackground src={videoSrc} title="EOS Teknoloji Tanıtım Videosu" />
            {/* --- GÜNCELLEME BİTTİ --- */}

            {/* Arka planın üzerine yarı saydam bir katman ekleyerek metin okunabilirliğini artırıyoruz */}
            <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

            {/* İçerik Katmanı (Bu kısım senin kodunla aynı) */}
            <div className="container mx-auto px-4 relative z-20">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up p-10">
                        Geleceği Bugünden Şekillendiriyoruz
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-10 animate-fade-in-up delay-200">
                        Yenilikçi çözümlerimiz ve uzman ekibimizle işinizi bir sonraki seviyeye taşıyın. Dijital dönüşüm yolculuğunuzda size rehberlik ediyoruz.
                    </p>
                    <a
                        href="/contact" // İletişim sayfasına yönlendirme
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out shadow-lg transform hover:scale-105 animate-fade-in-up delay-400"
                    >
                        Hemen Başlayın
                    </a>
                </div>
            </div>

            {/* Bu kısım da senin kodunla aynı */}
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
                    opacity: 0; /* Başlangıçta gizli */
                }
                .delay-200 {
                    animation-delay: 0.2s;
                }
                .delay-400 {
                    animation-delay: 0.4s;
                }
            `}</style>
        </section>
    );
}

export default HomeHero;