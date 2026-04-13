import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Ticket, ProblemEntry } from '../../types';
import { BASE_SERVER_URL } from '../../config';
import {
    FunnelIcon, MagnifyingGlassIcon, EyeIcon, PhotoIcon,
    CalendarDaysIcon, BuildingOfficeIcon, CheckCircleIcon,
    XMarkIcon, ClockIcon, CurrencyDollarIcon, TicketIcon, TrashIcon
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
    const [comments, setComments] = useState('');
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
            await api.patch(`/tickets/${ticket._id}/solve`, { problemResolutions: payload, comments });
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
                        <div className="flex items-center gap-3">
                            <h2 className="font-black text-[#00272E] text-lg">Resolver Ticket</h2>
                            {ticket.requiresInvoice && (
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-lg text-[10px] font-bold uppercase">Requiere Factura</span>
                            )}
                        </div>
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
                                href={`${BASE_SERVER_URL}/${ticket.imagePath}`}
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

                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#00272E] mb-2 block opacity-50">
                            Comentarios Adicionales (Se enviarán al cliente)
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Anota observaciones o el diagnóstico final..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#FD5200]/40 focus:ring-2 focus:ring-[#FD5200]/10 transition-all resize-none"
                        />
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
                    <div className="flex items-center gap-3">
                        <h2 className="font-black text-[#00272E] text-lg">Detalle del Ticket</h2>
                        {ticket.requiresInvoice && (
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-lg text-[10px] font-bold uppercase">Requiere Factura</span>
                        )}
                    </div>
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
                    {ticket.imagePath && (
                        <a
                            href={`${BASE_SERVER_URL}/${ticket.imagePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#FD5200] hover:underline"
                        >
                            <PhotoIcon className="w-4 h-4" /> Ver imagen adjunta
                        </a>
                    )}
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

                {ticket.operatorComments && (
                    <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FD5200] mb-2 opacity-80">Comentarios del Agente</p>
                        <p className="text-sm text-[#00272E] italic">"{ticket.operatorComments}"</p>
                    </div>
                )}

                <div className="flex items-center justify-between px-4 py-3 bg-[#00272E] rounded-xl">
                    <span className="text-white font-bold text-sm">Total</span>
                    <span className="text-[#FD5200] font-black text-lg">${ticket.cost.toFixed(2)}</span>
                </div>
            </div>
        </div>
    </div>
);

// ─── Cutoff Modal ─────────────────────────────────────────────────────────────
const CutoffModal: React.FC<{
    tickets: Ticket[];
    selectedIds: string[];
    onClose: () => void;
    onConfirm: () => void;
}> = ({ tickets, selectedIds, onClose, onConfirm }) => {
    const selected = tickets.filter(t => selectedIds.includes(t._id));
    const byCompany = selected.reduce((acc, t) => {
        const cId = (t.companyId as any)._id;
        if (!acc[cId]) acc[cId] = { company: t.companyId, tickets: [], total: 0 };
        acc[cId].tickets.push(t);
        acc[cId].total += t.cost;
        return acc;
    }, {} as Record<string, any>);

    const [processing, setProcessing] = useState(false);

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            await api.patch('/tickets/bulk-invoice', { ticketIds: selectedIds });
            onConfirm();
        } catch (e) {
            alert('Error al facturar tickets');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-black text-[#00272E] text-lg">Corte de Tickets (Facturación)</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    {Object.values(byCompany).map((group: any) => (
                        <div key={group.company._id} className="bg-[#F8FAFB] border border-gray-100 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                <div>
                                    <h3 className="font-black text-[#00272E]">{group.company.name}</h3>
                                    <p className="text-xs text-[#006D65] font-bold tracking-wider uppercase">
                                        RFC: {group.company.rfc || <span className="text-red-500 opacity-80">NO REGISTRADO</span>}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total de la empresa</p>
                                    <p className="font-black text-[#FD5200] text-lg">
                                        ${group.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                            <ul className="space-y-1.5 overflow-y-auto max-h-40 pr-2">
                                {group.tickets.map((t: any) => (
                                    <li key={t._id} className="text-xs flex justify-between items-center bg-white p-2 rounded border border-gray-50">
                                        <span className="font-mono font-bold text-[#00272E]">{t.ticketNumber}</span>
                                        <span className="font-semibold text-gray-500">${t.cost.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button disabled={processing} onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD5200] text-white font-bold text-sm hover:bg-[#E64A00] transition-colors active:scale-95 disabled:opacity-60">
                        {processing ? 'Procesando...' : 'Realizar Corte (Marcar Facturados)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main TicketsList ─────────────────────────────────────────────────────────
const TicketsList: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [tickets, setTickets]     = useState<Ticket[]>([]);
    const [filter, setFilter]       = useState({
        companyId: searchParams.get('companyId') || '',
        status:    searchParams.get('status') || '',
        requiresInvoice: '',
        startDate: '',
        endDate: ''
    });
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(false);
    const [solving, setSolving]     = useState<Ticket | null>(null);
    const [detail, setDetail]       = useState<Ticket | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [showCutoffModal, setShowCutoffModal] = useState(false);

    useEffect(() => { fetchTickets(); }, [filter]);

    const fetchTickets = async () => {
        setSelectedTickets([]);
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.companyId) params.append('companyId', filter.companyId);
            if (filter.status)    params.append('status', filter.status);
            if (filter.requiresInvoice) params.append('requiresInvoice', filter.requiresInvoice);
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate)   params.append('endDate', filter.endDate);
            const res = await api.get(`/tickets?${params.toString()}`);
            setTickets(res.data);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, ticketNumber: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR permanentemente el ticket ${ticketNumber}?`)) return;
        try {
            await api.delete(`/tickets/${id}`);
            setTickets(prev => prev.filter(t => t._id !== id));
            setSelectedTickets(prev => prev.filter(tid => tid !== id));
        } catch {
            alert('Error al eliminar el ticket. Intenta de nuevo.');
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
            <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Registro de Tickets</h1>
                    <p className="text-[#006D65] mt-1 text-sm font-medium">Historial completo de reportes y asistencias técnicas.</p>
                </div>
                {selectedTickets.length > 0 && (
                    <button 
                        onClick={() => setShowCutoffModal(true)}
                        className="px-6 py-3 bg-[#FD5200] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FD5200]/20 hover:bg-[#E64A00] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                        <CurrencyDollarIcon className="w-5 h-5" />
                        Generar Corte de {selectedTickets.length} Tickets
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="marmacore-filter-container p-0 mb-6 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-[#F8FAFB]/50">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="w-4 h-4 text-[#FD5200]" />
                        <div>
                            <h3 className="text-sm font-bold text-[#00272E]">Panel de Filtros</h3>
                            <p className="text-[10px] text-[#006D65] font-semibold opacity-60 uppercase tracking-wider">Busca y segmenta reportes</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                        <MagnifyingGlassIcon className="marmacore-icon-left" />
                        <input
                            type="text"
                            placeholder="Buscar ticket o empresa..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="marmacore-input marmacore-input-icon py-2 text-xs w-full"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
                        <input
                            type="date"
                            value={filter.startDate}
                            onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                            className="marmacore-input py-2 text-xs w-full"
                        />
                        <input
                            type="date"
                            value={filter.endDate}
                            onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                            className="marmacore-input py-2 text-xs w-full"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="marmacore-select py-2 text-xs w-full"
                        >
                            <option value="">Todos (Estado)</option>
                            <option value="open">Abiertos</option>
                            <option value="solved">Resueltos</option>
                        </select>
                        <select
                            value={filter.requiresInvoice}
                            onChange={e => setFilter({ ...filter, requiresInvoice: e.target.value })}
                            className="marmacore-select py-2 text-xs w-full"
                        >
                            <option value="">Filtro Factura</option>
                            <option value="true">Requerida</option>
                            <option value="false">No Requerida</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                        <button
                            onClick={() => setFilter({ companyId: '', status: '', requiresInvoice: '', startDate: '', endDate: '' })}
                            className="px-3 py-2 rounded-lg text-[10px] font-bold text-gray-400 hover:text-[#FD5200] border border-gray-100 hover:border-[#FD5200]/30 transition-all flex items-center justify-center min-w-[80px]"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="marmacore-table-container">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="marmacore-table-head bg-gray-50/50">
                                <th className="px-4 py-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                        checked={filtered.length > 0 && selectedTickets.length === filtered.length}
                                        onChange={e => {
                                            if (e.target.checked) setSelectedTickets(filtered.map(t => t._id));
                                            else setSelectedTickets([]);
                                        }}
                                    />
                                </th>
                                <th className="px-4 py-3">Ticket</th>
                                <th className="px-4 py-3">Empresa</th>
                                <th className="px-4 py-3 hidden md:table-cell">Fecha</th>
                                <th className="px-4 py-3 hidden lg:table-cell">Problemas</th>
                                <th className="px-4 py-3 text-center hidden sm:table-cell">Factura</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Costo</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr><td colSpan={9} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-[3px] border-[#FD5200]/20 border-t-[#FD5200] rounded-full animate-spin" />
                                        <span className="text-xs text-gray-400 font-medium">Cargando registros...</span>
                                    </div>
                                </td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={9} className="py-16 text-center">
                                    <TicketIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 font-medium">No se encontraron tickets.</p>
                                </td></tr>
                            )}
                            {filtered.map(t => (
                                <tr key={t._id} className="group hover:bg-gray-50/80 transition-all border-b border-gray-50 last:border-0">
                                    <td className="px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                            checked={selectedTickets.includes(t._id)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedTickets([...selectedTickets, t._id]);
                                                else setSelectedTickets(selectedTickets.filter(id => id !== t._id));
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-black text-[#00272E] tracking-tight">{t.ticketNumber}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-0.5 shrink-0">
                                                <img 
                                                    src={(t.companyId as any).logoUrl.startsWith('http') ? (t.companyId as any).logoUrl : `${BASE_SERVER_URL}/${(t.companyId as any).logoUrl}`} 
                                                    alt="" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-[#00272E] truncate max-w-[80px] sm:max-w-none">{(t.companyId as any).name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        {(t.problems && t.problems.length > 0) ? (
                                            <div className="flex flex-wrap gap-1">
                                                {t.problems.slice(0, 2).map((p, idx) => (
                                                    <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[8px] font-black uppercase border border-gray-200">
                                                        {p.title}
                                                    </span>
                                                ))}
                                                {t.problems.length > 2 && (
                                                    <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded text-[8px] font-bold">
                                                        +{t.problems.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-[10px]">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                                        <span className={`marmacore-badge px-2 py-0.5 ${
                                            t.invoiced ? 'bg-[#00272E] text-white border-[#00272E]' :
                                            t.requiresInvoice ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 
                                            'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                            {t.invoiced ? 'FACTURADA' : t.requiresInvoice ? 'SI' : 'NO'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`marmacore-badge px-2 py-0.5 whitespace-nowrap ${
                                            t.status === 'solved' 
                                            ? 'bg-green-50 text-green-700 border-green-100' 
                                            : 'bg-orange-50 text-orange-700 border-orange-100'
                                        }`}>
                                            {t.status === 'solved' ? (
                                                <><CheckCircleIcon className="w-3 h-3 hidden xs:block" /> Resuelto</>
                                            ) : (
                                                <><ClockIcon className="w-3 h-3 hidden xs:block" /> Abierto</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-black text-[#00272E] tracking-tight">
                                            ${t.cost?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {t.status === 'open' && (
                                                <button
                                                    onClick={() => setSolving(t)}
                                                    className="px-2 py-1.5 bg-[#FD5200] text-white text-[9px] font-black uppercase rounded-lg shadow-sm hover:shadow-md hover:bg-[#E64A00] transition-all active:scale-95 flex items-center gap-1 shrink-0"
                                                >
                                                    <CheckCircleIcon className="w-3 h-3 hidden sm:block" /> Resolver
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDetail(t)}
                                                className="p-1.5 text-gray-400 hover:text-[#006D65] hover:bg-[#006D65]/5 rounded-lg transition-all shrink-0"
                                                title="Ver detalles"
                                            >
                                                <EyeIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t._id, t.ticketNumber)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 hidden sm:block"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
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
            {showCutoffModal && (
                <CutoffModal 
                    tickets={filtered} 
                    selectedIds={selectedTickets} 
                    onClose={() => setShowCutoffModal(false)}
                    onConfirm={() => {
                        setShowCutoffModal(false);
                        setSelectedTickets([]);
                        fetchTickets();
                    }}
                />
            )}
        </div>
    );
};

export default TicketsList;