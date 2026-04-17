import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Company, Ticket } from '../../types';
import {
    CalculatorIcon,
    Cog6ToothIcon,
    DocumentDuplicateIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    BuildingOfficeIcon,
    TableCellsIcon
} from '@heroicons/react/24/outline';
import { exportToCSV } from '../../utils/exportUtils';

interface BillingConfig {
    razonSocial: string;
    rfc: string;
    regimenFiscal: string;
    codigoPostal: string;
    pacUsername?: string;
    pacPassword?: string;
    isTestMode: boolean;
}

interface Invoice {
    _id: string;
    company: { name: string; rfc: string };
    invoiceNumber: string;
    uuid?: string;
    status: 'draft' | 'sent' | 'canceled';
    total: number;
    createdAt: string;
    pdfUrl?: string;
}

const Billing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'cut' | 'history' | 'config'>('cut');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [pendingTickets, setPendingTickets] = useState<Ticket[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [config, setConfig] = useState<BillingConfig | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCompanies();
        fetchConfig();
        fetchInvoices();
    }, []);

    const fetchCompanies = async () => {
        const res = await api.get('/companies');
        setCompanies(res.data);
    };

    const fetchConfig = async () => {
        const res = await api.get('/billing/config');
        setConfig(res.data);
    };

    const fetchInvoices = async () => {
        const res = await api.get('/billing/history');
        setInvoices(res.data);
    };

    const loadPendingTickets = async (companyId: string) => {
        setSelectedCompanyId(companyId);
        if (!companyId) {
            setPendingTickets([]);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/billing/pending/${companyId}`);
            setPendingTickets(res.data);
            setSelectedTickets(res.data.map((t: any) => t._id)); // Seleccionar todos por defecto
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCut = async () => {
        if (!selectedCompanyId || selectedTickets.length === 0) return;
        if (!window.confirm(`¿Generar corte para ${selectedTickets.length} tickets?`)) return;

        try {
            await api.post('/billing/cut', {
                companyId: selectedCompanyId,
                ticketIds: selectedTickets
            });
            alert('Corte generado con éxito.');
            loadPendingTickets(selectedCompanyId);
            fetchInvoices();
            setActiveTab('history');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al generar corte');
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/billing/config', config);
            alert('Configuración guardada.');
        } catch {
            alert('Error al guardar configuración');
        }
    };

    const handleExportHistory = () => {
        const headers = [
            { key: 'invoiceNumber', label: 'Folio' },
            { key: 'company.name', label: 'Empresa' },
            { key: 'company.rfc', label: 'RFC' },
            { key: 'total', label: 'Total' },
            { key: 'status', label: 'Estado' },
            { key: 'createdAt', label: 'Fecha' },
            { key: 'uuid', label: 'UUID SAT' }
        ];

        const exportData = invoices.map(inv => ({
            ...inv,
            createdAt: new Date(inv.createdAt).toLocaleString(),
            status: inv.status === 'sent' ? 'Facturado' : 'Borrador'
        }));

        exportToCSV('Historial_Facturacion', exportData, headers);
    };

    const handleStamp = async (id: string) => {
        if (!window.confirm('¿Deseas timbrar esta factura ante el SAT?')) return;
        try {
            await api.post(`/billing/${id}/stamp`);
            alert('Factura timbrada con éxito.');
            fetchInvoices();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error en el timbrado');
        }
    };

    const toggleTicket = (id: string) => {
        setSelectedTickets(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    return (
        <div className="animate-fade-in pb-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Facturación Electrónica</h1>
                    <p className="text-[#006D65] mt-1 text-sm font-medium">Gestión de cortes mensuales y timbrado CFDI 4.0</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8 w-max">
                <button
                    onClick={() => setActiveTab('cut')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cut' ? 'bg-[#FD5200] text-white shadow-lg' : 'text-gray-400 hover:text-[#00272E]'}`}
                >
                    <CalculatorIcon className="w-4 h-4" /> Corte de Mes
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-[#FD5200] text-white shadow-lg' : 'text-gray-400 hover:text-[#00272E]'}`}
                >
                    <DocumentDuplicateIcon className="w-4 h-4" /> Historial
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-[#FD5200] text-white shadow-lg' : 'text-gray-400 hover:text-[#00272E]'}`}
                >
                    <Cog6ToothIcon className="w-4 h-4" /> Configuración Fiscal
                </button>
            </div>

            {/* ── Tab: Corte de Mes ── */}
            {activeTab === 'cut' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1">
                        <div className="marmacore-card p-6">
                            <h3 className="text-lg font-bold text-[#00272E] mb-4">Paso 1: Seleccionar Empresa</h3>
                            <select
                                onChange={(e) => loadPendingTickets(e.target.value)}
                                value={selectedCompanyId}
                                className="marmacore-input w-full p-3 mb-6"
                            >
                                <option value="">Selecciona una empresa...</option>
                                {companies.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                            </select>

                            {selectedCompanyId && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <p className="text-[10px] uppercase font-bold text-orange-600 mb-1">Resumen del Corte</p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-2xl font-black text-[#00272E]">{selectedTickets.length}</p>
                                                <p className="text-[11px] font-bold text-[#006D65]">Tickets seleccionados</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-[#FD5200]">
                                                    ${pendingTickets.filter(t => selectedTickets.includes(t._id)).reduce((acc, t) => acc + (t.totalCost || 0), 0).toLocaleString()}
                                                </p>
                                                <p className="text-[11px] font-bold text-[#006D65]">Monto total proyectado</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        disabled={selectedTickets.length === 0}
                                        onClick={handleCreateCut}
                                        className="w-full bg-[#00272E] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#003841] transition-all disabled:opacity-30"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" /> Generar Corte de Mes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2">
                        <div className="marmacore-table-container">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-[#00272E]">Tickets Pendientes de Facturar</h3>
                                {selectedCompanyId && pendingTickets.length > 0 && (
                                    <span className="text-xs font-bold text-[#006D65] bg-[#D5EFF2] px-3 py-1.5 rounded-lg">
                                        VISTA PREVIA
                                    </span>
                                )}
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="marmacore-table-head">
                                            <th className="px-6 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTickets.length === pendingTickets.length && pendingTickets.length > 0}
                                                    onChange={() => setSelectedTickets(selectedTickets.length === pendingTickets.length ? [] : pendingTickets.map(t => t._id))}
                                                    className="rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                                />
                                            </th>
                                            <th className="px-6 py-3">Folio</th>
                                            <th className="px-6 py-3">Fecha</th>
                                            <th className="px-6 py-3">Subtotal</th>
                                            <th className="px-6 py-3">IVA</th>
                                            <th className="px-6 py-3">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {!selectedCompanyId && (
                                            <tr>
                                                <td colSpan={6} className="py-20 text-center text-gray-400">
                                                    Selecciona una empresa para cargar los incidentes pendientes.
                                                </td>
                                            </tr>
                                        )}
                                        {selectedCompanyId && pendingTickets.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={6} className="py-20 text-center text-gray-400">
                                                    No hay incidentes resueltos pendientes de facturación para esta empresa.
                                                </td>
                                            </tr>
                                        )}
                                        {pendingTickets.map(t => (
                                            <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTickets.includes(t._id)}
                                                        onChange={() => toggleTicket(t._id)}
                                                        className="rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-bold text-sm text-[#00272E]">#{t.ticketNumber}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(t.solvedAt || t.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-[#00272E]">${t.cost.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">${(t.taxAmount || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm font-black text-[#FD5200]">${(t.totalCost || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Historial ── */}
            {activeTab === 'history' && (
                <div className="marmacore-table-container animate-fade-in">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[#00272E]">Registros de Facturación (Cortes)</h3>
                        <button
                            onClick={handleExportHistory}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#FD5200] border border-[#FD5200]/20 rounded-xl hover:bg-[#FD5200]/5"
                        >
                            <TableCellsIcon className="w-4 h-4" /> Exportar a Excel
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="marmacore-table-head">
                                    <th className="px-6 py-3">Folio Int.</th>
                                    <th className="px-6 py-3">Empresa / RFC</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3">Estatus</th>
                                    <th className="px-6 py-3">UUID SAT</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoices.map(inv => (
                                    <tr key={inv._id} className="hover:bg-gray-50/50 group">
                                        <td className="px-6 py-4 font-bold text-[#00272E]">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-sm">{inv.company.name}</div>
                                            <div className="text-[10px] text-[#006D65] font-black uppercase">{inv.company.rfc}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-[#FD5200]">${inv.total.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${inv.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {inv.status === 'sent' ? 'FACTURADO' : 'BORRADOR / CORTE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                                            {inv.uuid || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {inv.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleStamp(inv._id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#FD5200] text-white rounded-lg hover:bg-[#E64A00] transition-colors"
                                                    >
                                                        <ArrowPathIcon className="w-3.5 h-3.5" /> Timbrar
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-300 hover:text-[#00272E] hover:bg-gray-50 rounded-lg">
                                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Tab: Configuración ── */}
            {activeTab === 'config' && config && (
                <div className="max-w-4xl animate-fade-in">
                    <form onSubmit={handleSaveConfig} className="space-y-6">
                        <div className="marmacore-card p-8">
                            <h3 className="text-lg font-bold text-[#00272E] mb-6 flex items-center gap-2">
                                <BuildingOfficeIcon className="w-5 h-5 text-[#FD5200]" /> Datos del Emisor (Marmacore)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">Razón Social</label>
                                    <input
                                        type="text"
                                        value={config.razonSocial}
                                        onChange={e => setConfig({ ...config, razonSocial: e.target.value })}
                                        className="marmacore-input w-full p-2.5"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">RFC</label>
                                    <input
                                        type="text"
                                        value={config.rfc}
                                        onChange={e => setConfig({ ...config, rfc: e.target.value.toUpperCase() })}
                                        className="marmacore-input w-full p-2.5"
                                        maxLength={13}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">Código Postal Fiscal</label>
                                    <input
                                        type="text"
                                        value={config.codigoPostal}
                                        onChange={e => setConfig({ ...config, codigoPostal: e.target.value })}
                                        className="marmacore-input w-full p-2.5"
                                        maxLength={5}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">Régimen Fiscal (SAT)</label>
                                    <select
                                        value={config.regimenFiscal}
                                        onChange={e => setConfig({ ...config, regimenFiscal: e.target.value })}
                                        className="marmacore-input w-full p-2.5"
                                    >
                                        <option value="601">General de Ley Personas Morales (601)</option>
                                        <option value="626">Régimen Simplificado de Confianza (626)</option>
                                        <option value="603">Personas Morales con Fines no Lucrativos (603)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="marmacore-card p-8">
                            <h3 className="text-lg font-bold text-[#00272E] mb-6 flex items-center gap-2">
                                <ArrowPathIcon className="w-5 h-5 text-[#FD5200]" /> Configuración del PAC (Timbrado)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">Usuario del PAC</label>
                                    <input
                                        type="text"
                                        value={config.pacUsername || ''}
                                        onChange={e => setConfig({ ...config, pacUsername: e.target.value })}
                                        className="marmacore-input w-full p-2.5"
                                        placeholder="Username / API Key"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">Password del PAC</label>
                                    <input
                                        type="password"
                                        value={config.pacPassword || ''}
                                        onChange={e => setConfig({ ...config, pacPassword: e.target.value })}
                                        className="marmacore-input w-full p-2.5"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.isTestMode}
                                            onChange={e => setConfig({ ...config, isTestMode: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                        />
                                        <span className="text-sm font-bold text-[#00272E]">Modo de Pruebas (Sandbox) activo</span>
                                    </label>
                                    <p className="mt-2 text-xs text-gray-500 font-medium italic">
                                        * Mientras esté activo, el sistema simulará el timbrado sin validez legal ni consumo de timbres.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-[#FD5200] text-white px-10 py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#E64A00] transition-all"
                            >
                                Guardar Configuración Fiscal
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Billing;
