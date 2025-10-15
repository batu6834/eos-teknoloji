import React from 'react';
import { motion } from 'framer-motion';
import { FaBullseye, FaRocket } from 'react-icons/fa';

const containerVariants = {
    offscreen: { opacity: 0 },
    onscreen: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
        },
    },
};

const itemVariants = {
    offscreen: { y: 30, opacity: 0 },
    onscreen: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

function MissionVision() {
    return (
        <section className="py-16">
            <motion.div
                className="max-w-6xl mx-auto px-6 text-center"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.3 }}
                variants={containerVariants}
            >
                <motion.h2 variants={itemVariants} className="text-4xl font-bold text-white mb-12 p-2 rounded-md">
                    Misyonumuz ve Vizyonumuz
                </motion.h2>
                <div className="flex flex-col md:flex-row gap-10">
                    <motion.div
                        className="flex-1 p-8 rounded-xl shadow-lg bg-white/70 backdrop-blur-sm flex flex-col items-center"
                        variants={itemVariants}
                    >
                        <FaBullseye className="text-5xl text-blue-600 mb-4" />
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Misyonumuz</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Müşterilerimizin teknolojik ihtiyaçlarını en yüksek kalite standartlarında, yenilikçi ve sürdürülebilir çözümlerle karşılayarak iş verimliliklerini en üst düzeye çıkarmak.
                        </p>
                    </motion.div>

                    <motion.div
                        className="flex-1 p-8 rounded-xl shadow-lg bg-white/70 backdrop-blur-sm flex flex-col items-center"
                        variants={itemVariants}
                    >
                        <FaRocket className="text-5xl text-purple-600 mb-4" />
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Vizyonumuz</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Sektörde öncü ve güvenilir bir teknoloji firması olarak, sürekli gelişen teknolojiyi takip ederek geleceğin dijital dünyasını şekillendiren çözümler üretmek.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}

export default MissionVision;
