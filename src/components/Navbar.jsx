// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell/NotificationBell';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { user, supabase } = useAuth();
    const isLoggedIn = !!user;

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) navigate('/');
    };

    const mobileMenuVariants = {
        hidden: { y: '-100%', opacity: 0, transition: { duration: 0.3 } },
        visible: { y: '0%', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { y: '-100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
    };

    return (
        <nav className="fixed top-0 z-50 w-full bg-gray-800 py-4 px-6 md:px-10 flex justify-center items-center shadow-md transition-all duration-300">
            <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center text-white">
                {/* Logo */}
                <div className="flex-shrink-0">
                    <Link to="/" className="hover:opacity-80 transition-opacity duration-200">
                        <img src="/img/logo.png" alt="EOS Teknoloji Logo" className="h-10 w-auto rounded-full" />
                    </Link>
                </div>

                {/* Desktop menu */}
                <div className="hidden md:flex space-x-6 items-center">
                    <Link to="/" className="font-medium px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-20">Anasayfa</Link>
                    <Link to="/about" className="font-medium px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-20">Hakkımızda</Link>
                    <Link to="/products" className="font-medium px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-20">Ürünler</Link>
                    <Link to="/partnerships" className="font-medium px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-20">İş Ortaklıkları</Link>
                    <Link to="/support" className="font-medium px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-20">Destek</Link>
                    <Link to="/contact" className="font-medium px-3 py-2 rounded-md hover:bg-white hover:bg-opacity-20">İletişim</Link>

                    {/* Bildirimler */}
                    {isLoggedIn && <NotificationBell />}

                    {/* Login/Logout */}
                    {isLoggedIn ? (
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg ml-6">
                            Çıkış Yap
                        </button>
                    ) : (
                        <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg ml-6">
                            Giriş Yap
                        </Link>
                    )}
                </div>

                {/* Mobile menu toggle */}
                <div className="md:hidden flex items-center space-x-4">
                    {isLoggedIn && <NotificationBell />} {/* 👈 burada da ekledik */}
                    {isLoggedIn ? (
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                            Çıkış Yap
                        </button>
                    ) : (
                        <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg" onClick={() => setIsOpen(false)}>
                            Giriş Yap
                        </Link>
                    )}
                    <button onClick={() => setIsOpen(!isOpen)} aria-label="Menüyü Aç/Kapat" className="p-2 rounded-md text-white hover:text-blue-200">
                        {isOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50 p-6"
                        initial="hidden" animate="visible" exit="exit" variants={mobileMenuVariants}
                    >
                        <button onClick={() => setIsOpen(false)} aria-label="Menüyü Kapat" className="absolute top-6 right-6 p-2 text-white hover:text-blue-200">
                            <FiX className="text-3xl" />
                        </button>

                        <Link onClick={() => setIsOpen(false)} to="/" className="text-white text-2xl mb-6 font-semibold hover:text-blue-200">Anasayfa</Link>
                        <Link onClick={() => setIsOpen(false)} to="/about" className="text-white text-2xl mb-6 font-semibold hover:text-blue-200">Hakkımızda</Link>
                        <Link onClick={() => setIsOpen(false)} to="/products" className="text-white text-2xl mb-6 font-semibold hover:text-blue-200">Ürünler</Link>
                        <Link onClick={() => setIsOpen(false)} to="/partnerships" className="text-white text-2xl mb-6 font-semibold hover:text-blue-200">İş Ortaklıkları</Link>
                        <Link onClick={() => setIsOpen(false)} to="/support" className="text-white text-2xl mb-6 font-semibold hover:text-blue-200">Destek</Link>
                        <Link onClick={() => setIsOpen(false)} to="/contact" className="text-white text-2xl font-semibold hover:text-blue-200">İletişim</Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

export default Navbar;
