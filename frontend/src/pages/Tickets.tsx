// frontend/src/pages/Tickets.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import apiClient from '../api/client';

const statusBadgeClasses = {
    open: 'bg-marma-warning/20 text-marma-warning border-marma-warning/30',
    'in-progress': 'bg-marma-accent/20 text-marma-accent border-marma-accent/30',
    closed: 'bg-marma-success/20 text-marma-success border-marma-success/30',
};

const priorityBadgeClasses = {
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    medium: 'bg-marma-warning/20 text-marma-warning border-marma-warning/30',
    high: 'bg-marma-danger/20 text-marma-danger border-marma-danger/30',
};

export default function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        apiClient.get('/tickets').then(res => setTickets(res.data));
    }, []);

    const filteredTickets = tickets.filter((t: any) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-marma-accent bg-clip-text text-transparent">
                        Tickets
                    </h1>
                    <p className="text-marma-text-muted mt-1">Gestiona todos los tickets de soporte</p>
                </div>
                <Link
                    to="/tickets/new"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-marma-accent to-marma-accent-dark text-marma-bg font-medium rounded-lg shadow-glow hover:shadow-lg transition-all"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nuevo Ticket
                </Link>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-marma-text-muted" />
                <input
                    type="text"
                    placeholder="Buscar tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-marma-card/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text placeholder-marma-text-muted"
                />
            </div>

            {/* Tabla / Grid Responsive */}
            <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl overflow-hidden shadow-card">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-marma-border">
                        <thead className="bg-marma-bg/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase tracking-wider">Título</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase tracking-wider">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase tracking-wider">Costo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-marma-border">
                            {filteredTickets.map((ticket: any) => (
                                <tr key={ticket._id} className="hover:bg-white/5 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-marma-accent">
                                        #{ticket._id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-marma-text">
                                        <Link to={`/tickets/${ticket._id}`} className="hover:text-marma-accent">
                                            {ticket.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-marma-text-muted">
                                        {ticket.company?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${(statusBadgeClasses as any)[ticket.status]}`}>
                                            {ticket.status === 'open' && 'Abierto'}
                                            {ticket.status === 'in-progress' && 'En Progreso'}
                                            {ticket.status === 'closed' && 'Cerrado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${(priorityBadgeClasses as any)[ticket.priority]}`}>
                                            {ticket.priority === 'low' && 'Baja'}
                                            {ticket.priority === 'medium' && 'Media'}
                                            {ticket.priority === 'high' && 'Alta'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-marma-accent">
                                        ${ticket.cost.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-marma-border">
                    {filteredTickets.map((ticket: any) => (
                        <Link 
                            key={ticket._id} 
                            to={`/tickets/${ticket._id}`}
                            className="block p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-marma-accent">
                                    #{ticket._id.slice(-6).toUpperCase()}
                                </span>
                                <div className="flex gap-2">
                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${(priorityBadgeClasses as any)[ticket.priority]}`}>
                                        {ticket.priority === 'low' && 'Baja'}
                                        {ticket.priority === 'medium' && 'Media'}
                                        {ticket.priority === 'high' && 'Alta'}
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${(statusBadgeClasses as any)[ticket.status]}`}>
                                        {ticket.status === 'open' && 'Abierto'}
                                        {ticket.status === 'in-progress' && 'En Progreso'}
                                        {ticket.status === 'closed' && 'Cerrado'}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-marma-text mb-1">{ticket.title}</h3>
                            <div className="flex justify-between items-center text-xs text-marma-text-muted">
                                <span>{ticket.company?.name}</span>
                                <span className="font-semibold text-marma-accent">${ticket.cost.toFixed(2)}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}