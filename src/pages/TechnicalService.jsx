import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import servicesData from '../data/servicesData/TechnicServiceData'; // Veriler buradan import ediliyor

function TechnicalService() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []); // Boş dependency array ile sadece bileşen ilk yüklendiğinde çalışmasını sağlıyoruz

    const service = servicesData[0];

    // Veri bulunamazsa bir hata mesajı gösterilebilir.
    if (!service) {
        return <div className="text-center text-red-500 py-10">Hizmet verisi bulunamadı.</div>;
    }

    return (
        <div>
            {/* Hero Section with Video Background */}
            <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
                <video
                    src="/videos/printer-video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                >
                    Tarayıcınız video etiketini desteklemiyor.
                </video>

                {/* Video üzerine metin */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4 z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{service.title}</h1>
                    <p className="max-w-3xl text-lg md:text-xl leading-relaxed">
                        {service.shortDescription}
                    </p>
                </div>
            </div>

            {/* Ana İçerik Bölümü */}
            <div className="max-w-5xl mx-auto px-4 py-10 bg-white shadow-lg rounded-lg -mt-16 relative z-20">
                <h2 className="text-3xl font-bold text-blue-600 mb-6">{service.title} Hizmet Detayları</h2>
                {service.longDescription.map((paragraph, idx) => (
                    <p key={idx} className="text-gray-700 leading-relaxed text-base mb-4">
                        {paragraph}
                    </p>
                ))}

                <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Sunduğumuz Başlıca Hizmetler:</h3>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed text-base space-y-2">
                    {service.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                    ))}
                </ul>

                <div className="mt-10 text-center">
                    <p className="text-gray-600 text-lg mb-4">Daha fazla bilgi veya destek talebi için bizimle iletişime geçin:</p>
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

export default TechnicalService;
