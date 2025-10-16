import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        type: 'youtube',
        videoSrc: "https://www.youtube.com/embed/G6WRKIgvqJs?autoplay=1&mute=1&loop=1&playlist=G6WRKIgvqJs&controls=0&showinfo=0&modestbranding=1&autohide=1",
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
        type: 'youtube',
        videoSrc: "https://www.youtube.com/embed/nZLKAXwR_pM?autoplay=1&mute=1&loop=1&playlist=nZLKAXwR_pM&controls=0&showinfo=0&modestbranding=1&autohide=1",
        title: "Yazıcı Destek Hizmeti",
        description: "Arıza, kurulum ve bakım için hızlı teknik çözümler.",
        buttonText: 'Detaylı Bilgi',
        buttonLink: '/services',
    },
    {
        type: 'image',
        image: "/img/home-photo4.jpg",
        title: "Sunucu Hizmetleri",
        description: "Güvenli ve kesintisiz sunucu altyapısı sunuyoruz.",
        buttonText: 'Çözümlerimiz',
        buttonLink: '/products',
    },
    {
        type: 'youtube',
        videoSrc: "https://www.youtube.com/embed/QVXyxnveJ-s?autoplay=1&mute=1&loop=1&playlist=QVXyxnveJ-s&controls=0&showinfo=0&modestbranding=1&autohide=1",
        title: "Güvenli Ağ Altyapısı",
        description: "Veri güvenliğinizi güçlü ağ çözümleriyle sağlıyoruz.",
        buttonText: 'Daha Fazla',
        buttonLink: '/products',
    }
];
const textContainerVariants = { /* ... aynı kalacak ... */ };
const textVariants = { /* ... aynı kalacak ... */ };


// --- YARDIMCI COMPONENT BAŞLANGICI ---
// Bu küçük component'in tek görevi, YouTube videosunu tam ekran kaplayacak şekilde göstermek.
function YouTubeBackground({ src, title }) {
    return (
        <div className="absolute inset-0 overflow-hidden bg-black">
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


function HeroSlider() {
    // Bu kısımların hepsi senin orijinal kodunla aynı.
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

                        {/* Render mantığı artık daha temiz. 
                            Eğer tip 'youtube' ise, bizim özel component'imizi çağırıyor. */}
                        {slide.type === 'youtube' ? (
                            <YouTubeBackground src={slide.videoSrc} title={slide.title} />
                        ) : (
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Bu kısımların hepsi de senin orijinal kodunla aynı. */}
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