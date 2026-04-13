import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Problem, Company } from '../../types';
import { 
    CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, 
    InformationCircleIcon, TrashIcon, BuildingOfficeIcon,
    ChevronRightIcon, PlusIcon, XMarkIcon
} from '@heroicons/react/24/outline';

const Costs: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editingCosts, setEditingCosts] = useState<Record<string, number>>({});
    const [editingTitles, setEditingTitles] = useState<Record<string, string>>({});
    const [editingCompanyCosts, setEditingEditingCompanyCosts] = useState<Record<string, number>>({});
    const [editingCompanyToggles, setEditingCompanyToggles] = useState<Record<string, boolean>>({});
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [editingProblemCostsForCompany, setEditingProblemCostsForCompany] = useState<Record<string, number>>({});

    useEffect(() => { 
        fetchData(); 
    }, []);
    
    const fetchData = async () => { 
        try {
            const [probRes, compRes] = await Promise.all([
                api.get('/problems'),
                api.get('/companies')
            ]);
            
            setProblems(probRes.data); 
            setCompanies(compRes.data);

            // Initialize global problem costs
            setEditingCosts(
                (probRes.data as Problem[]).reduce((acc, p) => {
                    acc[p._id] = Number(p.costPerHour ?? 0);
                    return acc;
                }, {} as Record<string, number>)
            );
            setEditingTitles(
                (probRes.data as Problem[]).reduce((acc, p) => {
                    acc[p._id] = p.title;
                    return acc;
                }, {} as Record<string, string>)
            );

            // Initialize company fixed costs
            setEditingEditingCompanyCosts(
                (compRes.data as Company[]).reduce((acc, c) => {
                    acc[c._id] = Number(c.customCostPerTicket ?? 0);
                    return acc;
                }, {} as Record<string, number>)
            );
            setEditingCompanyToggles(
                (compRes.data as Company[]).reduce((acc, c) => {
                    acc[c._id] = !!c.useCustomCost;
                    return acc;
                }, {} as Record<string, boolean>)
            );
        } catch (err) {
            console.error(err);
        }
    };

    // When a company is selected for problem-specific costs
    useEffect(() => {
        if (selectedCompanyId) {
            const company = companies.find(c => c._id === selectedCompanyId);
            if (company) {
                const initialProblemCosts = problems.reduce((acc, p) => {
                    // Check both Map-style and Object-style access for the response
                    const customRate = company.problemCosts?.[p._id];
                    acc[p._id] = typeof customRate === 'number' ? customRate : p.costPerHour;
                    return acc;
                }, {} as Record<string, number>);
                setEditingProblemCostsForCompany(initialProblemCosts);
            }
        }
    }, [selectedCompanyId, companies, problems]);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await api.put(`/problems/${id}`, { active: !currentStatus });
        fetchData();
    };

    const handleDelete = async (id: string) => { 
        if(window.confirm('¿Eliminar este tipo de problema?')) {
            await api.delete(`/problems/${id}`); 
            fetchData(); 
        }
    };

    const saveRow = async (id: string) => {
        const costValue = Number(editingCosts[id]);
        const titleValue = editingTitles[id];

        if (!Number.isFinite(costValue) || costValue < 0) {
            alert('Costo por hora inválido');
            return;
        }
        if (!titleValue || titleValue.trim() === '') {
            alert('El identificador no puede estar vacío');
            return;
        }

        try {
            await api.put(`/problems/${id}`, { costPerHour: costValue, title: titleValue.trim() });
            fetchData();
            alert('Actualizado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar');
        }
    };

    const saveCompanyRow = async (id: string) => {
        const costValue = Number(editingCompanyCosts[id]);
        const toggleValue = editingCompanyToggles[id];

        if (!Number.isFinite(costValue) || costValue < 0) {
            alert('Costo inválido');
            return;
        }

        try {
            await api.put(`/companies/${id}`, { 
                customCostPerTicket: costValue, 
                useCustomCost: toggleValue 
            });
            fetchData();
            alert('Configuración de empresa actualizada');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar empresa');
        }
    };

    const saveCompanyProblemCosts = async () => {
        if (!selectedCompanyId) return;

        try {
            await api.put(`/companies/${selectedCompanyId}`, { 
                problemCosts: editingProblemCostsForCompany 
            });
            fetchData();
            setSelectedCompanyId(null);
            alert('Tarifas por problema actualizadas para la empresa');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar tarifas de la empresa');
        }
    };

    return (
        <div className="animate-fade-in pb-12 space-y-10">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Configuración de Costos</h1>
                <p className="text-[#006D65] mt-1 text-sm font-medium">Gestiona las tarifas generales por problema y costos personalizados por empresa.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* General Costs (Problems) */}
                <div className="space-y-4">
                    <div className="marmacore-table-container">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-[#F8FAFB]/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#FD5200]/10 rounded-lg">
                                    <InformationCircleIcon className="w-5 h-5 text-[#FD5200]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#00272E]">Tarifas por Tipo de Problema</h3>
                                    <p className="text-[11px] text-[#006D65] font-semibold opacity-60 uppercase tracking-wider">Costo general por hora</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] font-black text-[#00272E] uppercase tracking-[0.2em] opacity-50">
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3">Costo/Hora</th>
                                        <th className="px-6 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {problems.map(p => (
                                        <tr key={p._id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editingTitles[p._id] ?? ''}
                                                    onChange={(e) => setEditingTitles({ ...editingTitles, [p._id]: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[#00272E] text-xs font-semibold focus:border-[#FD5200]/40 focus:bg-white transition-all"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => toggleStatus(p._id, p.active)}
                                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${
                                                        p.active 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                        : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}
                                                >
                                                    {p.active ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-gray-400">$</span>
                                                    <input
                                                        type="number"
                                                        value={editingCosts[p._id] ?? 0}
                                                        onChange={(e) => setEditingCosts({ ...editingCosts, [p._id]: Number(e.target.value) })}
                                                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[#FD5200] text-xs font-black focus:border-[#FD5200]/40 focus:bg-white transition-all"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => saveRow(p._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><CheckCircleIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDelete(p._id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Company Costs */}
                <div className="space-y-4">
                    <div className="marmacore-table-container">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-[#F8FAFB]/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#006D65]/10 rounded-lg">
                                    <BuildingOfficeIcon className="w-5 h-5 text-[#006D65]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#00272E]">Costos por Empresa</h3>
                                    <p className="text-[11px] text-[#006D65] font-semibold opacity-60 uppercase tracking-wider">Costo fijo por ticket</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] font-black text-[#00272E] uppercase tracking-[0.2em] opacity-50">
                                        <th className="px-6 py-3">Empresa</th>
                                        <th className="px-6 py-3">Personalizado</th>
                                        <th className="px-6 py-3">Costo/Ticket</th>
                                        <th className="px-6 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {companies.map(c => (
                                        <tr key={c._id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[#00272E]">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={editingCompanyToggles[c._id] ?? false}
                                                        onChange={(e) => setEditingCompanyToggles({ ...editingCompanyToggles, [c._id]: e.target.checked })}
                                                    />
                                                    <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#FD5200]"></div>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-gray-400">$</span>
                                                    <input
                                                        type="number"
                                                        disabled={!editingCompanyToggles[c._id]}
                                                        value={editingCompanyCosts[c._id] ?? 0}
                                                        onChange={(e) => setEditingEditingCompanyCosts({ ...editingCompanyCosts, [c._id]: Number(e.target.value) })}
                                                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[#00272E] text-xs font-black focus:border-[#FD5200]/40 focus:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedCompanyId(c._id)}
                                                        className="p-1.5 text-[#006D65] hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                                                        title="Configurar tarifas por problema"
                                                    >
                                                        <PlusIcon className="w-3.5 h-3.5"/>
                                                        Tarifas
                                                    </button>
                                                    <button 
                                                        onClick={() => saveCompanyRow(c._id)}
                                                        className="p-1.5 text-[#006D65] hover:bg-emerald-50 rounded-lg transition-all"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Problem Costs Modal */}
            {selectedCompanyId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-black text-[#00272E]">Tarifas Personalizadas</h3>
                                <p className="text-xs text-[#006D65] font-bold">
                                    {companies.find(c => c._id === selectedCompanyId)?.name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedCompanyId(null)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-5">
                            <div className="space-y-4">
                                {problems.map(p => (
                                    <div key={p._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#00272E]">{p.title}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Tarifa Global: ${p.costPerHour}/hr</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400">$</span>
                                            <input
                                                type="number"
                                                value={editingProblemCostsForCompany[p._id] ?? 0}
                                                onChange={(e) => setEditingProblemCostsForCompany({ 
                                                    ...editingProblemCostsForCompany, 
                                                    [p._id]: Number(e.target.value) 
                                                })}
                                                className="w-24 px-3 py-2 rounded-lg border border-gray-200 bg-white text-[#FD5200] text-sm font-black focus:border-[#FD5200]/40 transition-all"
                                            />
                                            <span className="text-xs font-bold text-gray-400">/hr</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedCompanyId(null)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveCompanyProblemCosts}
                                className="px-6 py-2.5 rounded-xl bg-[#006D65] text-white font-bold text-sm hover:bg-[#004D47] transition-all"
                            >
                                Guardar Tarifas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IVA Notice */}
            <div className="bg-[#00272E] text-white p-6 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FD5200] blur-[80px] opacity-20 -mr-16 -mt-16 group-hover:opacity-30 transition-opacity" />
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <InformationCircleIcon className="w-6 h-6 text-[#FD5200]" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black tracking-tight">Política de Facturación y Automatización</h4>
                        <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                            El sistema calcula automáticamente el costo final sumando el <span className="text-white font-bold">16% de IVA</span> si el ticket requiere factura.
                            Los tickets sin factura mantienen su costo base calculado por horas o tarifa fija de empresa.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Costs;
