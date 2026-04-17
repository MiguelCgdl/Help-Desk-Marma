import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Ticket, ProblemEntry } from '../../types';
import { BASE_SERVER_URL } from '../../config';
import TicketForm from '../TicketForm';
import {
    FunnelIcon, MagnifyingGlassIcon, EyeIcon, PhotoIcon,
    CheckCircleIcon, XMarkIcon, ClockIcon, CurrencyDollarIcon, TicketIcon, TrashIcon,
    PlusIcon, ArrowDownTrayIcon, PencilIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { exportToCSV } from '../../utils/exportUtils';

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
        
        // Use company-specific rate if available, otherwise fallback to global problem rate
        const company = ticket.companyId as any;
        const problemId = (problem.problemId as any)?._id || problem.problemId;
        const customRate = company?.problemCosts?.[problemId];
        
        const rate = (typeof customRate === 'number') ? customRate : problem.costPerHour;
        return Math.round(rate * 100) / 100;
    };

    const totalCost = (ticket.companyId as any)?.useCustomCost 
        ? (ticket.companyId as any).customCostPerTicket
        : ticket.problems.reduce(
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
                    {/* Fixed Cost Alert */}
                    {(ticket.companyId as any)?.useCustomCost && (
                        <div className="bg-[#00272E] text-white p-4 rounded-xl border border-[#FD5200]/30 flex items-center gap-3">
                            <CurrencyDollarIcon className="w-6 h-6 text-[#FD5200]" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-[#FD5200]">Tarifa Plana Activa</p>
                                <p className="text-sm font-medium">Esta empresa tiene un costo fijo de <span className="font-black text-white">${(ticket.companyId as any).customCostPerTicket}</span> por ticket.</p>
                            </div>
                        </div>
                    )}

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
                                                <div className="flex flex-col">
                                                    {(p.problemId as any)?.mainCategory && (
                                                        <span className="text-[8px] font-black uppercase text-[#006D65] opacity-60">
                                                            {(p.problemId as any).mainCategory} &gt; {(p.problemId as any).subcategory}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-bold text-[#00272E]">{p.title}</span>
                                                </div>
                                                {!isOtros && (
                                                    <span className="text-xs text-[#006D65] ml-2 opacity-60">
                                                        Precio Gral: ${((ticket.companyId as any)?.problemCosts?.[(p.problemId as any)?._id || p.problemId] ?? p.costPerHour)}
                                                        {(ticket.companyId as any)?.problemCosts?.[(p.problemId as any)?._id || p.problemId] !== undefined && (
                                                            <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-black uppercase">Especial</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right text-sm font-black text-[#FD5200]">
                                                ${computedCost(p, res).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    <div className="flex flex-col">
                                        {(p.problemId as any)?.mainCategory && (
                                            <span className="text-[8px] font-black uppercase text-[#006D65] opacity-60">
                                                {(p.problemId as any).mainCategory} &gt; {(p.problemId as any).subcategory}
                                            </span>
                                        )}
                                        <span className="text-sm font-semibold text-[#00272E]">{p.title}</span>
                                    </div>
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

                <div className="space-y-2 bg-[#00272E] rounded-xl p-4 shadow-inner">
                    <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Subtotal</span>
                        <span className="text-white font-bold text-sm">${(ticket.cost || 0).toFixed(2)}</span>
                    </div>
                    {ticket.taxAmount > 0 && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-2">
                            <span className="text-white/60 text-xs font-bold uppercase tracking-wider">IVA (16%)</span>
                            <span className="text-white font-bold text-sm">${(ticket.taxAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-white/20 pt-2">
                        <span className="text-white font-black text-sm uppercase tracking-widest">Total</span>
                        <span className="text-[#FD5200] font-black text-xl tracking-tight">${(ticket.totalCost || ticket.cost || 0).toFixed(2)}</span>
                    </div>
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
        if (!acc[cId]) acc[cId] = { company: t.companyId, tickets: [], subtotal: 0, tax: 0, total: 0 };
        acc[cId].tickets.push(t);
        acc[cId].subtotal += (t.cost || 0);
        acc[cId].tax += (t.taxAmount || 0);
        acc[cId].total += (t.totalCost || t.cost || 0);
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
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Resumen de Corte</p>
                                    <div className="flex flex-col items-end gap-0.5 mt-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-gray-400 font-medium">Subtotal:</span>
                                            <span className="text-[#00272E] font-bold">${group.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {group.tax > 0 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-gray-400 font-medium">IVA (16%):</span>
                                                <span className="text-[#006D65] font-bold">${group.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-lg pt-1 mt-1 border-t border-gray-200 w-full justify-end">
                                            <span className="text-gray-400 text-xs font-black uppercase">Total:</span>
                                            <span className="font-black text-[#FD5200]">
                                                ${group.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ul className="space-y-1.5 overflow-y-auto max-h-40 pr-2">
                                {group.tickets.map((t: any) => (
                                    <li key={t._id} className="text-xs flex justify-between items-center bg-white p-2 rounded border border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-[#00272E]">{t.ticketNumber}</span>
                                            {t.taxAmount > 0 && (
                                                <span className="text-[8px] font-black bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded border border-cyan-100 uppercase">Factura</span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-gray-500">${(t.totalCost || t.cost || 0).toFixed(2)}</span>
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
    const [filter, setFilter]       = useState<any>({
        companyId: searchParams.get('companyId') || '',
        status:    searchParams.get('status') || '',
        requiresInvoice: '',
        startDate: '',
        endDate: '',
        showArchived: false
    });
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(false);
    const [solving, setSolving]     = useState<Ticket | null>(null);
    const [detail, setDetail]       = useState<Ticket | null>(null);
    const [editing, setEditing]     = useState<Ticket | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [showCutoffModal, setShowCutoffModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => { 
        fetchTickets(); 
    }, [filter]);

    // Body scroll lock when modal is open
    useEffect(() => {
        if (showCreateModal || solving || detail || showCutoffModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showCreateModal, solving, detail, showCutoffModal]);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies');
            setCompanies(res.data);
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

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
            if (filter.showArchived) params.append('showArchived', 'true');
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

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar ${selectedTickets.length} tickets? Esta acción es irreversible.`)) return;
        try {
            await api.delete('/tickets/bulk-delete', { data: { ticketIds: selectedTickets } });
            fetchTickets();
        } catch (err) {
            console.error('Error in bulk delete:', err);
        }
    };

    const handleBulkArchive = async (archive: boolean) => {
        try {
            await api.patch('/tickets/bulk-archive', { ticketIds: selectedTickets, archived: archive });
            fetchTickets();
        } catch (err) {
            console.error('Error in bulk archive:', err);
        }
    };

    const filtered = tickets.filter(t =>
        !search ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        (t.companyId as any)?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => {
        const headers = [
            { key: 'ticketNumber', label: 'Ticket #' },
            { key: 'companyId.name', label: 'Empresa' },
            { key: 'createdAt', label: 'Fecha Creación' },
            { key: 'description', label: 'Descripción' },
            { key: 'status', label: 'Estado' },
            { key: 'cost', label: 'Costo' },
            { key: 'taxAmount', label: 'IVA' },
            { key: 'totalCost', label: 'Total' },
            { key: 'requiresInvoice', label: 'Factura Requerida' },
            { key: 'invoiced', label: 'Facturado' }
        ];

        const exportData = filtered.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt).toLocaleString(),
            status: t.status === 'solved' ? 'Resuelto' : 'Abierto',
            requiresInvoice: t.requiresInvoice ? 'Sí' : 'No',
            invoiced: t.invoiced ? 'Sí' : 'No'
        }));

        exportToCSV('Reporte_Tickets', exportData, headers);
    };

    return (
        <div className="animate-fade-in pb-8">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Registro de Tickets</h1>
                    <p className="text-[#006D65] mt-1 text-sm font-medium">Historial completo de reportes y asistencias técnicas.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="px-6 py-3 bg-white border border-gray-200 text-[#00272E] rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5 text-[#FD5200]" />
                        Descargar Reporte
                    </button>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-[#006D65] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#006D65]/20 hover:bg-[#004D47] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nuevo Ticket
                    </button>
                    {selectedTickets.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button 
                                onClick={() => handleBulkArchive(!filter.showArchived)}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-[#00272E] rounded-xl font-bold text-xs hover:bg-gray-200 transition-all border border-gray-200"
                            >
                                <ArchiveBoxIcon className="w-4 h-4" />
                                {filter.showArchived ? 'Desarchivar' : 'Archivar'} ({selectedTickets.length})
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all border border-red-100"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Eliminar ({selectedTickets.length})
                            </button>
                            <button 
                                onClick={() => setShowCutoffModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#00272E] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00272E]/10 hover:bg-[#003B46] transition-all"
                            >
                                Generar Corte de Facturación
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="marmacore-filter-container p-0 mb-6 overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-gray-50 bg-[#F8FAFB]/50 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FD5200]/10 rounded-lg">
                            <FunnelIcon className="w-5 h-5 text-[#FD5200]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#00272E]">Panel de Filtros</h3>
                            <p className="text-[10px] text-[#006D65] font-semibold opacity-60 uppercase tracking-wider">Busca y segmenta reportes</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setFilter({ companyId: '', status: '', requiresInvoice: '', startDate: '', endDate: '', showArchived: false })}
                        className="text-xs font-bold text-gray-400 hover:text-[#FD5200] transition-colors"
                    >
                        Limpiar Filtros
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block ml-1">Búsqueda</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="marmacore-icon-left" />
                            <input
                                type="text"
                                placeholder="Ticket o empresa..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="marmacore-input marmacore-input-icon py-2.5 text-xs w-full bg-gray-50/50"
                            />
                        </div>
                    </div>
                    {/* Empresa Dropdown */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block ml-1">Empresa</label>
                        <select
                            value={filter.companyId}
                            onChange={e => setFilter({ ...filter, companyId: e.target.value })}
                            className="marmacore-select py-2.5 text-xs w-full bg-gray-50/50"
                        >
                            <option value="">Todas las empresas</option>
                            {companies.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block ml-1">Desde</label>
                        <input
                            type="date"
                            value={filter.startDate}
                            onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                            className="marmacore-input py-2.5 text-xs w-full bg-gray-50/50"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block ml-1">Hasta</label>
                        <input
                            type="date"
                            value={filter.endDate}
                            onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                            className="marmacore-input py-2.5 text-xs w-full bg-gray-50/50"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block ml-1">Estado</label>
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="marmacore-select py-2.5 text-xs w-full bg-gray-50/50"
                        >
                            <option value="">Todos los estados</option>
                            <option value="open">Abiertos</option>
                            <option value="solved">Resueltos</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block ml-1">Factura</label>
                        <select
                            value={filter.requiresInvoice}
                            onChange={e => setFilter({ ...filter, requiresInvoice: e.target.value })}
                            className="marmacore-select py-2.5 text-xs w-full bg-gray-50/50"
                        >
                            <option value="">Todos</option>
                            <option value="true">Requerida</option>
                            <option value="false">No Requerida</option>
                        </select>
                    </div>
                    <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                            <input 
                                type="checkbox" 
                                checked={filter.showArchived}
                                onChange={e => setFilter({ ...filter, showArchived: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                            />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ver Archivados</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Table / Cards Container */}
            <div className="marmacore-table-container bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Desktop view */}
                <div className="hidden xl:block overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <table className="w-full text-left min-w-[1000px] border-collapse">
                        <thead>
                            <tr className="bg-[#F8FAFB]/50 border-b border-gray-100">
                                <th className="pl-6 pr-4 py-4 w-12">
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200] cursor-pointer"
                                            checked={filtered.length > 0 && selectedTickets.length === filtered.length}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedTickets(filtered.map(t => t._id));
                                                else setSelectedTickets([]);
                                            }}
                                        />
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Ticket</th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Empresa</th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Problemas</th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Factura</th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Costo</th>
                                <th className="pl-4 pr-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr><td colSpan={9} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-[3px] border-[#FD5200]/20 border-t-[#FD5200] rounded-full animate-spin" />
                                        <span className="text-sm text-gray-400 font-bold tracking-wide">Cargando registros...</span>
                                    </div>
                                </td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={9} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                        <TicketIcon className="w-12 h-12 text-[#00272E]" />
                                        <p className="text-sm text-[#00272E] font-black uppercase tracking-widest">No se encontraron tickets</p>
                                    </div>
                                </td></tr>
                            )}
                            {filtered.map(t => (
                                <tr key={t._id} className="group hover:bg-gray-50/50 transition-all duration-200">
                                    <td className="pl-6 pr-4 py-4">
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200] cursor-pointer"
                                                checked={selectedTickets.includes(t._id)}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedTickets([...selectedTickets, t._id]);
                                                    else setSelectedTickets(selectedTickets.filter(id => id !== t._id));
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-xs font-black text-[#00272E] tracking-tight whitespace-nowrap bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200/50">{t.ticketNumber}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 shadow-sm shrink-0">
                                                <img 
                                                    src={(t.companyId as any).logoUrl.startsWith('http') ? (t.companyId as any).logoUrl : `${BASE_SERVER_URL}/${(t.companyId as any).logoUrl}`} 
                                                    alt="" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-[#00272E] truncate max-w-[150px]">{(t.companyId as any).name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <ClockIcon className="w-4 h-4 opacity-40" />
                                            <span className="text-xs font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {(t.problems && t.problems.length > 0) ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {t.problems.slice(0, 1).map((p, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-[#006D65]/5 text-[#006D65] rounded-md text-[9px] font-black uppercase border border-[#006D65]/10">
                                                        {p.title}
                                                    </span>
                                                ))}
                                                {t.problems.length > 1 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-md text-[9px] font-black border border-gray-200">
                                                        +{t.problems.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] font-bold tracking-widest ml-2">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                                            t.invoiced ? 'bg-[#00272E] text-white border-[#00272E]' :
                                            t.requiresInvoice ? 'bg-cyan-50 text-cyan-600 border-cyan-100' : 
                                            'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                            {t.invoiced ? 'FACTURADA' : t.requiresInvoice ? 'SÍ' : 'NO'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border w-fit whitespace-nowrap ${
                                            t.status === 'solved' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-orange-50 text-orange-700 border-orange-100'
                                        }`}>
                                            {t.status === 'solved' ? (
                                                <><CheckCircleIcon className="w-3.5 h-3.5" /> RESUELTO</>
                                            ) : (
                                                <><ClockIcon className="w-3.5 h-3.5" /> ABIERTO</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-[#00272E] tracking-tight">
                                                ${(t.totalCost || t.cost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                            {t.taxAmount > 0 && (
                                                <span className="text-[9px] font-bold text-[#006D65] uppercase">
                                                    Inc. IVA
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="pl-4 pr-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {t.status === 'open' && (
                                                <button
                                                    onClick={() => setSolving(t)}
                                                    className="px-3 py-2 bg-[#FD5200] text-white text-[10px] font-black uppercase rounded-xl shadow-sm hover:shadow-lg hover:bg-[#E64A00] transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4 hidden sm:block" /> Resolver
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDetail(t)}
                                                className="p-2 text-gray-400 hover:text-[#00272E] hover:bg-gray-100 rounded-xl transition-all shrink-0"
                                                title="Ver detalles"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t._id, t.ticketNumber)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view (Cards) */}
                <div className="xl:hidden divide-y divide-gray-100">
                    {loading && (
                        <div className="py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-[3px] border-[#FD5200]/20 border-t-[#FD5200] rounded-full animate-spin" />
                                <span className="text-sm text-gray-400 font-bold tracking-wide">Cargando registros...</span>
                            </div>
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3 opacity-30">
                                <TicketIcon className="w-12 h-12 text-[#00272E]" />
                                <p className="text-sm text-[#00272E] font-black uppercase tracking-widest">No se encontraron tickets</p>
                            </div>
                        </div>
                    )}
                    {filtered.map(t => (
                        <div key={t._id} className="p-4 space-y-4 hover:bg-gray-50/50 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                        checked={selectedTickets.includes(t._id)}
                                        onChange={e => {
                                            if (e.target.checked) setSelectedTickets([...selectedTickets, t._id]);
                                            else setSelectedTickets(selectedTickets.filter(id => id !== t._id));
                                        }}
                                    />
                                    <div>
                                        <div className="text-sm font-black text-[#00272E] tracking-tight mb-1">
                                            {t.ticketNumber}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            <ClockIcon className="w-3 h-3" />
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border ${
                                    t.status === 'solved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                    {t.status === 'solved' ? 'RESUELTO' : 'ABIERTO'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-[#F8FAFB] p-3 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                                    <img 
                                        src={(t.companyId as any).logoUrl.startsWith('http') ? (t.companyId as any).logoUrl : `${BASE_SERVER_URL}/${(t.companyId as any).logoUrl}`} 
                                        alt="" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-[#00272E] truncate">{(t.companyId as any).name}</p>
                                    <p className="text-[10px] text-[#006D65] font-bold uppercase opacity-60">Empresa Cliente</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {t.problems.map((p, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-[#006D65]/5 text-[#006D65] rounded-md text-[9px] font-black uppercase border border-[#006D65]/10">
                                        {p.title}
                                    </span>
                                ))}
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                                    t.invoiced ? 'bg-[#00272E] text-white border-[#00272E]' :
                                    t.requiresInvoice ? 'bg-cyan-50 text-cyan-600 border-cyan-100' : 
                                    'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                    {t.invoiced ? 'FACTURADA' : t.requiresInvoice ? 'REQUIERE FACTURA' : 'SIN FACTURA'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="text-left font-black text-[#00272E]">
                                    <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">Total Ticket</div>
                                    <span className="text-lg">${(t.totalCost || t.cost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                    {t.taxAmount > 0 && <span className="ml-1 text-[8px] text-[#006D65] uppercase">IVA</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditing(t)}
                                        className="p-2.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                        title="Editar detalles"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t._id, t.ticketNumber)}
                                        className="p-2.5 text-red-400 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setDetail(t)}
                                        className="p-2.5 text-[#00272E] bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                    {t.status === 'open' && (
                                        <button
                                            onClick={() => setSolving(t)}
                                            className="px-4 py-2.5 bg-[#FD5200] text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-[#FD5200]/20 active:scale-95"
                                        >
                                            Resolver
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals via Portal */}
            {createPortal(
                <>
                    {solving && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-[#00272E]/60 backdrop-blur-sm" onClick={() => setSolving(null)} />
                            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                                <SolveModal
                                    ticket={solving}
                                    onClose={() => setSolving(null)}
                                    onSolved={() => { setSolving(null); fetchTickets(); }}
                                />
                            </div>
                        </div>
                    )}
                    {detail && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-[#00272E]/60 backdrop-blur-sm" onClick={() => setDetail(null)} />
                            <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                                <DetailModal ticket={detail} onClose={() => setDetail(null)} />
                            </div>
                        </div>
                    )}
                    {showCutoffModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-[#00272E]/60 backdrop-blur-sm" onClick={() => setShowCutoffModal(false)} />
                            <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide">
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
                            </div>
                        </div>
                    )}
                    {showCreateModal && (
                        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto bg-[#00272E]/70 backdrop-blur-md py-10">
                            <div className="absolute inset-0 bg-[#00272E]/70 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
                            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] w-full max-w-6xl relative z-10 overflow-hidden animate-slide-up my-auto">
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="absolute top-6 right-8 p-3 text-gray-400 hover:text-[#00272E] hover:bg-gray-100 rounded-full transition-all z-[110] bg-white/50 backdrop-blur-sm"
                                    title="Cerrar"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                                <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
                                    <TicketForm 
                                        isModal={true}
                                        onTicketCreated={() => {
                                            setTimeout(() => {
                                                setShowCreateModal(false);
                                                fetchTickets();
                                            }, 2000);
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {editing && (
                        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto bg-[#00272E]/70 backdrop-blur-md py-10">
                            <div className="absolute inset-0 bg-[#00272E]/70 backdrop-blur-md" onClick={() => setEditing(null)} />
                            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] w-full max-w-6xl relative z-10 overflow-hidden animate-slide-up my-auto">
                                <button 
                                    onClick={() => setEditing(null)}
                                    className="absolute top-6 right-8 p-3 text-gray-400 hover:text-[#00272E] hover:bg-gray-100 rounded-full transition-all z-[110] bg-white/50 backdrop-blur-sm"
                                    title="Cerrar"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                                <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
                                    <TicketForm 
                                        isModal={true}
                                        editingTicket={editing}
                                        onTicketCreated={() => {
                                            setTimeout(() => {
                                                setEditing(null);
                                                fetchTickets();
                                            }, 2000);
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </div>
    );
};

export default TicketsList;