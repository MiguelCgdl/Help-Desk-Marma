import React from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { TicketIcon, QueueListIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export type CompanyOutletContext = {
    lockedCompany: { _id: string; name: string };
};

const CompanyLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('companyToken');
    const raw = localStorage.getItem('companyProfile');

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
        `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            location.pathname.startsWith(path) ? 'bg-[#00272E] text-white' : 'text-[#006D65] hover:bg-[#D5EFF2]/50'
        }`;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-jakarta">
            <header className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={profile.logoUrl || "https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png"}
                            alt={profile.name}
                            className="h-10 object-contain"
                        />
                        <div>
                            <p className="text-xs font-bold text-[#006D65] uppercase tracking-wider">Portal empresa</p>
                            <p className="font-extrabold text-[#00272E]">{profile.name}</p>
                        </div>
                    </div>
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link to="/empresa/incidente" className={navCls('/empresa/incidente')}>
                            <TicketIcon className="w-5 h-5" />
                            Levantar incidente
                        </Link>
                        <Link to="/empresa/tickets" className={navCls('/empresa/tickets')}>
                            <QueueListIcon className="w-5 h-5" />
                            Mis tickets
                        </Link>
                        <button
                            type="button"
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            Salir
                        </button>
                    </nav>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 py-10">
                <Outlet context={ctx} />
            </main>
        </div>
    );
};

export default CompanyLayout;
