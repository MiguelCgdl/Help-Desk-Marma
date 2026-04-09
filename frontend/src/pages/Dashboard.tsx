// frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import {
    TicketIcon,
    CurrencyDollarIcon,
    ClockIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import apiClient from '../api/client';

// Componente de tarjeta de KPI reutilizable
const KPICard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-5 shadow-card hover:shadow-glow transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-marma-text-muted">{title}</p>
                <p className="text-3xl font-bold text-marma-text mt-1">{value}</p>
                {trend && (
                    <p className={`text-xs mt-2 ${trend > 0 ? 'text-marma-success' : 'text-marma-danger'}`}>
                        {trend > 0 ? '+' : ''}{trend}% vs mes anterior
                    </p>
                )}
            </div>
            <div className="p-2 bg-marma-accent/10 rounded-lg">
                <Icon className="h-6 w-6 text-marma-accent" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalTickets: 0,
        ticketsAbiertos: 0,
        ticketsCerrados: 0,
        facturacionMensual: 0,
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, chartRes] = await Promise.all([
                    apiClient.get('/tickets/stats'),
                    apiClient.get('/tickets/chart-data'),
                ]);
                setStats(statsRes.data);
                setChartData(chartRes.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, []);

    // Colores para gráficos
    const COLORS = ['#00E5FF', '#00B4D8', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-marma-accent bg-clip-text text-transparent">
                    Dashboard
                </h1>
                <p className="text-marma-text-muted mt-1">Resumen general de tickets y facturación</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard
                    title="Total Tickets"
                    value={stats.totalTickets}
                    icon={TicketIcon}
                    trend={12}
                />
                <KPICard
                    title="Tickets Abiertos"
                    value={stats.ticketsAbiertos}
                    icon={ClockIcon}
                    trend={-5}
                />
                <KPICard
                    title="Tickets Cerrados"
                    value={stats.ticketsCerrados}
                    icon={CheckCircleIcon}
                    trend={8}
                />
                <KPICard
                    title="Facturación Mensual"
                    value={`$${stats.facturacionMensual.toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    trend={15}
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de barras: Tickets por empresa */}
                <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-5 shadow-card">
                    <h3 className="text-lg font-semibold text-marma-text mb-4">Tickets por Empresa</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                            <XAxis dataKey="company" stroke="#94A3B8" />
                            <YAxis stroke="#94A3B8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#141A29', border: '1px solid #1E293B', borderRadius: '8px' }}
                                labelStyle={{ color: '#E2E8F0' }}
                            />
                            <Bar dataKey="tickets" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de torta: Distribución por estado */}
                <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-5 shadow-card">
                    <h3 className="text-lg font-semibold text-marma-text mb-4">Estado de Tickets</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Abiertos', value: stats.ticketsAbiertos },
                                    { name: 'En Progreso', value: 12 },
                                    { name: 'Cerrados', value: stats.ticketsCerrados },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#141A29', border: '1px solid #1E293B', borderRadius: '8px' }}
                            />
                            <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}