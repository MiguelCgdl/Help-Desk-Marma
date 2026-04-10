import React, { useEffect, useState } from 'react';
import companyApi from '../services/companyApi';
import type { Ticket } from '../types';
import { TicketIcon } from '@heroicons/react/24/outline';

const CompanyTickets: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-extrabold text-[#00272E]">Mis tickets</h1>
                <p className="text-[#006D65] mt-1">Número de ticket, estado y costo una vez cerrado el incidente.</p>
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
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Costo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        )}
                        {!loading && tickets.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-400">
                                    <TicketIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    Aún no hay tickets registrados.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            tickets.map((t) => {
                                const st = statusLabel(t);
                                return (
                                    <tr key={t._id} className="hover:bg-[#D5EFF2]/15">
                                        <td className="px-6 py-4 font-mono font-bold text-[#00272E]">{t.ticketNumber}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{(t.problemId as any)?.title ?? '—'}</td>
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
