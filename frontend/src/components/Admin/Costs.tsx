import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Problem } from '../../types';
import { CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const Costs: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [editingCosts, setEditingCosts] = useState<Record<string, number>>({});
    const [editingTitles, setEditingTitles] = useState<Record<string, string>>({});

    useEffect(() => { 
        fetchProblems(); 
    }, []);
    
    const fetchProblems = async () => { 
        try {
            const res = await api.get('/problems'); 
            setProblems(res.data); 
            setEditingCosts(
                (res.data as Problem[]).reduce((acc, p) => {
                    acc[p._id] = Number(p.costPerHour ?? 0);
                    return acc;
                }, {} as Record<string, number>)
            );
            setEditingTitles(
                (res.data as Problem[]).reduce((acc, p) => {
                    acc[p._id] = p.title;
                    return acc;
                }, {} as Record<string, string>)
            );
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await api.put(`/problems/${id}`, { active: !currentStatus });
        fetchProblems();
    };

    const handleDelete = async (id: string) => { 
        if(window.confirm('¿Eliminar este tipo de problema?')) {
            await api.delete(`/problems/${id}`); 
            fetchProblems(); 
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
            fetchProblems();
            alert('Actualizado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar');
        }
    };

    return (
        <div className="animate-fade-in pb-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Configuración de Costos</h1>
                <p className="text-[#006D65] mt-1 text-sm font-medium">Define el costo por hora para cada tipo de incidente reportado.</p>
            </div>

            <div className="flex flex-col gap-8 w-full mx-auto">
                <div className="w-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-[#D5EFF2]/30 border-b border-[#D5EFF2]/50 flex items-center gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-[#006D65]" />
                            <p className="text-xs text-[#006D65] font-medium">
                                Los costos configurados aquí se aplicarán a los nuevos tickets y se usarán para el cálculo de facturación estimada en los reportes.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFB] text-[10px] font-black text-[#00272E] uppercase tracking-[0.2em] opacity-50">
                                        <th className="px-6 py-3">Tipo de Problema</th>
                                        <th className="px-6 py-3">Estado Actual</th>
                                        <th className="px-6 py-3">Costo por Hora (MXN)</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
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
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-[#00272E] text-sm font-semibold outline-none focus:border-[#FD5200]/40 focus:bg-white focus:ring-2 focus:ring-[#FD5200]/10 transition-all"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => toggleStatus(p._id, p.active)}
                                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                        p.active 
                                                        ? 'bg-green-50 text-green-600 border border-green-100' 
                                                        : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}
                                                >
                                                    {p.active ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                                                    {p.active ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-400">$</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        value={editingCosts[p._id] ?? 0}
                                                        onChange={(e) => setEditingCosts({ ...editingCosts, [p._id]: Number(e.target.value) })}
                                                        className="w-32 px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-[#FD5200] text-sm font-black outline-none focus:border-[#FD5200]/40 focus:bg-white focus:ring-2 focus:ring-[#FD5200]/10 transition-all"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => saveRow(p._id)}
                                                        className="px-4 py-2 text-[11px] font-bold text-white bg-[#006D65] hover:bg-[#004A44] rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p._id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Costs;
