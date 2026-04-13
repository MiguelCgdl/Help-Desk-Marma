import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    HomeIcon,
    TicketIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    BuildingOfficeIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon },
    { name: 'Empresas', href: '/companies', icon: BuildingOfficeIcon },
    { name: 'Reportes', href: '/reports', icon: ChartBarIcon },
    { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-marma-bg text-marma-text font-sans">
            {/* Botón menú móvil */}
            <div className="md:hidden flex items-center justify-between p-4 bg-marma-card border-b border-marma-border sticky top-0 z-40">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-marma-accent to-marma-accent-dark shadow-glow" />
                    <span className="text-xl font-semibold tracking-tight uppercase">Marma<span className="text-marma-accent">core</span></span>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-marma-text-muted hover:text-marma-accent transition-colors"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            {/* Sidebar Overlay para móvil */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-marma-bg/80 backdrop-blur-sm z-50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-marma-card/80 backdrop-blur-md border-r border-marma-border shadow-card z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="flex flex-col h-full px-4 py-6">
                    {/* Logo y cerrar */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-marma-accent to-marma-accent-dark shadow-glow" />
                            <span className="text-xl font-semibold tracking-tight uppercase">Marma<span className="text-marma-accent">core</span></span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 text-marma-text-muted hover:text-marma-accent"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navegación */}
                    <nav className="flex-1 space-y-1">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-marma-accent/10 text-marma-accent border-l-2 border-marma-accent shadow-glow'
                                        : 'text-marma-text-muted hover:bg-white/5 hover:text-marma-text'
                                    }`
                                }
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Perfil de usuario */}
                    <div className="pt-4 border-t border-marma-border">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-marma-accent to-marma-accent-dark" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-marma-text">Admin User</p>
                                <p className="text-xs text-marma-text-muted truncate">admin@marmacore.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="md:pl-64 transition-all duration-300">
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}