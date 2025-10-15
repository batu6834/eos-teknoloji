import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

function AboutHero() {
    return (
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-white" >
            {/* Metin için bir katman ekleyerek videonun okunurluğunu artırıyoruz */}
            <div className="absolute inset-0 bg-black opacity-5"></div>

            <motion.div
                className="relative z-10 text-center max-w-4xl px-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
                    variants={itemVariants}
                >
                    EOS Teknoloji: Geleceğin Çözüm Ortağı
                </motion.h1>
                <motion.p
                    className="text-lg md:text-xl font-light"
                    variants={itemVariants}
                >
                    Teknolojiye olan tutkumuz ve çözüm odaklı yaklaşımımızla, iş süreçlerinizi dönüştürmeye hazırız.
                </motion.p>
            </motion.div>
        </section>
    );
}

export default AboutHero;
