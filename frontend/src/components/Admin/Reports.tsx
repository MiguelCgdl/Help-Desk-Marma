import { useState, useEffect } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FunnelIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportToCSV } from '../../utils/exportUtils';
import api from '../../services/api';
import { BASE_SERVER_URL } from '../../config';

const COLORS = ['#FD5200', '#006D65', '#00272E', '#D5EFF2', '#94A3B8'];

export default function Reports() {
    const [summary, setSummary] = useState<any>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState<string>('all');

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

    const companiesInMonth = summary ? Object.keys(summary.summaryByCompany) : [];
    
    // Data for charts/views
    const pieData = summary ? companiesInMonth.map(key => ({
        name: key,
        value: summary.summaryByCompany[key].count
    })) : [];

    const currentCompanyData = selectedCompany !== 'all' ? summary.summaryByCompany[selectedCompany] : null;

    const handleExport = () => {
        if (selectedCompany === 'all') {
            // Export summary by company
            const headers = [
                { key: 'company', label: 'Empresa' },
                { key: 'count', label: 'Total Tickets' },
                { key: 'openCount', label: 'Tickets Abiertos' },
                { key: 'totalCost', label: 'Facturación Total' }
            ];
            
            const exportData = companiesInMonth.map(name => ({
                company: name,
                count: summary.summaryByCompany[name].count,
                openCount: summary.summaryByCompany[name].openCount,
                totalCost: summary.summaryByCompany[name].totalCost
            }));

            exportToCSV(`Resumen_Mensual_${selectedMonth}_${selectedYear}`, exportData, headers);
        } else {
            // Export detailed tickets for the selected company
            const headers = [
                { key: 'ticketNumber', label: 'Ticket #' },
                { key: 'createdAt', label: 'Fecha' },
                { key: 'description', label: 'Descripción' },
                { key: 'status', label: 'Estado' },
                { key: 'cost', label: 'Costo' }
            ];

            const exportData = currentCompanyData.tickets.map((t: any) => ({
                ...t,
                createdAt: new Date(t.createdAt).toLocaleDateString('es-MX'),
                status: t.status === 'open' ? 'Abierto' : 'Resuelto'
            }));

            exportToCSV(`Tickets_${selectedCompany}_${selectedMonth}_${selectedYear}`, exportData, headers);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#00272E]">Reporte tickets</h1>
                    <p className="text-[#006D65] mt-1">
                        {selectedCompany === 'all' 
                            ? 'Análisis mensual global de tickets y facturación.' 
                            : `Detalle específico para: ${selectedCompany}`}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="pl-3 py-2 text-gray-400 border-r border-gray-100">
                            <FunnelIcon className="w-4 h-4" />
                        </div>
                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="px-4 py-2 outline-none text-sm font-bold text-[#00272E] bg-transparent"
                        >
                            <option value="all">Todas las Empresas</option>
                            {companiesInMonth.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="pl-3 py-2 text-gray-400">
                            <CalendarIcon className="w-4 h-4" />
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

                    <button 
                        onClick={handleExport}
                        className="px-4 py-2 bg-[#FD5200] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FD5200]/20 hover:bg-[#E64A00] transition-all flex items-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="marmacore-card p-6 border-l-4 border-l-[#FD5200]">
                    <p className="text-sm font-bold text-[#006D65] uppercase tracking-wider">Facturado</p>
                    <p className="text-4xl font-extrabold text-[#00272E] mt-2">
                        ${(selectedCompany === 'all' ? summary?.totalAmount : currentCompanyData?.totalCost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                
                <div className="marmacore-card p-6 border-l-4 border-l-[#006D65]">
                    <p className="text-sm font-bold text-[#006D65] uppercase tracking-wider">Tickets</p>
                    <p className="text-4xl font-extrabold text-[#00272E] mt-2">
                        {selectedCompany === 'all' ? summary?.totalTickets : currentCompanyData?.count}
                    </p>
                </div>

                <div className="marmacore-card p-6 border-l-4 border-l-[#00272E]">
                    <p className="text-sm font-bold text-[#006D65] uppercase tracking-wider">Incidencias Abiertas</p>
                    <p className="text-4xl font-extrabold text-[#00272E] mt-2">
                        {selectedCompany === 'all' 
                            ? Object.values(summary?.summaryByCompany || {}).reduce((acc: number, curr: any) => acc + curr.openCount, 0)
                            : currentCompanyData?.openCount}
                    </p>
                </div>
            </div>

            {selectedCompany === 'all' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Chart 1: Distribution */}
                    <div className="marmacore-card p-8 text-center sm:text-left">
                        <h3 className="text-lg font-bold text-[#00272E] mb-6">Distribución de Tickets</h3>
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
                            <h3 className="text-lg font-bold text-[#00272E]">Resumen por Empresa</h3>
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden xl:block overflow-x-auto w-full">
                            <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                                <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-8 py-4">Empresa</th>
                                        <th className="px-8 py-4 text-center">Tickets</th>
                                        <th className="px-8 py-4 text-right">Facturación</th>
                                        <th className="px-max"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {companiesInMonth.map((name) => (
                                        <tr key={name} className="hover:bg-[#D5EFF2]/20 transition-colors group">
                                            <td className="px-8 py-4 font-bold text-[#00272E]">
                                                <div className="flex items-center gap-3">
                                                    {summary.summaryByCompany[name].logoUrl ? (
                                                        <img 
                                                            src={summary.summaryByCompany[name].logoUrl.startsWith('http') ? summary.summaryByCompany[name].logoUrl : `${BASE_SERVER_URL}/${summary.summaryByCompany[name].logoUrl}`} 
                                                            className="w-6 h-6 object-contain rounded" 
                                                            alt="logo" 
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400 font-bold">{name.charAt(0)}</div>
                                                    )}
                                                    <span>{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center text-[#006D65] font-semibold">
                                                {summary.summaryByCompany[name].count}
                                            </td>
                                            <td className="px-8 py-4 text-right font-extrabold text-[#FD5200]">
                                                ${summary.summaryByCompany[name].totalCost.toLocaleString('es-MX')}
                                            </td>
                                            <td className="pr-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedCompany(name)}
                                                    className="text-[10px] font-bold text-dark-teal bg-accent-teal px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    DETALLES
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="xl:hidden divide-y divide-gray-100">
                            {companiesInMonth.map((name) => (
                                <div key={name} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {summary.summaryByCompany[name].logoUrl ? (
                                                <img 
                                                    src={summary.summaryByCompany[name].logoUrl.startsWith('http') ? summary.summaryByCompany[name].logoUrl : `${BASE_SERVER_URL}/${summary.summaryByCompany[name].logoUrl}`} 
                                                    className="w-8 h-8 object-contain rounded" 
                                                    alt="logo" 
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400 font-bold">{name.charAt(0)}</div>
                                            )}
                                            <span className="font-bold text-[#00272E] text-sm">{name}</span>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedCompany(name)}
                                            className="text-[10px] font-black text-dark-teal bg-accent-teal px-3 py-1.5 rounded-lg active:scale-95"
                                        >
                                            DETALLES
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tickets</p>
                                            <p className="text-sm font-bold text-[#006D65]">{summary.summaryByCompany[name].count}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Facturado</p>
                                            <p className="text-sm font-black text-[#FD5200]">${summary.summaryByCompany[name].totalCost.toLocaleString('es-MX')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="marmacore-card overflow-hidden animate-fade-in !p-0">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-lg font-bold text-[#00272E] flex items-center gap-3">
                                {currentCompanyData?.logoUrl && (
                                    <img 
                                        src={currentCompanyData.logoUrl.startsWith('http') ? currentCompanyData.logoUrl : `${BASE_SERVER_URL}/${currentCompanyData.logoUrl}`} 
                                        className="h-6 object-contain" 
                                        alt="logo" 
                                    />
                                )}
                                <span className="hidden sm:inline">Listado de Tickets:</span> {selectedCompany}
                            </h3>
                            <button 
                                onClick={() => setSelectedCompany('all')}
                                className="text-xs font-bold text-[#FD5200] hover:underline whitespace-nowrap"
                            >
                                VOLVER AL GENERAL
                            </button>
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden xl:block overflow-x-auto w-full">
                            <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                                <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-8 py-4">ID / Ticket #</th>
                                        <th className="px-8 py-4">Fecha</th>
                                        <th className="px-8 py-4">Descripción</th>
                                        <th className="px-8 py-4 text-center">Estado</th>
                                        <th className="px-8 py-4 text-right">Costo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentCompanyData?.tickets.map((ticket: any) => (
                                        <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-8 py-4 font-mono font-bold text-[#00272E] text-sm">{ticket.ticketNumber}</td>
                                            <td className="px-8 py-4 text-xs text-gray-500">
                                                {new Date(ticket.createdAt).toLocaleDateString('es-MX')}
                                            </td>
                                            <td className="px-8 py-4 text-sm text-gray-700 max-w-xs truncate" title={ticket.description}>
                                                {ticket.description}
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    ticket.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {ticket.status === 'open' ? 'Abierto' : 'Resuelto'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right font-bold text-dark-teal">
                                                ${ticket.cost.toLocaleString('es-MX')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="xl:hidden divide-y divide-gray-100">
                            {currentCompanyData?.tickets.map((ticket: any) => (
                                <div key={ticket._id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-mono font-bold text-[#00272E]">{ticket.ticketNumber}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(ticket.createdAt).toLocaleDateString('es-MX')}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                            ticket.status === 'open' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'
                                        }`}>
                                            {ticket.status === 'open' ? 'Abierto' : 'Resuelto'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 italic">"{ticket.description}"</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Costo Ticket</span>
                                        <span className="text-base font-black text-dark-teal">${ticket.cost.toLocaleString('es-MX')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
