import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  TicketIcon,
  ArrowLeftOnRectangleIcon,
  Squares2X2Icon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { name: 'Panel Principal', path: '/admin', icon: Squares2X2Icon },
        { name: 'Tickets', path: '/admin/tickets', icon: TicketIcon },
        { name: 'Empresas', path: '/admin/companies', icon: BuildingOfficeIcon },
        { name: 'Tipos de Problema', path: '/admin/problems', icon: ExclamationCircleIcon },
        { name: 'Reporte tickets', path: '/admin/reports', icon: ChartBarIcon },
        { name: 'Configurar Costos', path: '/admin/costs', icon: CurrencyDollarIcon },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFB] font-jakarta overflow-hidden">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#00272E] text-white flex items-center justify-between px-6 z-30 border-b border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                    <img src="https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png" alt="Marmacore" className="h-6 brightness-0 invert" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                </button>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 w-72 bg-[#00272E] text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-8 border-b border-white/10 flex flex-col items-center">
                    <img src="https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png" alt="Marmacore" className="h-10 brightness-0 invert" />
                    <p className="mt-4 text-[10px] font-bold text-primary uppercase tracking-[0.3em] text-center">Administración</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-[#FD5200] text-white shadow-lg shadow-[#FD5200]/20' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-bold text-sm tracking-wide">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors duration-300"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm">Cerrar Sesión</span>
                    </button>
                    <div className="mt-4 px-4 py-2 bg-white/5 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Sesión activa</p>
                        <p className="text-sm font-medium">Administrador</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 lg:pt-8 relative min-w-0">
                <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#D5EFF2]/20 to-transparent -z-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="w-full max-w-[1800px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;