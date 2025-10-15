import React, { useState } from 'react';

function HomeHero() {
    // Video yüklenemediğinde fallback görseli göstermek için state
    const [videoError, setVideoError] = useState(false);

    // Video yüklenemediğinde çalışacak fonksiyon
    const handleVideoError = (e) => {
        console.error("Video yüklenemedi:", e);
        setVideoError(true);
    };

    return (
        <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
            {/* Arka Plan Videosu veya Fallback Görseli */}
            {!videoError ? (
                <video
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    src="/videos/home-printer.mp4" // Lütfen bu yolun doğru olduğundan emin olun!
                    autoPlay
                    loop
                    muted
                    playsInline // iOS cihazlarda otomatik oynatma için gerekli
                    onError={handleVideoError} // Hata durumunda fonksiyonu çağır
                >
                    Tarayıcınız video etiketini desteklemiyor.
                </video>
            ) : (
                // Video yüklenemezse gösterilecek fallback arka plan görseli
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
                    style={{ backgroundImage: `url('/img/hero-fallback-background.jpg')` }} // Kendi fallback görselinizin yolunu ekleyin
                ></div>
            )}

            {/* Arka planın üzerine yarı saydam bir katman ekleyerek metin okunabilirliğini artırıyoruz */}
            <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

            {/* İçerik Katmanı */}
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
            {/* Basit animasyonlar için Tailwind CSS eklentisi veya özel CSS kullanılabilir */}
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
