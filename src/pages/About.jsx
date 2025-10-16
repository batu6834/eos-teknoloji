import React, { useEffect } from 'react';
// Import ettiğin bileşenler aynı kalıyor
import AboutHero from '../components/AboutComponents/AboutHero';
import MissionVision from '../components/AboutComponents/MissionVision';
import OurStory from '../components/AboutComponents/OurStory';
import TeamMembers from '../components/AboutComponents/TeamMembers';
import WhyChooseUs from '../components/AboutComponents/WhyChooseUs';


// --- YARDIMCI COMPONENT: Videoyu tam ekran kaplamak için ---
// Bu, diğer sayfalarda kullandığımızın aynısı. Proje boyunca tutarlılık sağlıyor.
function YouTubeBackground({ src, title }) {
    return (
        // Orijinal kodundaki gibi 'fixed' kullanarak tüm sayfayı kaplamasını sağlıyoruz
        <div className="fixed inset-0 overflow-hidden bg-black z-0">
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
                    height: '56.25vw',
                    minWidth: '177.77vh',
                    minHeight: '100vh',
                    transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-none"
            ></iframe>
        </div>
    );
}
// --- YARDIMCI COMPONENT BİTTİ ---


function About({ isStandalonePage = true }) {

    useEffect(() => {
        if (isStandalonePage) {
            window.scrollTo(0, 0);
        }
    }, [isStandalonePage]);

    // services-bg.mp4 için YouTube ID'si: qXydeFq8cIc
    const videoSrc = "https://www.youtube.com/embed/qXydeFq8cIc?autoplay=1&mute=1&loop=1&playlist=qXydeFq8cIc&controls=0&showinfo=0&modestbranding=1&autohide=1";

    return (
        <div className="w-full relative">

            {/* --- ARKA PLAN VİDEOSU GÜNCELLENDİ --- */}
            {isStandalonePage && (
                <>
                    {/* Eski <video> etiketi yerine yeni component'imizi çağırıyoruz */}
                    <YouTubeBackground src={videoSrc} title="Hakkımızda Sayfası Arkaplan Videosu" />

                    {/* Video üzerine metin okunurluğu için yarı saydam katman (bu aynı kaldı) */}
                    <div
                        className="fixed inset-0 w-screen h-screen bg-black opacity-30 z-10"
                    ></div>
                </>
            )}
            {/* --- GÜNCELLEME BİTTİ --- */}


            {/* Tüm sayfa içeriği, videonun ve katmanın üzerinde olacak (bu kısım aynı kaldı) */}
            <main className={`relative z-20 ${isStandalonePage ? 'min-h-screen flex flex-col justify-center' : 'py-0'}`}>
                <AboutHero />
                <MissionVision />
                <OurStory />
                <WhyChooseUs />
                <TeamMembers />
            </main>
        </div>
    );
}

export default About;