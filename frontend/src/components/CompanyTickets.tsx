import React, { useEffect, useState } from 'react';
import companyApi from '../services/companyApi';
import type { Ticket } from '../types';
import { TicketIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useOutletContext } from 'react-router-dom';
import type { CompanyOutletContext } from './CompanyLayout';

const CompanyTickets: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'month' | 'week' | 'day'>('all');
    const { lockedCompany } = useOutletContext<CompanyOutletContext>();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await companyApi.get('/tickets/company/my');
                setTickets(res.data);
            } catch {
                setError('No se pudieron cargar los tickets. Intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statusLabel = (t: Ticket) =>
        t.status === 'solved' ? { text: 'Solucionado', cls: 'bg-green-100 text-green-800' } : { text: 'En proceso', cls: 'bg-amber-100 text-amber-800' };

    const getFilteredTickets = () => {
        if (filterType === 'all') return tickets;
        const now = new Date();
        return tickets.filter(t => {
            const d = new Date(t.createdAt);
            if (filterType === 'day') return d.toDateString() === now.toDateString();
            if (filterType === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (filterType === 'week') {
                const diff = now.getTime() - d.getTime();
                return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
            }
            return true;
        });
    };

    const downloadReport = () => {
        const now = new Date();
        const isFirstFortnight = now.getDate() <= 15;
        const filtered = tickets.filter(t => {
            const d = new Date(t.createdAt);
            if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
            return isFirstFortnight ? d.getDate() <= 15 : d.getDate() > 15;
        });

        if (filtered.length === 0) {
            alert('No hay tickets en la quincena actual para exportar.');
            return;
        }

        // @ts-ignore
        if (!window.jspdf) {
            alert('Librería PDF no cargada. Intenta recargar la página.');
            return;
        }

        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título del documento
        doc.setFontSize(20);
        doc.setTextColor(0, 39, 46); // #00272E
        doc.text(`Reporte Quincenal de Tickets`, 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Empresa: ${lockedCompany.name}`, 14, 30);
        doc.text(`Período: ${isFirstFortnight ? '1ra Quincena' : '2da Quincena'} - ${now.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}`, 14, 36);

        // Preparar Datos
        const tableColumn = ["Ticket", "Fecha", "Problema", "Factura", "Estado", "Costo"];
        const tableRows: any[] = [];
        let totalCost = 0;

        filtered.forEach(t => {
            const prob = (t.problems?.[0]?.title ?? (t.problemId as any)?.title ?? '—');
            const cost = t.status === 'solved' ? t.cost : 0;
            const fac = t.requiresInvoice ? 'SI' : 'NO';
            const dateStr = new Date(t.createdAt).toLocaleDateString('es-MX');
            const statusStr = t.status === 'solved' ? 'Solucionado' : 'Abierto';
            
            totalCost += cost;
            tableRows.push([t.ticketNumber, dateStr, prob, fac, statusStr, `$${cost.toLocaleString('es-MX', {minimumFractionDigits: 2})}`]);
        });

        tableRows.push(['', '', '', '', 'TOTAL:', `$${totalCost.toLocaleString('es-MX', {minimumFractionDigits: 2})}`]);

        // @ts-ignore
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [0, 39, 46], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 251] },
            margin: { top: 40 },
        });

        doc.save(`Reporte_${lockedCompany.name}_${now.getFullYear()}_${now.getMonth()+1}_${isFirstFortnight?'Q1':'Q2'}.pdf`);
    };

    const toggleInvoice = async (id: string, current: boolean) => {
        try {
            await companyApi.patch(`/tickets/${id}/invoice`, { requiresInvoice: !current });
            setTickets(tickets.map(t => t._id === id ? { ...t, requiresInvoice: !current } : t));
        } catch {
            alert('Error al actualizar estado de factura');
        }
    };

    const displayTickets = getFilteredTickets();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#00272E]">Mis tickets</h1>
                    <p className="text-[#006D65] mt-1">Número de ticket, estado, costo y facturación.</p>
                </div>
                <button
                    onClick={downloadReport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#00272E] font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <DocumentArrowDownIcon className="w-5 h-5 text-[#FD5200]" />
                    Reporte Quincenal (Actual)
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'month', label: 'Este mes' },
                    { id: 'week', label: 'Últimos 7 días' },
                    { id: 'day', label: 'Hoy' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilterType(f.id as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            filterType === f.id 
                            ? 'bg-[#00272E] text-white' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">{error}</div>
            )}

            <div className="marmacore-card overflow-hidden bg-white">
                <table className="w-full text-left">
                    <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Ticket</th>
                            <th className="px-6 py-4">Problema</th>
                            <th className="px-6 py-4 text-center">Factura</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Costo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        )}
                        {!loading && displayTickets.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400">
                                    <TicketIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    No se encontraron tickets.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            displayTickets.map((t) => {
                                const st = statusLabel(t);
                                const probTitle = t.problems?.[0]?.title ?? (t.problemId as any)?.title ?? '—';
                                return (
                                    <tr key={t._id} className="hover:bg-[#D5EFF2]/15">
                                        <td className="px-6 py-4 font-mono font-bold text-[#00272E]">{t.ticketNumber}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{probTitle}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toggleInvoice(t._id, !!t.requiresInvoice)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                                    t.requiresInvoice 
                                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            >
                                                {t.requiresInvoice ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                                                {t.requiresInvoice ? 'Sí' : 'No'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${st.cls}`}>
                                                {st.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-extrabold text-[#00272E]">
                                            {t.status === 'solved'
                                                ? `$${Number(t.cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                                : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompanyTickets;
