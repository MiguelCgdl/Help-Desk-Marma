import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Ticket, ProblemEntry } from '../../types';
import {
    FunnelIcon, MagnifyingGlassIcon, EyeIcon, PhotoIcon,
    CalendarDaysIcon, BuildingOfficeIcon, CheckCircleIcon,
    XMarkIcon, ClockIcon, CurrencyDollarIcon, TicketIcon
} from '@heroicons/react/24/outline';

// ─── Solve Modal ─────────────────────────────────────────────────────────────
type SolveModalProps = {
    ticket: Ticket;
    onClose: () => void;
    onSolved: () => void;
};

type Resolution = {
    index: number;
    timeSpentMinutes: number;
    manualCost: boolean;
    cost: number;
};

const SolveModal: React.FC<SolveModalProps> = ({ ticket, onClose, onSolved }) => {
    const initResolutions = (): Resolution[] =>
        ticket.problems.map((_, i) => ({ index: i, timeSpentMinutes: 0, manualCost: false, cost: 0 }));

    const [resolutions, setResolutions] = useState<Resolution[]>(initResolutions);
    const [saving, setSaving] = useState(false);

    const update = (i: number, patch: Partial<Resolution>) =>
        setResolutions(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

    const computedCost = (problem: ProblemEntry, res: Resolution): number => {
        if (res.manualCost) return res.cost;
        return Math.round((problem.costPerHour / 60) * res.timeSpentMinutes * 100) / 100;
    };

    const totalCost = ticket.problems.reduce(
        (sum, p, i) => sum + computedCost(p, resolutions[i]),
        0
    );

    const handleSolve = async () => {
        setSaving(true);
        try {
            const payload = resolutions.map((r, i) => ({
                index: r.index,
                timeSpentMinutes: r.timeSpentMinutes,
                manualCost: r.manualCost,
                cost: r.manualCost ? r.cost : computedCost(ticket.problems[i], r)
            }));
            await api.patch(`/tickets/${ticket._id}/solve`, { problemResolutions: payload });
            onSolved();
        } catch {
            alert('Error al resolver el ticket.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="font-black text-[#00272E] text-lg">Resolver Ticket</h2>
                        <p className="text-xs text-[#006D65] font-mono font-bold mt-0.5">{ticket.ticketNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    {/* Description */}
                    <div className="bg-[#F8FAFB] rounded-xl p-4 border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#006D65] mb-2 opacity-60">
                            Descripción del Incidente
                        </p>
                        <p className="text-sm text-[#00272E]">{ticket.description}</p>
                        {ticket.imagePath && (
                            <a
                                href={`http://localhost:5001/${ticket.imagePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#FD5200] hover:underline"
                            >
                                <PhotoIcon className="w-4 h-4" /> Ver imagen adjunta
                            </a>
                        )}
                    </div>

                    {/* Problem breakdown */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00272E] mb-3 opacity-50">
                            Desglose de Problemas — Asigna tiempo y costo
                        </p>
                        <div className="space-y-3">
                            {ticket.problems.map((p, i) => {
                                const res = resolutions[i];
                                const isOtros = !p.problemId && p.title.toLowerCase().includes('otros');
                                return (
                                    <div key={i} className={`rounded-xl border p-4 space-y-3 ${isOtros ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100 bg-[#F8FAFB]'}`}>
                                        {/* Problem title */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-bold bg-[#00272E] text-white px-2 py-0.5 rounded mr-2">
                                                    #{i + 1}
                                                </span>
                                                <span className="text-sm font-bold text-[#00272E]">{p.title}</span>
                                                {!isOtros && (
                                                    <span className="text-xs text-[#006D65] ml-2 opacity-60">
                                                        ${p.costPerHour}/hr
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right text-sm font-black text-[#FD5200]">
                                                ${computedCost(p, res).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Time */}
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" /> Tiempo (min)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={res.timeSpentMinutes}
                                                    onChange={e => update(i, { timeSpentMinutes: Math.max(0, Number(e.target.value)) })}
                                                    disabled={res.manualCost}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[#00272E] text-sm font-medium outline-none focus:border-[#FD5200]/40 focus:ring-2 focus:ring-[#FD5200]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                />
                                            </div>

                                            {/* Manual cost toggle + field */}
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block flex items-center gap-1">
                                                    <CurrencyDollarIcon className="w-3 h-3" />
                                                    {res.manualCost ? 'Costo manual' : 'Costo calculado'}
                                                </label>
                                                {res.manualCost ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        value={res.cost}
                                                        onChange={e => update(i, { cost: Number(e.target.value) })}
                                                        className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-[#00272E] text-sm font-bold outline-none focus:border-[#FD5200]/40 focus:ring-2 focus:ring-[#FD5200]/10 transition-all"
                                                    />
                                                ) : (
                                                    <div className="px-3 py-2 rounded-lg bg-gray-100 text-[#00272E] text-sm font-bold">
                                                        ${computedCost(p, res).toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Manual toggle */}
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={res.manualCost}
                                                onChange={e => update(i, { manualCost: e.target.checked, cost: 0 })}
                                                className="w-3.5 h-3.5 rounded accent-[#FD5200]"
                                            />
                                            <span className="text-[11px] text-gray-500 font-medium">
                                                {isOtros ? 'Asignar costo manual (Otros)' : 'Sobrescribir con costo manual'}
                                            </span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Costo total calculado</p>
                        <p className="text-2xl font-black text-[#00272E]">
                            <span className="text-sm text-[#FD5200] mr-1">$</span>
                            {totalCost.toFixed(2)}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSolve}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD5200] text-white font-bold text-sm hover:bg-[#E64A00] transition-colors active:scale-95 disabled:opacity-60"
                        >
                            {saving
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <CheckCircleIcon className="w-4 h-4" />
                            }
                            Marcar como Resuelto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Detail Modal (read-only for solved tickets) ──────────────────────────────
const DetailModal: React.FC<{ ticket: Ticket; onClose: () => void }> = ({ ticket, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                    <h2 className="font-black text-[#00272E] text-lg">Detalle del Ticket</h2>
                    <p className="text-xs text-[#006D65] font-mono font-bold mt-0.5">{ticket.ticketNumber}</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                <div className="bg-[#F8FAFB] rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#006D65] mb-2 opacity-60">Descripción</p>
                    <p className="text-sm text-[#00272E]">{ticket.description}</p>
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#00272E] mb-3 opacity-50">
                        Desglose de Problemas
                    </p>
                    <div className="space-y-2">
                        {ticket.problems.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-[#F8FAFB] rounded-xl px-4 py-3 border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-[#00272E] text-white px-2 py-0.5 rounded font-bold">#{i+1}</span>
                                    <span className="text-sm font-semibold text-[#00272E]">{p.title}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-[#FD5200]">${p.cost.toFixed(2)}</div>
                                    {p.timeSpentMinutes > 0 && (
                                        <div className="text-[10px] text-gray-400">{p.timeSpentMinutes} min</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-[#00272E] rounded-xl">
                    <span className="text-white font-bold text-sm">Total</span>
                    <span className="text-[#FD5200] font-black text-lg">${ticket.cost.toFixed(2)}</span>
                </div>
            </div>
        </div>
    </div>
);

// ─── Main TicketsList ─────────────────────────────────────────────────────────
const TicketsList: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [tickets, setTickets]     = useState<Ticket[]>([]);
    const [filter, setFilter]       = useState({
        companyId: searchParams.get('companyId') || '',
        status:    searchParams.get('status') || '',
        startDate: '',
        endDate: ''
    });
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(false);
    const [solving, setSolving]     = useState<Ticket | null>(null);
    const [detail, setDetail]       = useState<Ticket | null>(null);

    useEffect(() => { fetchTickets(); }, [filter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.companyId) params.append('companyId', filter.companyId);
            if (filter.status)    params.append('status', filter.status);
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate)   params.append('endDate', filter.endDate);
            const res = await api.get(`/tickets?${params.toString()}`);
            setTickets(res.data);
        } finally {
            setLoading(false);
        }
    };

    const filtered = tickets.filter(t =>
        !search ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        (t.companyId as any)?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Registro de Tickets</h1>
                <p className="text-[#006D65] mt-1 text-sm font-medium">Historial completo de reportes y asistencias técnicas.</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <FunnelIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-[#00272E] uppercase tracking-widest opacity-50">Filtros</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative lg:col-span-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar ticket o empresa..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#00272E] outline-none focus:border-[#FD5200]/40 focus:bg-white focus:ring-2 focus:ring-[#FD5200]/10 transition-all"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={filter.startDate}
                            onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#00272E] outline-none focus:border-[#FD5200]/40 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={filter.endDate}
                            onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#00272E] outline-none focus:border-[#FD5200]/40 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#00272E] outline-none focus:border-[#FD5200]/40 focus:bg-white transition-all"
                        >
                            <option value="">Todos</option>
                            <option value="open">Abiertos</option>
                            <option value="solved">Resueltos</option>
                        </select>
                        <button
                            onClick={() => setFilter({ companyId: '', status: '', startDate: '', endDate: '' })}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-[#FD5200] border border-gray-200 hover:border-[#FD5200]/30 transition-all"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F8FAFB] text-[10px] font-black text-[#00272E] uppercase tracking-[0.2em] opacity-50">
                                <th className="px-6 py-3">Ticket</th>
                                <th className="px-6 py-3">Empresa</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Problemas</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Costo</th>
                                <th className="px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr><td colSpan={7} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-[3px] border-[#FD5200]/20 border-t-[#FD5200] rounded-full animate-spin" />
                                        <span className="text-xs text-gray-400 font-medium">Cargando registros...</span>
                                    </div>
                                </td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="py-16 text-center">
                                    <TicketIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 font-medium">No se encontraron tickets.</p>
                                </td></tr>
                            )}
                            {filtered.map(t => (
                                <tr key={t._id} className="group hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-[#00272E] text-sm group-hover:text-[#FD5200] transition-colors">
                                            {t.ticketNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <BuildingOfficeIcon className="w-4 h-4 text-gray-300" />
                                            <span className="text-sm font-semibold text-[#00272E]">
                                                {(t.companyId as any)?.name ?? '—'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                                            {new Date(t.createdAt).toLocaleDateString('es-MX')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(t.problems && t.problems.length > 0
                                                ? t.problems
                                                : [{ title: (t as any).problemId?.title ?? '—', cost: 0, costPerHour: 0, timeSpentMinutes: 0 }]
                                            ).map((p, i) => (
                                                <span key={i} className="inline-block text-[10px] bg-gray-100 text-[#00272E] px-2 py-0.5 rounded font-medium max-w-[120px] truncate">
                                                    {p.title}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.status === 'solved' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold uppercase">
                                                <CheckCircleIcon className="w-3 h-3" /> Resuelto
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase">
                                                Abierto
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-black text-[#00272E] text-sm">
                                            ${t.cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {t.imagePath && <PhotoIcon className="w-4 h-4 text-[#FD5200]" />}
                                            {t.status === 'open' ? (
                                                <button
                                                    onClick={() => setSolving(t)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#FD5200] text-white rounded-lg hover:bg-[#E64A00] transition-colors active:scale-95"
                                                >
                                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Resolver
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setDetail(t)}
                                                    className="p-1.5 text-gray-400 hover:text-[#00272E] hover:bg-gray-100 rounded-lg transition-all"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {solving && (
                <SolveModal
                    ticket={solving}
                    onClose={() => setSolving(null)}
                    onSolved={() => { setSolving(null); fetchTickets(); }}
                />
            )}
            {detail && (
                <DetailModal ticket={detail} onClose={() => setDetail(null)} />
            )}
        </div>
    );
};

export default TicketsList;