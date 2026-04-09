import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowDownTrayIcon, FunnelIcon, CalendarIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const COLORS = ['#FD5200', '#006D65', '#00272E', '#D5EFF2', '#94A3B8'];

export default function Reports() {
    const [summary, setSummary] = useState<any>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedYear, selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/summary?year=${selectedYear}&month=${selectedMonth}`);
            setSummary(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !summary) return <div className="text-center py-20">Cargando reportes...</div>;

    const pieData = summary ? Object.keys(summary.summaryByCompany).map(key => ({
        name: key,
        value: summary.summaryByCompany[key].count
    })) : [];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#00272E]">Reportes y Concentrados</h1>
                    <p className="text-[#006D65] mt-1">Análisis mensual de tickets y facturación por empresa.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="pl-3 py-2 text-gray-400">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="pl-2 pr-4 py-2 outline-none text-sm font-semibold bg-transparent"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2023, i, 1))}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-4 py-2 outline-none text-sm font-semibold border-l border-gray-100 bg-transparent"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#D5EFF2] text-[#006D65] rounded-lg font-bold text-sm hover:bg-[#B8E2E8] transition-colors">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="marmacore-card p-6 border-l-4 border-l-[#FD5200]">
                    <p className="text-sm font-bold text-[#006D65] uppercase tracking-wider">Total Facturado</p>
                    <p className="text-4xl font-extrabold text-[#00272E] mt-2">
                        ${summary?.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#006D65]/60">
                        <span>Periodo seleccionado</span>
                    </div>
                </div>
                
                <div className="marmacore-card p-6 border-l-4 border-l-[#006D65]">
                    <p className="text-sm font-bold text-[#006D65] uppercase tracking-wider">Tickets Totales</p>
                    <p className="text-4xl font-extrabold text-[#00272E] mt-2">{summary?.totalTickets}</p>
                    <p className="text-xs text-green-600 mt-4 font-bold">+12% vs mes anterior</p>
                </div>

                <div className="marmacore-card p-6 border-l-4 border-l-[#00272E]">
                    <p className="text-sm font-bold text-[#006D65] uppercase tracking-wider">Promedio / Empresa</p>
                    <p className="text-4xl font-extrabold text-[#00272E] mt-2">
                        {summary?.totalTickets ? (summary.totalTickets / Object.keys(summary.summaryByCompany).length).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-4">Tickets por cliente activo</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Distribution */}
                <div className="marmacore-card p-8">
                    <h3 className="text-lg font-bold text-[#00272E] mb-6">Distribución por Empresa</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table: Concentrado */}
                <div className="marmacore-card overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#00272E]">Concentrado Detallado</h3>
                        <FunnelIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Empresa</th>
                                    <th className="px-8 py-4 text-center">Tickets</th>
                                    <th className="px-8 py-4 text-right">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary && Object.keys(summary.summaryByCompany).map((company) => (
                                    <tr key={company} className="hover:bg-[#D5EFF2]/20 transition-colors">
                                        <td className="px-8 py-4 font-bold text-[#00272E]">{company}</td>
                                        <td className="px-8 py-4 text-center text-[#006D65] font-semibold">
                                            {summary.summaryByCompany[company].count}
                                        </td>
                                        <td className="px-8 py-4 text-right font-extrabold text-[#FD5200]">
                                            ${summary.summaryByCompany[company].totalCost.toLocaleString('es-MX')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
