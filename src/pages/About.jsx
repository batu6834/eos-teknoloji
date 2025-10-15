import React, { useEffect } from 'react';
// Import ettiğiniz bileşenler aynı kalıyor
import AboutHero from '../components/AboutComponents/AboutHero';
import MissionVision from '../components/AboutComponents/MissionVision';
import OurStory from '../components/AboutComponents/OurStory';
import TeamMembers from '../components/AboutComponents/TeamMembers';
import WhyChooseUs from '../components/AboutComponents/WhyChooseUs';

// isStandalonePage prop'unu ekledik, varsayılan değeri true
function About({ isStandalonePage = true }) {

    useEffect(() => {
        // Eğer bağımsız bir sayfa ise en üste kaydır
        if (isStandalonePage) {
            window.scrollTo(0, 0);
        }
    }, [isStandalonePage]); // isStandalonePage değiştiğinde de tetikle

    return (
        // Ana div, sadece içeriğin konumlandırması için relative olacak.
        // Video artık bu div'in yüksekliğine bağlı değil, doğrudan viewport'a sabitleniyor.
        <div className="w-full relative">
            {/* Video ve overlay'in SADECE bağımsız sayfa olduğunda render edilmesi */}
            {isStandalonePage && (
                <>
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        // Video, tarayıcı penceresini (viewport) tam kaplayacak şekilde sabitleniyor.
                        // `fixed inset-0` ile tam konumlandırma, `w-screen h-screen` ile tam boyutlandırma.
                        // `object-cover` ile oranı koruyarak sığdırır ve boşluk bırakmaz.
                        className="fixed inset-0 w-screen h-screen object-cover z-0"
                    >
                        <source src="/videos/services-bg.mp4" type="video/mp4" />
                        Tarayıcınız video etiketini desteklemiyor.
                    </video>

                    {/* Video üzerine metin okunurluğu için yarı saydam katman */}
                    <div
                        // Overlay de video ile aynı şekilde viewport'a sabitlenir ve boyutlandırılır.
                        className="fixed inset-0 w-screen h-screen bg-black opacity-30 z-10"
                    ></div>
                </>
            )}

            {/* Tüm sayfa içeriği, videonun ve katmanın üzerinde olacak */}
            {/* isStandalonePage true ise: min-h-screen flex flex-col justify-center (içeriği dikey ortalar) */}
            {/* isStandalonePage false ise: py-0 (sadece içeriğin kendi dolguları geçerli olacak, dışarıdan gelen dolguya izin verir) */}
            <main className={`relative z-20 ${isStandalonePage ? 'min-h-screen flex flex-col justify-center' : 'py-0'}`}>
                {/* Sayfa başı hero bölümü */}
                <AboutHero />

                {/* Misyon ve Vizyon bölümü */}
                <MissionVision />

                {/* Hikayemiz bölümü */}
                <OurStory />

                {/* Neden Bizi Tercih Etmelisiniz bölümü */}
                <WhyChooseUs />

                {/* Ekibimiz bölümü */}
                <TeamMembers />
            </main>
        </div>
    );
}

export default About;
