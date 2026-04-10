import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Ticket } from '../../types';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PhotoIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const TicketsList: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filter, setFilter] = useState({ 
        companyId: searchParams.get('companyId') || '', 
        status: searchParams.get('status') || '',
        startDate: '', 
        endDate: '' 
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchTickets(); }, [filter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.companyId) params.append('companyId', filter.companyId);
            if (filter.status) params.append('status', filter.status);
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate) params.append('endDate', filter.endDate);
            
            const res = await api.get(`/tickets?${params.toString()}`);
            setTickets(res.data);
        } finally {
            setLoading(false);
        }
    };

    const markSolved = async (ticketId: string) => {
        const value = window.prompt('Tiempo invertido (en minutos):', '60');
        if (value === null) return;
        const minutesSpent = Number(value);
        if (!Number.isFinite(minutesSpent) || minutesSpent < 0) {
            alert('Minutos inválidos');
            return;
        }
        await api.patch(`/tickets/${ticketId}/solve`, { minutesSpent });
        fetchTickets();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#00272E]">Registro de Tickets</h1>
                    <p className="text-[#006D65] mt-1">Historial completo de reportes y asistencias técnicas.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar ticket..." 
                            className="pl-9 pr-4 py-2 border-none outline-none text-sm w-48"
                        />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="marmacore-card p-6 bg-white/50 backdrop-blur-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#006D65] uppercase pl-1">Desde</label>
                    <input 
                        type="date" 
                        value={filter.startDate} 
                        onChange={e => setFilter({ ...filter, startDate: e.target.value })} 
                        className="marmacore-input py-2 text-sm" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#006D65] uppercase pl-1">Hasta</label>
                    <input 
                        type="date" 
                        value={filter.endDate} 
                        onChange={e => setFilter({ ...filter, endDate: e.target.value })} 
                        className="marmacore-input py-2 text-sm" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#006D65] uppercase pl-1">Estado</label>
                    <select
                        value={filter.status}
                        onChange={e => setFilter({ ...filter, status: e.target.value })}
                        className="marmacore-input py-2 text-sm"
                    >
                        <option value="">Todos</option>
                        <option value="open">Abiertos (Sin atender)</option>
                        <option value="solved">Solucionados</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={() => setFilter({ companyId: '', status: '', startDate: '', endDate: '' })}
                        className="text-xs font-bold text-gray-400 hover:text-primary mb-3 ml-2"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="marmacore-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                        <tr>
                            <th className="px-8 py-5">Ticket</th>
                            <th className="px-8 py-5">Empresa</th>
                            <th className="px-8 py-5">Fecha</th>
                            <th className="px-8 py-5">Problema</th>
                            <th className="px-8 py-5">Estado</th>
                            <th className="px-8 py-5">Tiempo</th>
                            <th className="px-8 py-5 text-right">Costo</th>
                            <th className="px-8 py-5 text-right">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tickets.map(t => (
                            <tr key={t._id} className="hover:bg-[#D5EFF2]/20 transition-all group">
                                <td className="px-8 py-5">
                                    <div className="font-mono font-bold text-[#00272E] text-sm group-hover:text-primary">
                                        {t.ticketNumber}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                                        <span className="font-semibold text-gray-700">{(t.companyId as any).name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <CalendarDaysIcon className="w-4 h-4" />
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
                                        {(t.problemId as any).title}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    {t.status === 'solved' ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                                            Solucionado
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => markSolved(t._id)}
                                            className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase hover:bg-amber-200 transition-colors"
                                        >
                                            Marcar solucionado
                                        </button>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-xs text-gray-500">
                                    {typeof t.timeSpentMinutes === 'number' ? `${t.timeSpentMinutes} min` : '-'}
                                </td>
                                <td className="px-8 py-5 text-right font-extrabold text-[#00272E]">
                                    ${t.cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-3 text-gray-400">
                                        {t.imagePath && <PhotoIcon className="w-5 h-5 text-primary" />}
                                        <button className="p-2 hover:bg-white rounded-lg hover:text-[#00272E] transition-all">
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {loading && <tr><td colSpan={8} className="p-10 text-center text-gray-400 animate-pulse">Cargando registros...</td></tr>}
                        {!loading && tickets.length === 0 && <tr><td colSpan={8} className="p-20 text-center text-gray-400">No se encontraron tickets en este periodo.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TicketsList;