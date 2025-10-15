import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin } from 'lucide-react';

const contactDetails = [
    {
        icon: <Phone size={28} className="text-blue-500" />,
        title: 'Bizi Arayın',
        info: '+90 212 123 45 67',
        link: 'tel:+902121234567',
    },
    {
        icon: <Mail size={28} className="text-blue-500" />,
        title: 'E-posta Gönderin',
        info: 'info@eosteknoloji.com.tr',
        link: 'mailto:info@eosteknoloji.com.tr',
    },
    {
        icon: <MapPin size={28} className="text-blue-500" />,
        title: 'Adresimiz',
        info: 'İnkılap Caddesi Kesim Sokak No:2, Ümraniye/İstanbul',
        link: 'https://www.google.com/maps/place/İnkılap+Cd.+Kesim+Sk.+No:2,+34768+Ümraniye%2F%C4%B0stanbul',
    },
];

const ContactInfo = () => {
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
            }
        }
    };

    return (
        // The parent component now handles the grid layout, so we just return the items.
        <>
            {contactDetails.map((item, index) => (
                <motion.a
                    key={index}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-6 bg-white bg-opacity-70 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    transition={{ delay: index * 0.2 }}
                >
                    <div className="mb-4">
                        {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.info}</p>
                </motion.a>
            ))}
        </>
    );
};

export default ContactInfo;
