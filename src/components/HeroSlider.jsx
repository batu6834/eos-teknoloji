import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- SLAYT LİSTESİ GÜNCELLENDİ ---
const slides = [
    {
        type: 'youtube', // Değişti
        videoSrc: "https://www.youtube.com/embed/G6WRKIgvqJs?autoplay=1&mute=1&loop=1&playlist=G6WRKIgvqJs&controls=0&showinfo=0&modestbranding=1", // Değişti
        title: "EOS Teknoloji'ye Hoş Geldiniz",
        description: "Yazıcı destek çözümleri ve teknik servis ihtiyaçlarınız için buradayız.",
        buttonText: 'Hemen Keşfet',
        buttonLink: '/about',
    },
    {
        type: 'image',
        image: "/img/home-photo1.jpg",
        title: "Güçlü Teknik Destek",
        description: "Farklı marka ve model yazıcılar için uzman destek.",
        buttonText: 'Destek İçin',
        buttonLink: '/support',
    },
    {
        type: 'image',
        image: "/img/printer.jpg",
        title: "İş Çözümlerimiz",
        description: "Kurumsal süreçlerinizi dijitalleştiriyoruz.",
        buttonText: 'Hizmetlerimizi Gör',
        buttonLink: '/services',
    },
    {
        type: 'youtube', // Değişti
        videoSrc: "https://www.youtube.com/embed/nZLKAXwR_pM?autoplay=1&mute=1&loop=1&playlist=nZLKAXwR_pM&controls=0&showinfo=0&modestbranding=1", // Değişti
        title: "Yazıcı Destek Hizmeti",
        description: "Arıza, kurulum ve bakım için hızlı teknik çözümler.",
        buttonText: 'Detaylı Bilgi',
        buttonLink: '/services',
    },
    {
        type: 'image',
        image: "/img/home-photo4.jpg",
        title: "Sunucu Hizmetleri",
        description: "Güvenli ve kesintisiz sunucu alaptyapısı sunuyoruz.",
        buttonText: 'Çözümlerimiz',
        buttonLink: '/products',
    },
    {
        type: 'youtube', // Değişti
        videoSrc: "https://www.youtube.com/embed/QVXyxnveJ-s?autoplay=1&mute=1&loop=1&playlist=QVXyxnveJ-s&controls=0&showinfo=0&modestbranding=1", // Değişti
        title: "Güvenli Ağ Altyapısı",
        description: "Veri güvenliğinizi güçlü ağ çözümleriyle sağlıyoruz.",
        buttonText: 'Daha Fazla',
        buttonLink: '/products',
    }
];
// --- GÜNCELLEME BİTTİ ---


// --- Bu kısımlarda değişiklik yok ---
const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
};

const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 15,
            stiffness: 100,
        },
    },
    exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
};

function HeroSlider() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        afterChange: (current) => setActiveSlideIndex(current)
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <Slider {...settings} className="h-full">
                {slides.map((slide, index) => (
                    <div key={index} className="relative h-full">

                        {/* --- RENDER MANTIĞI GÜNCELLENDİ --- */}
                        {slide.type === 'youtube' ? (
                            <iframe
                                src={slide.videoSrc}
                                title={slide.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full object-cover pointer-events-none"
                            ></iframe>
                        ) : (
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                        {/* --- GÜNCELLEME BİTTİ --- */}


                        {/* --- Bu kısımlarda değişiklik yok --- */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20 pt-20">
                            <AnimatePresence mode="wait">
                                {index === activeSlideIndex && (
                                    <motion.div
                                        key={index}
                                        className="max-w-3xl"
                                        variants={textContainerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <motion.h2 variants={textVariants} className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
                                            {slide.title}
                                        </motion.h2>
                                        <motion.p variants={textVariants} className="text-lg md:text-xl text-gray-200 mb-8">
                                            {slide.description}
                                        </motion.p>
                                        <motion.div variants={textVariants}>
                                            <Link
                                                to={slides[activeSlideIndex].buttonLink}
                                                className="inline-block bg-blue-600 text-white text-lg font-semibold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg"
                                            >
                                                {slides[activeSlideIndex].buttonText}
                                            </Link>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
}

export default HeroSlider;