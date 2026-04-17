import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Problem } from '../../types';
import { ExclamationCircleIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Problems: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [title, setTitle] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [specificType, setSpecificType] = useState('');
    const [firstResponseTime, setFirstResponseTime] = useState('');
    const [targetResolutionTime, setTargetResolutionTime] = useState('');
    const [priority, setPriority] = useState('Baja');
    const [costPerHour, setCostPerHour] = useState<number>(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => { fetchProblems(); }, []);
    
    const fetchProblems = async () => { 
        try {
            const res = await api.get('/problems'); 
            setProblems(res.data); 

        } catch (err) {
            console.error(err);
        }
    };

    const startEdit = (p: Problem) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setEditingId(p._id);
        setTitle(p.title);
        setMainCategory(p.mainCategory || '');
        setSubcategory(p.subcategory || '');
        setSpecificType(p.specificType || '');
        setFirstResponseTime(p.firstResponseTime || '');
        setTargetResolutionTime(p.targetResolutionTime || '');
        setPriority(p.priority || 'Baja');
        setCostPerHour(p.costPerHour || 0);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setMainCategory('');
        setSubcategory('');
        setSpecificType('');
        setFirstResponseTime('');
        setTargetResolutionTime('');
        setPriority('Baja');
        setCostPerHour(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const problemData = { 
                title, 
                mainCategory, 
                subcategory, 
                specificType, 
                firstResponseTime, 
                targetResolutionTime, 
                priority,
                costPerHour 
            };
            if (editingId) {
                await api.put(`/problems/${editingId}`, problemData);
            } else {
                await api.post('/problems', { ...problemData, active: true });
            }
            fetchProblems();
            cancelEdit();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Error desconocido';
            alert(`Error al guardar problema: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await api.put(`/problems/${id}`, { active: !currentStatus });
        fetchProblems();
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

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        try {
            const res = await api.post('/problems/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Importación completada:\n- Creados: ${res.data.results.created}\n- Actualizados: ${res.data.results.updated}\n- Errores: ${res.data.results.errors}`);
            fetchProblems();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Error al importar';
            alert(`Error: ${msg}`);
        } finally {
            setIsImporting(false);
            // Reset input
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const headers = 'ID,Categoría Principal,Subcategoría,Tipo Específico,Respuesta,Resolución,Prioridad,Costo';
        const example = '\nINF-001,Infraestructura,Redes,Falla de Switch,30 min,4 hrs,Alta,150';
        const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'template_problemas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            <div className="flex items-center gap-3">
                                {!editingId && (
                                    <>
                                        <button
                                            onClick={downloadTemplate}
                                            className="text-[10px] font-bold text-[#006D65] hover:text-[#00272E] transition-colors uppercase tracking-wider underline decoration-dotted"
                                        >
                                            Descargar Plantilla
                                        </button>
                                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00272E]/5 text-[#00272E] text-[10px] font-bold uppercase cursor-pointer hover:bg-[#00272E]/10 transition-all ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {isImporting ? 'Importando...' : 'Importar CSV'}
                                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" disabled={isImporting} />
                                        </label>
                                    </>
                                )}
                                {editingId && (
                                    <button
                                        onClick={cancelEdit}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors"
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Datalists for suggestions */}
                            <datalist id="mainCategoryList">
                                {Array.from(new Set(problems.map(p => p.mainCategory))).filter(Boolean).map(val => (
                                    <option key={val} value={val} />
                                ))}
                            </datalist>
                            <datalist id="subcategoryList">
                                {Array.from(new Set(problems.map(p => p.subcategory))).filter(Boolean).map(val => (
                                    <option key={val} value={val} />
                                ))}
                            </datalist>
                            <datalist id="firstResponseList">
                                {Array.from(new Set(problems.map(p => p.firstResponseTime))).filter(Boolean).map(val => (
                                    <option key={val} value={val} />
                                ))}
                            </datalist>
                            <datalist id="resolutionList">
                                {Array.from(new Set(problems.map(p => p.targetResolutionTime))).filter(Boolean).map(val => (
                                    <option key={val} value={val} />
                                ))}
                            </datalist>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Identificador
                                    </label>
                                    <div className="relative">
                                        <ExclamationCircleIcon className="marmacore-icon-left" />
                                        <input 
                                            type="text" 
                                            placeholder="ID Único" 
                                            value={title} 
                                            onChange={e => setTitle(e.target.value)} 
                                            className="marmacore-input marmacore-input-icon py-2 text-xs" 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Categoría Principal
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Infraestructura" 
                                        value={mainCategory} 
                                        onChange={e => setMainCategory(e.target.value)} 
                                        className="marmacore-input py-2 text-xs" 
                                        list="mainCategoryList"
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Subcategoría
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Redes" 
                                        value={subcategory} 
                                        onChange={e => setSubcategory(e.target.value)} 
                                        className="marmacore-input py-2 text-xs" 
                                        list="subcategoryList"
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Tipo Específico
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Falla de conexión" 
                                        value={specificType} 
                                        onChange={e => setSpecificType(e.target.value)} 
                                        className="marmacore-input py-2 text-xs" 
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Tiempo 1ra Respuesta
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. 30 min" 
                                        value={firstResponseTime} 
                                        onChange={e => setFirstResponseTime(e.target.value)} 
                                        className="marmacore-input py-2 text-xs" 
                                        list="firstResponseList"
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Tiempo Resolucion
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. 2 hrs" 
                                        value={targetResolutionTime} 
                                        onChange={e => setTargetResolutionTime(e.target.value)} 
                                        className="marmacore-input py-2 text-xs" 
                                        list="resolutionList"
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Prioridad
                                    </label>
                                    <select 
                                        value={priority} 
                                        onChange={e => setPriority(e.target.value)} 
                                        className="marmacore-input py-2 text-xs"
                                        required
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Crítica">Crítica</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Costo Base (Opcional)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={costPerHour}
                                        onChange={(e) => setCostPerHour(Number(e.target.value))}
                                        className="marmacore-input py-2 text-xs"
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

                        {/* Desktop Table View */}
                        <div className="hidden xl:block overflow-x-auto w-full">
                            <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                                <thead>
                                    <tr className="marmacore-table-head">
                                        <th className="px-6 py-3 text-[10px]">ID</th>
                                        <th className="px-6 py-3 text-[10px]">C. Principal</th>
                                        <th className="px-6 py-3 text-[10px]">Subcategoría</th>
                                        <th className="px-6 py-3 text-[10px]">Tipo Específico</th>
                                        <th className="px-6 py-3 text-[10px]">1ra Resp.</th>
                                        <th className="px-6 py-3 text-[10px]">Resolución</th>
                                        <th className="px-6 py-3 text-[10px]">Prioridad</th>
                                        <th className="px-6 py-3 text-[10px]">Estado</th>
                                        <th className="px-6 py-3 text-right text-[10px]">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {problems.map(p => (
                                        <tr key={p._id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-[#00272E]">{p.title}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-semibold text-gray-500">{p.mainCategory}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-semibold text-gray-500">{p.subcategory}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-semibold text-[#00272E]">{p.specificType}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-medium text-gray-500">{p.firstResponseTime}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-medium text-gray-500">{p.targetResolutionTime}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    p.priority === 'Crítica' ? 'bg-red-100 text-red-700' :
                                                    p.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                                                    p.priority === 'Media' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {p.priority}
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

                        {/* Mobile Card View */}
                        <div className="xl:hidden divide-y divide-gray-100">
                            {problems.map(p => (
                                <div key={p._id} className="p-4 space-y-3 hover:bg-gray-50/30 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="font-bold text-[#00272E] text-base">{p.specificType || p.title}</div>
                                            <div className="flex flex-wrap gap-2 text-[10px] items-center">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-500 uppercase">{p.mainCategory}</span>
                                                <span className="text-gray-400">/</span>
                                                <span className="text-gray-500">{p.subcategory}</span>
                                            </div>
                                            <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-medium">
                                                <span>Resp: {p.firstResponseTime}</span>
                                                <span>Resol: {p.targetResolutionTime}</span>
                                            </div>
                                            <div className="mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    p.priority === 'Crítica' ? 'bg-red-100 text-red-700' :
                                                    p.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                                                    p.priority === 'Media' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {p.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button 
                                                onClick={() => toggleStatus(p._id, p.active)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                                    p.active 
                                                    ? 'bg-green-50 text-green-600 border border-green-100' 
                                                    : 'bg-red-50 text-red-600 border border-red-100'
                                                }`}
                                            >
                                                {p.active ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDelete(p._id)}
                                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => startEdit(p)}
                                                className="p-2.5 text-[#FD5200] bg-orange-50 hover:bg-orange-100 rounded-xl transition-all"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Problems;