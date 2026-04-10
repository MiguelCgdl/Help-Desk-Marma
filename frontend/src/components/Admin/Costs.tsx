import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Problem } from '../../types';
import { CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const Costs: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [editingCosts, setEditingCosts] = useState<Record<string, number>>({});

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
        } catch (err) {
            console.error(err);
        }
    };

    const saveCost = async (id: string) => {
        const value = Number(editingCosts[id]);
        if (!Number.isFinite(value) || value < 0) {
            alert('Costo por hora inválido');
            return;
        }
        await api.put(`/problems/${id}`, { costPerHour: value });
        fetchProblems();
        alert('Costo actualizado correctamente');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-extrabold text-dark-teal">Configuración de Costos</h1>
                <p className="text-medium-teal mt-1">Define el costo por hora para cada tipo de incidente reportado.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="marmacore-card overflow-hidden">
                    <div className="p-6 bg-accent-teal/30 border-b border-accent-teal flex items-center gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-medium-teal" />
                        <p className="text-sm text-medium-teal font-medium">
                            Los costos configurados aquí se aplicarán a los nuevos tickets y se usarán para el cálculo de facturación estimada en los reportes.
                        </p>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-[#F8FAFB] text-xs font-bold text-medium-teal uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Tipo de Problema</th>
                                <th className="px-8 py-5">Estado Actual</th>
                                <th className="px-8 py-5">Costo por Hora (MXN)</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {problems.map(p => (
                                <tr key={p._id} className="hover:bg-[#D5EFF2]/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-dark-teal">{p.title}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            p.active 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            {p.active ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                                            {p.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="relative max-w-[200px]">
                                            <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={editingCosts[p._id] ?? 0}
                                                onChange={(e) => setEditingCosts({ ...editingCosts, [p._id]: Number(e.target.value) })}
                                                className="marmacore-input py-2 !pl-12 text-sm w-full"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => saveCost(p._id)}
                                            className="marmacore-button-primary px-6 py-2 text-sm flex items-center gap-2 ml-auto"
                                        >
                                            <CurrencyDollarIcon className="w-4 h-4" />
                                            Actualizar Costo
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

export default Costs;
