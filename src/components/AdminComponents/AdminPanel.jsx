// src/components/AdminComponents/AdminPanel.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supabaseAdmin from '../../supabaseAdminClient';
import {
    ClipboardList,
    Mail,
    Package,
    Building2,
    BarChart3,
    LogOut
} from 'lucide-react';

import AdminContacts from './AdminContacts';
import AdminTickets from './AdminTickets';
// import AdminProducts from './AdminProducts';
import AdminCompanies from './AdminCompanies';
import PerformancePage from '../../pages/PerformancePage';

const TABS = ['destek-talepleri', 'iletisim-formlari', 'urun-yonetimi', 'firmalar', 'performans'];
const DEFAULT_TAB = 'destek-talepleri';

const LABELS = {
    'destek-talepleri': { text: 'Destek Talepleri', icon: ClipboardList },
    'iletisim-formlari': { text: 'İletişim Formları', icon: Mail },
    'urun-yonetimi': { text: 'Ürün Yönetimi', icon: Package },
    'firmalar': { text: 'Firmalar', icon: Building2 },
    'performans': { text: 'Performans', icon: BarChart3 },
};

const AdminPanel = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialTab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : DEFAULT_TAB;
    const [activeTab, setActiveTab] = useState(initialTab);

    // URL -> state
    useEffect(() => {
        const t = searchParams.get('tab');
        const normalized = TABS.includes(t) ? t : DEFAULT_TAB;
        if (normalized !== activeTab) setActiveTab(normalized);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // state -> URL
    useEffect(() => {
        const current = searchParams.get('tab');
        if (current !== activeTab) {
            const sp = new URLSearchParams(searchParams);
            sp.set('tab', activeTab);
            setSearchParams(sp, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleLogout = useCallback(async () => {
        await supabaseAdmin.auth.signOut();
        navigate('/admin/login');
    }, [navigate]);

    const renderContent = () => {
        switch (activeTab) {
            case 'destek-talepleri':
                return <AdminTickets />;
            case 'iletisim-formlari':
                return <AdminContacts />;
            // case 'urun-yonetimi':
            //     return <AdminProducts />;
            case 'firmalar':
                return <AdminCompanies />;
            case 'performans':
                return <PerformancePage />;
            default:
                return null;
        }
    };

    const TabButton = ({ tab }) => {
        const { text, icon: Icon } = LABELS[tab];
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap
          ${activeTab === tab
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                <Icon size={18} />
                <span>{text}</span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top Bar */}
            <div className="bg-white shadow-md">
                <div className="container mx-auto p-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {TABS.map((t) => (
                                <TabButton key={t} tab={t} />
                            ))}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shrink-0"
                        >
                            <LogOut size={18} />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto p-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPanel;
