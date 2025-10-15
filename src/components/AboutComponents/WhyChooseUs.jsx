import React, { useState, useEffect } from 'react';
import {
    FaTools,
    FaShieldAlt,
    FaClock,
    FaTags,
    FaCogs,
    FaTruck,
    FaWrench,
    FaTimes,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
    offscreen: {
        y: 50,
        opacity: 0,
    },
    onscreen: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            bounce: 0.3,
            duration: 0.6,
        },
    },
};

const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 20,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: {
            duration: 0.3,
        },
    },
};

const servicesData = [
    {
        icon: FaTools,
        title: 'Uzman Kadro',
        desc: 'Deneyimli ve profesyonel ekip.',
        longDesc: 'Alanında uzman, sertifikalı ve sürekli eğitimlerle kendini geliştiren ekibimizle, en karmaşık sorunlarınıza bile hızlı ve etkili çözümler sunuyoruz. Müşteri memnuniyeti odaklı çalışarak, her zaman en iyi hizmeti sağlamayı hedefliyoruz.',
    },
    {
        icon: FaShieldAlt,
        title: 'Güvenilir Servis',
        desc: 'Orijinal parçalar ve garanti.',
        longDesc: 'Tüm tamir ve bakım işlemlerimizde sadece orijinal ve yüksek kaliteli yedek parçalar kullanıyoruz. Yapılan her işleme ve kullanılan her parçaya garanti vererek, cihazlarınızın uzun ömürlü ve sorunsuz çalışmasını sağlıyoruz. Güveniniz bizim için önceliklidir.',
    },
    {
        icon: FaClock,
        title: 'Zamanında Müdahale',
        desc: 'Hızlı çözüm, minimum bekleme.',
        longDesc: 'Zamanınızın değerli olduğunu biliyoruz. Bu nedenle, arıza bildirimlerinize en kısa sürede yanıt veriyor ve hızlı bir şekilde müdahale ediyoruz. Planlı bakım ve onarım süreçlerimizle, cihazlarınızın işleyişini aksatmadan hizmet veriyoruz.',
    },
    {
        icon: FaTags,
        title: 'Uygun Fiyatlar',
        desc: 'Kaliteli hizmet, ekonomik çözümler.',
        longDesc: 'Yüksek kaliteli hizmet anlayışımızdan ödün vermeden, bütçenize uygun çözümler sunuyoruz. Şeffaf fiyat politikamızla, herhangi bir sürprizle karşılaşmazsınız. En iyi hizmeti en uygun fiyata almanız için çalışıyoruz.',
    },
    {
        icon: FaCogs,
        title: 'Yedek Parça',
        desc: 'Orijinal ve garantili yazıcı parçaları ile cihazlarınızın ömrünü uzatıyoruz.',
        longDesc: 'Yazıcılarınızın performansını ve ömrünü uzatmak için yalnızca orijinal ve garantili yedek parçalar kullanıyoruz. Geniş parça stoğumuz sayesinde, ihtiyaç duyduğunuz parçalara hızlıca ulaşabilir, cihazlarınızın ilk günkü verimliliğine kavuşmasını sağlayabilirsiniz.',
    },
    {
        icon: FaTruck,
        title: 'Hızlı Teslimat',
        desc: '81 ilin tamamına ulaşan geniş lojistik ağıyla hızlı teslimat imkanı sunuyoruz.',
        longDesc: 'Türkiye\'nin 81 iline ulaşan geniş ve entegre lojistik ağımız sayesinde, siparişlerinizi ve tamir edilmiş cihazlarınızı en hızlı ve güvenli şekilde adresinize ulaştırıyoruz. Zamanında teslimat garantisiyle, işlerinizin aksamamasını sağlıyoruz.',
    },
    {
        icon: FaWrench,
        title: 'Bakım & Temizlik',
        desc: 'Yazıcınızın performansını artırmak için düzenli bakım ve temizlik hizmeti veriyoruz.',
        longDesc: 'Yazıcılarınızın uzun ömürlü ve yüksek performansla çalışması için düzenli bakım ve detaylı temizlik hizmetleri sunuyoruz. Bu hizmetler, olası arızaları önler, baskı kalitesini artırır ve cihazınızın verimliliğini maksimize eder.',
    },
];

function WhyChooseUs() {
    const [selectedCard, setSelectedCard] = useState(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && selectedCard) {
                setSelectedCard(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedCard]);

    const handleCardClick = (card) => {
        setSelectedCard(card);
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
    };

    return (
        <section
            className="py-16 px-4 text-center"
        >
            <div className="relative z-30 max-w-6xl mx-auto pt-8">
                <h2 className="text-3xl font-bold mb-12 text-white px-4 py-2 rounded-md">
                    <strong>Neden Bizi Tercih Etmelisiniz ?</strong>
                </h2>
                <hr />
                <br />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {servicesData.map((card, i) => (
                        <motion.div
                            key={card.title}
                            className="flex flex-col items-center p-6 rounded-2xl bg-white/70 backdrop-blur-sm cursor-default hover:shadow-xl transition-all duration-300"
                            initial="offscreen"
                            whileInView="onscreen"
                            whileHover={{ scale: 1.05 }}
                            viewport={{ once: true, amount: 0.8 }}
                            variants={cardVariants}
                        >
                            <card.icon className="text-gray-800 text-4xl mb-4" />
                            <h3 className="font-semibold text-xl mb-2 text-gray-900">{card.title}</h3>
                            <p className="text-gray-700 text-sm mb-4">{card.desc}</p>
                            <button
                                onClick={() => handleCardClick(card)}
                                className="mt-auto inline-block text-sm text-black border border-black hover:bg-black hover:text-white px-4 py-2 rounded transition duration-200"
                            >
                                Detaylı Açıklama
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal bileşeni (seçili kart varsa gösterilir) */}
            <AnimatePresence>
                {selectedCard && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        aria-modal="true"
                        role="dialog"
                    >
                        <motion.div
                            className="relative bg-white/90 rounded-2xl p-8 max-w-3xl w-full text-center shadow-2xl"
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                                aria-label="Kapat"
                            >
                                <FaTimes className="text-3xl" />
                            </button>
                            <selectedCard.icon className="text-purple-800 text-6xl mb-6 mx-auto" />
                            <h3 className="font-bold text-3xl mb-4 text-gray-800">{selectedCard.title}</h3>
                            <p className="text-gray-700 text-lg leading-relaxed">{selectedCard.longDesc}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

export default WhyChooseUs;
