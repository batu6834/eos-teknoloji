import React from 'react';
import { motion } from 'framer-motion';

const teamMembers = [
    { name: 'Ahmet Yılmaz', title: 'CEO & Kurucu Ortak', imageUrl: 'https://placehold.co/400x400/D1D5DB/1F2937?text=Ahmet' },
    { name: 'Ayşe Demir', title: 'CTO', imageUrl: 'https://placehold.co/400x400/D1D5DB/1F2937?text=Ayse' },
    { name: 'Mehmet Kaya', title: 'Satış Müdürü', imageUrl: 'https://placehold.co/400x400/D1D5DB/1F2937?text=Mehmet' },
    { name: 'Zeynep Akın', title: 'Pazarlama Uzmanı', imageUrl: 'https://placehold.co/400x400/D1D5DB/1F2937?text=Zeynep' },
];

const containerVariants = {
    offscreen: { opacity: 0 },
    onscreen: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    offscreen: { y: 20, opacity: 0 },
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

function TeamMembers() {
    return (
        <section className="py-16 bg-white">
            <motion.div
                className="max-w-6xl mx-auto px-6"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.3 }}
                variants={containerVariants}
            >
                <motion.h2 variants={itemVariants} className="text-4xl font-bold text-gray-800 text-center mb-12">
                    Ekibimiz
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            className="bg-gray-100 p-6 rounded-lg text-center shadow-lg"
                            variants={itemVariants}
                        >
                            <img
                                src={member.imageUrl}
                                alt={member.name}
                                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                            />
                            <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                            <p className="text-gray-600">{member.title}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}

export default TeamMembers;
