import React from 'react';
import { motion } from 'framer-motion';

const storyVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: 0.2,
        },
    },
};

function OurStory() {
    return (
        <section className="py-16 px-6 bg-gray-200">
            <motion.div
                className="max-w-4xl mx-auto text-center"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.5 }}
                variants={storyVariants}
            >
                <h2 className="text-4xl font-bold text-gray-800 mb-6">
                    Hikayemiz
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    2010 yılında küçük bir ofiste başlayan yolculuğumuz, bugün sektörün önde gelen teknoloji firmalarından biri olma hayaliyle yola çıkmıştır. Başlangıçta sadece yazıcı teknik servis hizmeti sunarken, zamanla müşterilerimizin ihtiyaçları doğrultusunda hizmetlerimizi genişleterek ağ çözümlerinden sunucu altyapılarına, kurumsal yazılımlardan veri analitiğine kadar uzanan geniş bir yelpazede çözümler sunmaya başladık. Her zaman en son teknolojiyi takip ederek, iş ortaklarımıza en iyi ve en güvenilir hizmeti vermeyi misyon edindik.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed">
                    Bugün, EOS Teknoloji olarak büyüyen ekibimiz ve Türkiye'nin dört bir yanına ulaşan servis ağımızla, her büyüklükteki işletmenin dijital dönüşüm yolculuğunda yanlarında olmaktan gurur duyuyoruz.
                </p>
            </motion.div>
        </section>
    );
}

export default OurStory;
