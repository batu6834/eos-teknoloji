// src/components/Services.jsx

import React from 'react';
import { FaTools, FaServer, FaNetworkWired, FaChartLine, FaLaptop } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Kullanmak istediğiniz sabit arka plan görselinin URL'si
const SERVICE_BACKGROUND_IMAGE = '/img/home-photo6.jpg';

const services = [
    {
        title: 'Teknik Destek',
        description:
            'Firmamız, farklı marka ve model yazıcılar için kapsamlı teknik destek hizmetleri sunmaktadır. Periyodik bakım, donanım onarımı, parça değişimi ve yazılım güncellemeleri, uzman teknik ekibimiz tarafından hızlı ve güvenilir şekilde gerçekleştirilir. Tüm müdahaleler, cihaz verimliliğini artırmayı ve olası iş kayıplarını en aza indirmeyi hedefler. Süreç boyunca kurumsal raporlama ve müşteri bilgilendirmesi sağlanır...',
        icon: <FaTools className="text-white text-4xl mx-auto mb-4" />,
        link: '/services/TechnicalService',
        image: '/img/technic2.jpg',
    },
    {
        title: 'İş Çözümleri',
        description:
            'Kurumsal süreçlerinizi dijitalleştirerek daha etkin, şeffaf ve entegre bir yapı kurmanıza yardımcı oluyoruz. İş akış yönetimi, belge yönetimi, CRM ve ERP entegrasyonları gibi modüllerle süreç takibini kolaylaştırıyoruz. Her sektör için özelleştirilmiş çözümler ile zaman ve kaynak tasarrufu sağlanır. İş süreçlerinizde verimliliği artırmak önceliğimizdir...',
        icon: <FaNetworkWired className="text-white text-4xl mx-auto mb-4" />,
        link: '/services/BusinessSolutions',
        image: '/img/business.jpg',
    },
    {
        title: 'Sunucu ve Depolama Sistemleri',
        description:
            'Kurumsal yapınıza uygun sunucu sistemleri ve güvenilir veri depolama çözümleriyle, bilgi teknolojileri altyapınızı güçlendiriyoruz. İhtiyaç analizine dayalı olarak yapılandırılan sistemler; yüksek erişilebilirlik, yedeklilik ve performans odaklıdır. Fiziksel ve sanal sunucu kurulumları, veri merkezi optimizasyonu ve veri yedekleme çözümleri entegre sunulur. Gelişmiş güvenlik katmanları ile veri bütünlüğü korunur...',
        icon: <FaServer className="text-white text-4xl mx-auto mb-4" />,
        link: '/services/ServerStorageSystems',
        image: '/img/server-storage.jpg',
    },
    {
        title: 'Akıllı Ağ Teknolojileri',
        description:
            'Gelişmiş ağ çözümlerimizle işletmenizin dijital altyapısını en verimli şekilde yönetebilirsiniz. Kurumsal LAN/WAN yapılandırmaları, kablosuz ağ tasarımı, firewall güvenliği ve ağ optimizasyonu hizmetlerimizle, yüksek hızda ve kesintisiz bir bağlantı sunuyoruz. İzlenebilirlik, merkezi yönetim ve uzaktan erişim çözümleriyle BT altyapınızı modernize ediyoruz. Tüm ağ sistemleri, büyüyen işletme ihtiyaçlarına göre ölçeklenebilir...',
        icon: <FaNetworkWired className="text-white text-4xl mx-auto mb-4" />,
        link: '/services/SmartNetworkTechnologies',
        image: '/img/smart-network-tech.jpg',
    },
    {
        title: 'Operasyonel Cihaz Kiralama',
        description:
            'Şirketinizin donanım ihtiyaçlarına esnek çözümler sunuyor, operasyonel maliyetlerinizi azaltıyoruz. Kısa veya uzun vadeli yazıcı ve BT ekipman kiralama hizmetlerimiz ile teknolojiye yatırım yapmadan yüksek performanslı cihazlar kullanabilirsiniz. Tüm kiralamalarda kurulum, bakım ve teknik destek hizmetleri dahildir. Talep doğrultusunda yedek cihaz ve hızlı değişim garantisi sunulmaktadır...',
        icon: <FaLaptop className="text-white text-4xl mx-auto mb-4" />,
        link: '/services/OperationalEquipmentRental',
        image: '/img/operational-equipment.jpg',
    },
    {
        title: 'Veri Analitiği ve Yapay Zeka',
        description:
            'Verilerinizi iş değeri üreten içgörülere dönüştürerek rekabet avantajı elde etmenizi sağlıyoruz. Gelişmiş veri analitiği altyapımız, büyük veri işleme, raporlama ve karar destek sistemleri ile entegre çalışır. Yapay zeka destekli otomasyon çözümleri, verimliliği artırırken hata oranlarını minimuma indirir. Sektöre özel modellemelerle analiz süreçleri özelleştirilebilir...',
        icon: <FaChartLine className="text-white text-4xl mx-auto mb-4" />,
        link: '/services/DataAnalyticsAi',
        image: '/img/data-analytics.webp',
    },
];

// truncateText fonksiyonu, metni belirli bir kelime sayısına kısaltır
function truncateText(text, maxWords) {
    const words = text.split(" ");
    return words.length > maxWords ? words.slice(0, maxWords).join(" ") + "..." : text;
}

function Services() {
    return (
        <section
            className="relative py-20 text-center overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${SERVICE_BACKGROUND_IMAGE})`, backgroundAttachment: 'fixed' }}
        >
            {/* Arka plan görselinin üzerine yarı saydam siyah katman */}
            <div className="absolute inset-0 bg-black bg-opacity-70 z-0" />

            <div className="relative z-10 max-w-7xl mx-auto px-4">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-white">
                    <strong>Hizmetlerimiz</strong>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="group bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg shadow-lg flex flex-col justify-between h-full transform transition duration-300 hover:scale-105"
                        >
                            <div>
                                {service.image && (
                                    <div className="flex justify-center items-center mb-1">
                                        <img
                                            src={service.image}
                                            alt={service.title}
                                            className="w-full h-52 object-cover rounded-md mb-4"
                                        />
                                    </div>
                                )}
                                {/* İkonu ve başlığı daha iyi vurgulamak için bir container içine aldık */}
                                <div className="bg-blue-600 p-3 rounded-full inline-flex mb-4">
                                    {service.icon}
                                </div>
                                <h4
                                    className="text-2xl font-bold text-white text-center mb-2"
                                    style={{
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    {service.title}
                                </h4>
                                <p className="text-gray-200 mb-4 text-sm">
                                    {truncateText(service.description, 35)}
                                </p>
                            </div>

                            {service.link && (
                                <Link
                                    to={service.link}
                                    className="mt-auto inline-block text-base text-white border-2 border-white hover:bg-white hover:text-black px-6 py-2 rounded-full transition duration-300 self-center font-semibold"
                                >
                                    Devamı
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Services;
