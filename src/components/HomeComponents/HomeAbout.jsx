import React from 'react';

function HomeAbout() {
    return (
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                        Biz Kimiz?
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Dijital dönüşüm yolculuğunuzda güvenilir ortağınız.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Metin İçeriği */}
                    <div className="md:w-1/2 space-y-6 animate-fade-in-left">
                        <p className="text-lg leading-relaxed">
                            <strong className="text-blue-600 dark:text-blue-300">EOS Teknoloji Hizmetleri</strong> olarak, dijital çağın hızla değişen dinamiklerine ayak uydurarak işletmelerin teknolojik ihtiyaçlarını karşılamak ve onları geleceğe taşımak misyonuyla yola çıktık. Yılların verdiği deneyim ve sürekli güncellenen bilgi birikimimizle, müşterilerimize sadece çözümler sunmakla kalmıyor, aynı zamanda iş süreçlerini optimize etmelerine, verimliliklerini artırmalarına ve rekabet avantajı elde etmelerine yardımcı oluyoruz.
                        </p>
                        <p className="text-lg leading-relaxed">
                            Çekirdek yetkinliklerimiz arasında geniş bir yelpazede IT danışmanlığı, altyapı çözümleri, bulut hizmetleri ve siber güvenlik yer almaktadır. İşletmelerin karmaşık teknoloji gereksinimlerini basitleştirerek, onların ana işlerine odaklanmalarını sağlıyoruz. Özellikle, modern ofislerin vazgeçilmezi olan baskı çözümlerinde de uzmanız. Yazıcı kurulumundan, sarf malzeme yönetimine, ağ yazıcı entegrasyonundan, güvenli baskı çözümlerine kadar her aşamada kapsamlı destek sağlıyoruz.
                        </p>
                        <p className="text-lg leading-relaxed">
                            Baskı maliyetlerini düşürmek ve belge yönetimini kolaylaştırmak için akıllı yazıcı çözümleri sunarak, işletmelerin kağıt israfını azaltmalarına ve çevresel ayak izlerini küçültmelerine katkıda bulunuyoruz. Müşteri memnuniyetini her zaman en ön planda tutan <strong className="text-blue-600 dark:text-blue-300">EOS Teknoloji Hizmetleri</strong>, her projeyi bir ortaklık olarak görür. Güvenilirlik, yenilikçilik ve şeffaflık ilkeleriyle hareket ederek, uzun vadeli ve sürdürülebilir ilişkiler kurmayı hedefliyoruz. Teknolojiye olan tutkumuz ve çözüm odaklı yaklaşımımızla, işletmenizin dijital dönüşüm yolculuğunda güvenilir bir rehber olmaya hazırız.
                        </p>
                    </div>

                    {/* Görsel Alanı */}
                    <div className="md:w-1/2 flex justify-center animate-fade-in-right">
                        <img
                            src="/img/logo.png" // Doğru yol
                            alt="EOS Teknoloji Hizmetleri"
                            // Boyutlandırma için yeni sınıflar eklendi
                            // w-full: Konteynerinin tüm genişliğini kaplar
                            // h-auto: En boy oranını korur
                            // max-w-xl: Maksimum genişliğini kısıtlar (isteğe bağlı, deneyebilirsiniz)
                            className="w-full h-auto max-w-xl rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300 ease-in-out border-4 border-blue-200 dark:border-blue-700"
                        />
                    </div>
                </div>
            </div>
            {/* Basit animasyonlar için özel CSS */}
            <style jsx>{`
                @keyframes fadeInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fade-in-left {
                    animation: fadeInLeft 1s ease-out forwards;
                    opacity: 0;
                }
                .animate-fade-in-right {
                    animation: fadeInRight 1s ease-out forwards;
                    opacity: 0;
                    animation-delay: 0.2s; /* Hafif gecikme */
                }
            `}</style>
        </section>
    );
}

export default HomeAbout;
