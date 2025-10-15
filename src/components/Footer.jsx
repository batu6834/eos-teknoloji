import React from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { motion } from 'framer-motion';

function Footer() {
    // Sosyal medya ve linkler için örnek veriler
    const socialLinks = [
        { icon: FaFacebookF, url: '#' },
        { icon: FaTwitter, url: '#' },
        { icon: FaLinkedinIn, url: '#' },
        { icon: FaInstagram, url: '#' },
    ];

    const footerLinks = [
        { name: 'Hizmetler', url: '#' },
        { name: 'Referanslar', url: '#' },
        { name: 'Gizlilik Politikası', url: '#' },
        { name: 'İletişim', url: '#' },
    ];

    return (
        <motion.footer
            className="relative z-20 w-full bg-gray-900/80 backdrop-blur-sm text-white py-12 border-t border-gray-700 mt-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
        >
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left space-y-8 md:space-y-0">
                    {/* Şirket Bilgileri */}
                    <div className="flex-1 max-w-sm">
                        <h3 className="text-2xl font-bold mb-4">EOS Teknoloji</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Teknoloji alanında yenilikçi çözümler sunan, müşteri odaklı bir firmayız. İş süreçlerinizi dijitalleştirerek verimliliğinizi artırıyoruz.
                        </p>
                    </div>

                    {/* Navigasyon Linkleri */}
                    <div className="flex-1 flex flex-col items-center md:items-start">
                        <h4 className="text-lg font-semibold mb-3">Hızlı Erişim</h4>
                        <ul className="space-y-2">
                            {footerLinks.map((link, index) => (
                                <li key={index}>
                                    <a href={link.url} className="text-gray-400 hover:text-white transition-colors duration-200">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Sosyal Medya */}
                    <div className="flex-1 flex flex-col items-center md:items-start">
                        <h4 className="text-lg font-semibold mb-3">Bizi Takip Edin</h4>
                        <div className="flex space-x-4">
                            {socialLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    <link.icon className="h-6 w-6" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <hr className="my-8 border-gray-700" />

                {/* Telif Hakkı ve Yasal Bilgiler */}
                <div className="text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} EOS Teknoloji. Tüm Hakları Saklıdır.</p>
                </div>
            </div>
        </motion.footer>
    );
}

export default Footer;
