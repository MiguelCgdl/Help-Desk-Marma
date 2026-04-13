import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TicketIcon, 
  BuildingOffice2Icon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowUpIcon,
  ChartPieIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { BASE_SERVER_URL } from '../../config';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const res = await api.get(`/reports/summary?year=${year}&month=${month}`);
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { name: 'Tickets Mensuales', value: stats?.totalTickets || 0, icon: TicketIcon, color: 'text-primary', bg: 'bg-primary/10', trend: '+15%', path: '/admin/tickets' },
        { name: 'Facturación Estimada', value: `$${(stats?.totalAmount || 0).toLocaleString()}`, icon: CurrencyDollarIcon, color: 'text-green-600', bg: 'bg-green-100', trend: '+8.2%', path: '/admin/reports' },
        { name: 'Empresas Activas', value: stats ? Object.keys(stats.summaryByCompany).length : 0, icon: BuildingOffice2Icon, color: 'text-dark-teal', bg: 'bg-accent-teal', trend: '0%', path: '/admin/companies' },
        { name: 'Tiempo de Respuesta', value: '2.4h', icon: ClockIcon, color: 'text-orange-500', bg: 'bg-orange-50', trend: '-12%', path: '/admin/tickets' },
    ];

    const chartData = [
        { name: 'Lun', tickets: 12 },
        { name: 'Mar', tickets: 19 },
        { name: 'Mie', tickets: 15 },
        { name: 'Jue', tickets: 22 },
        { name: 'Vie', tickets: 30 },
        { name: 'Sab', tickets: 10 },
        { name: 'Dom', tickets: 5 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Panel de Control</h1>
                <p className="text-[#006D65] mt-1 text-sm font-medium">Bienvenido al administrador de mesa de ayuda Marmacore.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {cards.map((card) => (
                    <div 
                        key={card.name} 
                        onClick={() => navigate(card.path)}
                        className="marmacore-card p-5 bg-white hover:shadow-xl transition-all group active:scale-95 cursor-pointer border-none shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-xl ${card.bg} transition-transform group-hover:rotate-12`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${card.trend.startsWith('+') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {card.trend}
                            </span>
                        </div>
                        <h3 className="text-[9px] font-black text-[#006D65] uppercase tracking-widest opacity-70">{card.name}</h3>
                        <p className="text-2xl font-black text-[#00272E] mt-1 tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 marmacore-card p-6 border-none shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-[#00272E]">Actividad de Tickets</h3>
                            <p className="text-[11px] text-[#006D65] font-medium opacity-70">Reportes de la última semana</p>
                        </div>
                        <div 
                            onClick={() => navigate('/admin/reports')}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-[#FD5200] hover:underline cursor-pointer"
                        >
                            <ChartPieIcon className="w-4 h-4" />
                            <span>Ver Detalles</span>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FD5200" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#FD5200" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '700', fill: '#94A3B8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '700', fill: '#94A3B8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="tickets" stroke="#FD5200" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 marmacore-card p-6 border-none shadow-sm">
                    <h3 className="text-base font-bold text-[#00272E] mb-5">Empresas Top</h3>
                    <div className="space-y-5">
                        {stats?.topCompanies?.map((c: any) => (
                            <div 
                                key={c.name} 
                                onClick={() => navigate('/admin/companies')}
                                className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-xl transition-all"
                            >
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-1 group-hover:border-[#FD5200]/30 transition-all">
                                    <img 
                                        src={c.logoUrl.startsWith('http') ? c.logoUrl : `${BASE_SERVER_URL}/${c.logoUrl}`} 
                                        alt={c.name} 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[11px] font-bold text-[#00272E] line-clamp-1">{c.name}</h4>
                                    <p className="text-[9px] text-[#006D65] font-black uppercase tracking-wider opacity-60">{c.count} tickets</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;