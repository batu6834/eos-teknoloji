import React, { useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// isStandalonePage prop'u eklendi, varsayılan değeri true
function Contact({ isStandalonePage = true }) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Sadece bağımsız sayfa olarak kullanıldığında scroll'u sıfırla
        if (isStandalonePage) {
            window.scrollTo(0, 0);
        }
    }, [isStandalonePage]);

    const [formState, setFormState] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('contacts')
                .insert([formState]);

            if (error) {
                console.error("Supabase'e veri eklenirken hata oluştu:", error);
                setMessage("Mesajınızı gönderirken bir hata oluştu. Lütfen tekrar deneyin.");
            } else {
                setMessage("Mesajınız başarıyla gönderildi!");

                setFormState({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                });

                setTimeout(() => {
                    setMessage('');
                }, 5000);
            }
        } catch (error) {
            console.error("Veri gönderilirken beklenmeyen bir hata oluştu:", error);
            setMessage("Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    const contactDetails = [
        { icon: <FaMapMarkerAlt />, title: 'Adres', text: 'İnkılap, Kesim Sk. No:2, 34768 Ümraniye/İstanbul', link: null },
        { icon: <FaPhone />, title: 'Telefon', text: '+90 216 481 05 06', link: 'tel:+902164810506' },
        { icon: <FaEnvelope />, title: 'E-posta', text: 'info@eosteknoloji.com', link: 'mailto:info@eosteknoloji.com' },
        { icon: <FaClock />, title: 'Çalışma Saatleri', text: 'Pzt - Cum: 09:00 - 18:00', link: null },
    ];

    return (
        <div className="bg-gray-900 min-h-screen relative overflow-hidden">
            <main className="relative z-10 py-16 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold text-center text-white mb-16 mt-9"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        Bize Ulaşın
                    </motion.h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-gray-800 rounded-2xl shadow-2xl p-8 lg:p-12">
                        {/* Sol Kısım: İletişim Formu */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">İletişim Formu</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <motion.input
                                    type="text"
                                    name="name"
                                    placeholder="Adınız Soyadınız"
                                    value={formState.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    variants={inputVariants}
                                    initial="hidden"
                                    animate="visible"
                                />
                                <motion.input
                                    type="email"
                                    name="email"
                                    placeholder="E-posta Adresiniz"
                                    value={formState.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    variants={inputVariants}
                                    initial="hidden"
                                    animate={{ ...inputVariants.visible, transition: { delay: 0.1 } }}
                                />
                                <motion.input
                                    type="text"
                                    name="subject"
                                    placeholder="Konu"
                                    value={formState.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    variants={inputVariants}
                                    initial="hidden"
                                    animate={{ ...inputVariants.visible, transition: { delay: 0.2 } }}
                                />
                                <motion.textarea
                                    name="message"
                                    placeholder="Mesajınız"
                                    value={formState.message}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    variants={inputVariants}
                                    initial="hidden"
                                    animate={{ ...inputVariants.visible, transition: { delay: 0.3 } }}
                                ></motion.textarea>
                                <motion.button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 0.4 }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                                </motion.button>
                                <AnimatePresence>
                                    {message && (
                                        <motion.p
                                            className={`text-center mt-4 p-2 rounded-md ${message.includes("başarıyla") ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            {message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </form>
                        </motion.div>

                        {/* Sağ Kısım: Harita ve İletişim Bilgileri */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col space-y-8"
                        >
                            {/* Hizalama için görünmez bir başlık eklendi */}
                            <h2 className="text-1xl font-bold text-white mb-0 invisible">Harita Başlık</h2>

                            <div className="rounded-lg overflow-hidden shadow-xl h-64 lg:h-96">
                                <iframe
                                    title="Google Harita"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.6730295587727!2d29.10657837567913!3d41.03240887134713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac91df61ade5b%3A0x2d18b1e79a8d401c!2zxLBua8SxbGFwLCBLZXNpbSBTay4gTm86MiwgMzQ3Njggw5xtcmFuaXllL0lzdGFuYnVs!5e0!3m2!1sen!2str!4v1754389390997!5m2!1sen!2str"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contactDetails.map((item, index) => (
                                    item.link ? (
                                        <a
                                            key={index}
                                            href={item.link}
                                            className="flex items-center p-4 bg-gray-700 rounded-lg shadow-md space-x-4 transition duration-300 transform hover:scale-105 hover:bg-gray-600 cursor-pointer"
                                        >
                                            <div className="text-blue-500 text-2xl flex-shrink-0">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold">{item.title}</h3>
                                                <p className="text-gray-400 text-sm">{item.text}</p>
                                            </div>
                                        </a>
                                    ) : (
                                        <div
                                            key={index}
                                            className="flex items-center p-4 bg-gray-700 rounded-lg shadow-md space-x-4"
                                        >
                                            <div className="text-blue-500 text-2xl flex-shrink-0">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold">{item.title}</h3>
                                                <p className="text-gray-400 text-sm">{item.text}</p>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Contact;
