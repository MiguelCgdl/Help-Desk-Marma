import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Problem } from '../../types';
import { ExclamationCircleIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Problems: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [title, setTitle] = useState('');
    const [costPerHour, setCostPerHour] = useState<number>(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingCosts, setEditingCosts] = useState<Record<string, number>>({});
    const [editingTitles, setEditingTitles] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { fetchProblems(); }, []);
    
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

    const startEdit = (p: Problem) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setEditingId(p._id);
        setTitle(p.title);
        setCostPerHour(p.costPerHour || 0);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setCostPerHour(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                await api.put(`/problems/${editingId}`, { title, costPerHour });
            } else {
                await api.post('/problems', { title, active: true, costPerHour });
            }
            fetchProblems();
            cancelEdit();
        } catch (err) {
            alert('Error al guardar problema');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await api.put(`/problems/${id}`, { active: !currentStatus });
        fetchProblems();
    };

    const saveRow = async (id: string) => {
        const costValue = Number(editingCosts[id]);
        const titleValue = editingTitles[id];

        if (!Number.isFinite(costValue) || costValue < 0) {
            alert('Costo inválido');
            return;
        }
        if (!titleValue || titleValue.trim() === '') {
            alert('El identificador no puede estar vacío');
            return;
        }

        try {
            await api.put(`/problems/${id}`, { costPerHour: costValue, title: titleValue.trim() });
            fetchProblems();
        } catch (error) {
            console.error(error);
            alert('Error al actualizar');
        }
    };

    const handleDelete = async (id: string) => { 
        if(window.confirm('¿Eliminar este tipo de problema?')) {
            try {
                await api.delete(`/problems/${id}`); 
                fetchProblems(); 
            } catch {
                alert('No se pudo eliminar el problema.');
            }
        }
    };

    return (
        <div className="animate-fade-in pb-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Tipos de Problema</h1>
                <p className="text-[#006D65] mt-1 text-sm font-medium">Define las categorías de problemas que los usuarios pueden reportar.</p>
            </div>

            <div className="flex flex-col gap-8 w-full mx-auto">
                {/* ── Form ── */}
                <div className="w-full">
                    <div className={`marmacore-card transition-all duration-300 ${editingId ? 'border-[#FD5200]/30 ring-2 ring-[#FD5200]/10' : 'border-gray-100'}`}>
                        {/* Form header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${editingId ? 'bg-[#FD5200]' : 'bg-[#00272E]'}`}>
                                    {editingId
                                        ? <PencilIcon className="w-4 h-4 text-white" />
                                        : <PlusIcon className="w-4 h-4 text-white" />
                                    }
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#00272E]">
                                        {editingId ? 'Editar tipo de problema' : 'Nuevo tipo de problema'}
                                    </h3>
                                    <p className="text-[11px] text-[#006D65] font-semibold mt-0.5 opacity-60 uppercase tracking-wider">
                                        {editingId ? 'Actualiza la categoría de incidencia' : 'Define una nueva categoría de soporte'}
                                    </p>
                                </div>
                            </div>
                            {editingId && (
                                <button
                                    onClick={cancelEdit}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" /> Cancelar
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Descripción del Problema
                                    </label>
                                    <div className="relative">
                                        <ExclamationCircleIcon className="marmacore-icon-left" />
                                        <input 
                                            type="text" 
                                            placeholder="Ej. Falla de Internet, Software..." 
                                            value={title} 
                                            onChange={e => setTitle(e.target.value)} 
                                            className="marmacore-input marmacore-input-icon py-2 text-xs" 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Costo General Base (MXN)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={costPerHour}
                                        onChange={(e) => setCostPerHour(Number(e.target.value))}
                                        className="marmacore-input py-2 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD5200] text-white font-bold text-xs transition-all duration-200 ${isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#E64A00] hover:shadow-lg hover:shadow-[#FD5200]/20 active:scale-[0.98]'}`}
                            >
                                {isSaving
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><PlusIcon className="w-4 h-4" />{editingId ? 'Confirmar cambios' : 'Guardar Categoría'}</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="w-full">
                    <div className="marmacore-table-container">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div>
                                <h3 className="text-base font-bold text-[#00272E]">Categorías Registradas</h3>
                                <p className="text-[11px] text-[#006D65] font-semibold mt-0.5 opacity-60 uppercase tracking-wider">
                                    Configuración de servicios
                                </p>
                            </div>
                            <span className="bg-[#00272E] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg tracking-wider">
                                {problems.length} TOTAL
                            </span>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                                <thead>
                                    <tr className="marmacore-table-head">
                                        <th className="px-6 py-3">Identificador</th>
                                        <th className="px-6 py-3">Costo General</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {problems.map(p => (
                                        <tr key={p._id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-[#00272E]">{p.title}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-[#FD5200]">
                                                    ${p.costPerHour?.toFixed(2) || '0.00'}
                                                </span>
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
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(p)}
                                                        className="p-2 text-gray-400 hover:text-[#FD5200] hover:bg-[#FD5200]/5 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p._id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Problems;