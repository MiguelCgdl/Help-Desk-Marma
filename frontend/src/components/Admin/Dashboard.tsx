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
        { name: 'Tickets Mensuales', value: stats?.totalTickets || 0, icon: TicketIcon, color: 'text-primary', bg: 'bg-primary/10', trend: '+15%' },
        { name: 'Facturación Estimada', value: `$${(stats?.totalAmount || 0).toLocaleString()}`, icon: CurrencyDollarIcon, color: 'text-green-600', bg: 'bg-green-100', trend: '+8.2%' },
        { name: 'Empresas Activas', value: stats ? Object.keys(stats.summaryByCompany).length : 0, icon: BuildingOffice2Icon, color: 'text-dark-teal', bg: 'bg-accent-teal', trend: '0%' },
        { name: 'Tiempo de Respuesta', value: '2.4h', icon: ClockIcon, color: 'text-orange-500', bg: 'bg-orange-50', trend: '-12%' },
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
        <div className="space-y-10 animate-fade-in">
            <header>
                <h1 className="text-3xl font-extrabold text-dark-teal">Panel de Control</h1>
                <p className="text-medium-teal mt-1">Bienvenido al administrador de mesa de ayuda Marmacore.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.name} className="marmacore-card p-6 bg-white hover:shadow-xl transition-all group active:scale-95 cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} transition-transform group-hover:rotate-12`}>
                                <card.icon className={`w-7 h-7 ${card.color}`} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {card.trend}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-medium-teal uppercase tracking-wider">{card.name}</h3>
                        <p className="text-3xl font-black text-dark-teal mt-2">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 marmacore-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-dark-teal">Actividad de Tickets</h3>
                            <p className="text-xs text-medium-teal font-medium">Frecuencia de reportes en la última semana</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                            <ChartPieIcon className="w-5 h-5" />
                            <span>Ver Detalles</span>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FD5200" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#FD5200" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="tickets" stroke="#FD5200" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="marmacore-card p-6 bg-white border border-gray-100 flex flex-col">
                    <h3 className="text-sm font-black text-dark-teal uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TicketIcon className="w-4 h-4 text-primary" />
                        Sin Atender
                    </h3>
                    <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                        {stats && Object.entries(stats.summaryByCompany)
                            .filter(([_, data]: [string, any]) => data.openCount > 0)
                            .map(([name, data]: [string, any]) => (
                            <button 
                                key={name} 
                                onClick={() => navigate(`/admin/tickets?companyId=${data.companyId}&status=open`)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8FAFB] hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all group/item text-left"
                            >
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-dark-teal group-hover/item:text-primary truncate">{name}</p>
                                    <p className="text-[10px] text-medium-teal font-medium">Ver tickets</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-lg font-black text-sm bg-orange-100 text-orange-600">
                                        {data.openCount}
                                    </span>
                                    <ArrowUpIcon className="w-3 h-3 text-orange-400 rotate-45 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        ))}
                        {(!stats || Object.entries(stats.summaryByCompany).filter(([_, data]: [string, any]) => data.openCount > 0).length === 0) && (
                            <div className="flex-1 flex flex-col items-center justify-center py-10">
                                <CheckCircleIcon className="w-10 h-10 text-green-200 mb-2" />
                                <p className="text-xs text-gray-400 font-bold">¡Todo al día!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;