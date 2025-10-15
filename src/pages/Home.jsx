import React from "react";
// HeroSlider bileşenini import ediyoruz, artık en üstte yer alacak
import HeroSlider from "../components/HeroSlider"; // HeroSlider'ın doğru yolu bu olmalı
import HomeHero from "../components/HomeComponents/HomeHero"; // HomeHero da artık Services'tan sonra gelecek
import Services from "../components/Services";
import HomeAbout from "../components/HomeComponents/HomeAbout";
import Contact from "./Contact"; // Contact bileşeni en sonda kalmaya devam ediyor
import HomePartnerships from "../components/HomeComponents/HomePartnerships";

function Home() {
    return (
        <>
            {/* 1. HeroSlider - Sayfanın en üstünde yer alan ana kaydırıcı */}
            <HeroSlider />

            {/* 2. Hizmetler bölümü - Şirketin sunduğu hizmetleri tanıtır */}
            <section className="relative z-10">
            <Services />
            </section>

            {/* 3. HomeHero - Services'tan sonra gelen odaklanmış kahraman bölümü */}
            {/* Bu bölüm, tek bir güçlü mesaj veya görsel için kullanılabilir */}
            <HomeHero />

            {/* 4. Anasayfaya özel Hakkımızda bölümü - Şirketin kısa bir tanıtımını yapar */}
            <HomeAbout />

            <section>
            <HomePartnerships/>
            </section>

            {/* 5. İletişim bölümü - Kullanıcıların iletişime geçmesini sağlar */}
            {/* isStandalonePage prop'u, Contact bileşeninin bu bağlamda bağımsız bir sayfa gibi davranmamasını sağlar */}
            <section className="py-0 bg-blue-900">
                <Contact isStandalonePage={false} />
            </section>
        </>
    );
}

export default Home;
