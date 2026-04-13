import React from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { BASE_SERVER_URL } from '../config';
import { TicketIcon, QueueListIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export type CompanyOutletContext = {
    lockedCompany: { _id: string; name: string };
};

const CompanyLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('companyToken');
    const raw = localStorage.getItem('companyProfile');

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    
    if (!token || !raw) {
        return <Navigate to="/empresa/login" state={{ from: location }} replace />;
    }

    let profile: { _id: string; name: string; code?: string; logoUrl?: string };
    try {
        profile = JSON.parse(raw);
    } catch {
        localStorage.removeItem('companyToken');
        localStorage.removeItem('companyProfile');
        return <Navigate to="/empresa/login" replace />;
    }

    const lockedCompany = { _id: profile._id, name: profile.name };

    const logout = () => {
        localStorage.removeItem('companyToken');
        localStorage.removeItem('companyProfile');
        navigate('/', { replace: true });
    };

    const ctx: CompanyOutletContext = { lockedCompany };
    const navCls = (path: string) =>
        `flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
            location.pathname.startsWith(path) 
            ? 'bg-[#00272E] text-white shadow-lg shadow-[#00272E]/10' 
            : 'text-[#006D65] hover:bg-[#D5EFF2]/50 hover:text-[#00272E]'
        }`;

    const finalLogo = profile.logoUrl
        ? (profile.logoUrl.startsWith('http') ? profile.logoUrl : `${BASE_SERVER_URL}/${profile.logoUrl}`)
        : "https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png";

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-jakarta">
            <header className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={finalLogo}
                                alt={profile.name}
                                className="h-10 object-contain drop-shadow-sm"
                            />
                            <div>
                                <p className="text-[10px] font-black text-[#006D65] uppercase tracking-widest opacity-80">Portal empresa</p>
                                <p className="font-black text-[#00272E] text-lg leading-tight tracking-tight">{profile.name}</p>
                            </div>
                        </div>
                        <button 
                            className="p-2 sm:hidden rounded-xl bg-gray-50 text-[#00272E]"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                        </button>
                    </div>

                    <nav className={`${isMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 mt-4 sm:mt-0`}>
                        <Link to="/empresa/incidente" className={navCls('/empresa/incidente')} onClick={() => setIsMenuOpen(false)}>
                            <TicketIcon className="w-5 h-5" />
                            Levantar incidente
                        </Link>
                        <Link to="/empresa/tickets" className={navCls('/empresa/tickets')} onClick={() => setIsMenuOpen(false)}>
                            <QueueListIcon className="w-5 h-5" />
                            Mis tickets
                        </Link>
                        <button
                            type="button"
                            onClick={logout}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 w-full sm:w-auto rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all mt-2 sm:mt-0"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            Salir
                        </button>
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-10">
                <Outlet context={ctx} />
            </main>
        </div>
    );
};

export default CompanyLayout;
