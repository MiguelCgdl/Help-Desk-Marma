import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Problem } from '../../types';
import { ExclamationCircleIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Problems: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [title, setTitle] = useState('');
    const [costPerHour, setCostPerHour] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [editingCosts, setEditingCosts] = useState<Record<string, number>>({});

    useEffect(() => { fetchProblems(); }, []);
    
    const fetchProblems = async () => { 
        setLoading(true);
        try {
            const res = await api.get('/problems'); 
            setProblems(res.data); 
            setEditingCosts(
                (res.data as Problem[]).reduce((acc, p) => {
                    acc[p._id] = Number(p.costPerHour ?? 0);
                    return acc;
                }, {} as Record<string, number>)
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/problems', { title, active: true, costPerHour });
            fetchProblems();
            setTitle('');
            setCostPerHour(0);
        } catch (err) {
            alert('Error al guardar problema');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await api.put(`/problems/${id}`, { active: !currentStatus });
        fetchProblems();
    };

    const saveCost = async (id: string) => {
        const value = Number(editingCosts[id]);
        if (!Number.isFinite(value) || value < 0) {
            alert('Costo por hora inválido');
            return;
        }
        await api.put(`/problems/${id}`, { costPerHour: value });
        fetchProblems();
    };

    const handleDelete = async (id: string) => { 
        if(window.confirm('¿Eliminar este tipo de problema?')) {
            await api.delete(`/problems/${id}`); 
            fetchProblems(); 
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#00272E]">Tipos de Problema</h1>
                    <p className="text-[#006D65] mt-1">Define las categorías de problemas que los usuarios pueden reportar.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Card */}
                <div className="marmacore-card p-8 h-fit">
                    <h3 className="text-lg font-bold text-[#00272E] mb-6 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-[#FD5200]" />
                        Nuevo Problema
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Descripción del Problema</label>
                            <div className="relative">
                                <ExclamationCircleIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Ej. Falla de Internet, Software..." 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    className="marmacore-input pl-10" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Costo por hora (MXN)</label>
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={costPerHour}
                                onChange={(e) => setCostPerHour(Number(e.target.value))}
                                className="marmacore-input"
                                required
                            />
                        </div>

                        <button type="submit" className="marmacore-button-primary w-full py-4">
                            Guardar Categoría
                        </button>
                    </form>
                </div>

                {/* List Table */}
                <div className="lg:col-span-2 marmacore-card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Identificador</th>
                                <th className="px-8 py-5">Costo/hora</th>
                                <th className="px-8 py-5">Estado</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {problems.map(p => (
                                <tr key={p._id} className="hover:bg-[#D5EFF2]/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-[#00272E]">{p.title}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={editingCosts[p._id] ?? 0}
                                                onChange={(e) => setEditingCosts({ ...editingCosts, [p._id]: Number(e.target.value) })}
                                                className="marmacore-input py-2 text-sm max-w-[140px]"
                                            />
                                            <button
                                                onClick={() => saveCost(p._id)}
                                                className="text-xs font-bold text-[#006D65] hover:text-primary"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button 
                                            onClick={() => toggleStatus(p._id, p.active)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                                p.active 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {p.active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                            {p.active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => handleDelete(p._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Problems;