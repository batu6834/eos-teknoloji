import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'; // Sayfa içi navigasyon için Link bileşeni
import servicesData from '../data/servicesData/BusinessSolutionsData';

function BusinessSolutions() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [])
    const service = servicesData[0];

    return (
        <div>
            {/* Hero Section with Video Background */}
            <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
                <video
                    src="/videos/business-solution-video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                >
                    Tarayıcınız video etiketini desteklemiyor.
                </video>
                {/* Video üzerine yarı saydam koyu katman ve metin */}
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-white text-center p-4 z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{service.title}</h1>
                    <p className="max-w-3xl text-lg md:text-xl leading-relaxed">
                        {service.shortDescription}
                    </p>
                </div>
            </div>

            {/* Main Content Section - Hero alanının üzerine bindirilmiş */}
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
                    <p className="text-gray-600 text-lg mb-4">Dijital dönüşüm çözümlerimiz hakkında daha fazla bilgi almak için:</p>
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

export default BusinessSolutions;
