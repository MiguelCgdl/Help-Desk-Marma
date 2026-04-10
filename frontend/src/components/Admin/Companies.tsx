import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Company } from '../../types';
import { PlusIcon, TrashIcon, PencilIcon, UserIcon } from '@heroicons/react/24/outline';

const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        costPerTicket: 0,
        email: '',
        loginUsername: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { fetchCompanies(); }, []);
    
    const fetchCompanies = async () => { 
        setLoading(true);
        try {
            const res = await api.get('/companies'); 
            setCompanies(res.data); 
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (c: Company) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setEditingId(c._id);
        setForm({
            name: c.name,
            code: c.code,
            costPerTicket: c.costPerTicket || 0,
            email: c.email || '',
            loginUsername: c.loginUsername || '',
            password: '' 
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ name: '', code: '', costPerTicket: 0, email: '', loginUsername: '', password: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                await api.put(`/companies/${editingId}`, form);
                alert('✓ Empresa actualizada con éxito');
            } else {
                await api.post('/companies', form);
                alert('✓ Empresa registrada con éxito');
            }
            fetchCompanies();
            cancelEdit();
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Error al conectar con el servidor';
            alert(`ERROR: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => { 
        if(window.confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
            try {
                await api.delete(`/companies/${id}`); 
                fetchCompanies(); 
            } catch (err: any) {
                alert('No se pudo eliminar la empresa.');
            }
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-32">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div>
                    <h1 className="text-5xl font-black text-[#00272E] tracking-tighter">Empresas</h1>
                    <p className="text-[#006D65]/60 mt-2 font-bold text-xs uppercase tracking-[0.2em]">Configuración global de socios comerciales</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                {/* Form Section - Improved width and organization */}
                <div className="xl:col-span-5">
                    <div className={`marmacore-card p-1 shadow-2xl transition-all duration-700 ${editingId ? 'ring-1 ring-primary/30 ring-offset-[12px]' : ''}`}>
                        <div className={`p-10 lg:p-14 rounded-[28px] h-full ${editingId ? 'bg-orange-50/10' : 'bg-white'}`}>
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                                        {editingId ? <PencilIcon className="w-6 h-6 text-white" /> : <PlusIcon className="w-6 h-6 text-white" />}
                                    </div>
                                    <h3 className="text-2xl font-black text-[#00272E] tracking-tight">
                                        {editingId ? 'Actualizar' : 'Registro'}
                                    </h3>
                                </div>
                                {editingId && (
                                    <button onClick={cancelEdit} className="text-[10px] bg-white border border-gray-100 px-6 py-3 rounded-2xl text-gray-400 hover:text-red-500 font-black uppercase shadow-sm transition-all hover:border-red-100">
                                        Cancelar
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="sm:col-span-2">
                                        <label className="marmacore-label">Nombre Comercial</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Nombre de la empresa" 
                                                value={form.name} 
                                                onChange={e => setForm({ ...form, name: e.target.value })} 
                                                className="marmacore-input" 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="marmacore-label">Código ID</label>
                                        <input 
                                            type="text" 
                                            placeholder="MARMA" 
                                            value={form.code} 
                                            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                                            className="marmacore-input font-mono tracking-widest" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="marmacore-label">Tarifa Ticket ($)</label>
                                        <input 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={form.costPerTicket} 
                                            onChange={e => setForm({ ...form, costPerTicket: Number(e.target.value) })} 
                                            className="marmacore-input" 
                                            step="0.01"
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="p-10 bg-[#F8FAFB] rounded-[32px] border border-gray-50 space-y-8 shadow-inner">
                                    <h4 className="text-[11px] font-black text-[#00272E] uppercase tracking-[0.3em] opacity-40 mb-2">Acceso al Sistema</h4>
                                    
                                    <div>
                                        <label className="marmacore-label">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            placeholder="admin@dominio.com"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="marmacore-input"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div>
                                            <label className="marmacore-label">Usuario</label>
                                            <input
                                                type="text"
                                                placeholder="username"
                                                value={form.loginUsername}
                                                onChange={(e) => setForm({ ...form, loginUsername: e.target.value.trim() })}
                                                className="marmacore-input"
                                                autoComplete="off"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="marmacore-label">Password</label>
                                            <input
                                                type="password"
                                                placeholder={editingId ? "••••••••" : "Inicial"}
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                className="marmacore-input"
                                                autoComplete="new-password"
                                                required={!editingId}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className={`marmacore-button-primary w-full py-6 group ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{editingId ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR SOCIO COMERCIAL'}</span>
                                            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* List Section - Full screen usage */}
                <div className="xl:col-span-7 space-y-8">
                    <div className="marmacore-card !rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-full">
                        <div className="px-12 py-10 border-b border-gray-50 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-3xl font-black text-[#00272E] tracking-tight">Directorio</h3>
                                <p className="text-[10px] text-[#006D65] mt-1 font-black uppercase tracking-[0.2em] opacity-40">Listado de empresas activas</p>
                            </div>
                            <div className="px-6 py-3 bg-dark-teal text-white rounded-2xl text-[10px] font-black tracking-[0.2em]">
                                {companies.length} TOTAL
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#F8FAFB] text-[10px] font-black text-[#00272E] uppercase tracking-[0.25em] opacity-50">
                                    <tr>
                                        <th className="px-12 py-8">Empresa / ID</th>
                                        <th className="px-12 py-8">Acceso</th>
                                        <th className="px-12 py-8">Tarifa</th>
                                        <th className="px-12 py-8 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/50">
                                    {companies.map(c => (
                                        <tr key={c._id} className={`hover:bg-gray-50/50 transition-all group ${editingId === c._id ? 'bg-orange-50/30' : ''}`}>
                                            <td className="px-12 py-10">
                                                <div className="font-black text-[#00272E] text-lg tracking-tight group-hover:text-primary transition-colors">{c.name}</div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="text-[10px] bg-dark-teal text-white px-3 py-1.5 rounded-lg font-mono font-bold">{c.code}</span>
                                                    <span className="text-xs text-gray-400 font-bold">{c.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="text-sm font-bold text-dark-teal px-4 py-2 bg-[#F8FAFB] rounded-xl border border-gray-100 inline-flex items-center gap-2">
                                                    <UserIcon className="w-3 h-3 opacity-30" />
                                                    {c.loginUsername}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="text-3xl font-black text-dark-teal tracking-tighter">
                                                    <span className="text-sm font-bold text-primary mr-1">$</span>
                                                    {c.costPerTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => startEdit(c)}
                                                        className="flex items-center gap-2 px-6 py-3 text-[10px] font-black text-primary border border-primary/20 bg-white rounded-2xl hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95"
                                                    >
                                                        EDITAR
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(c._id)}
                                                        className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {loading && companies.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-40 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin"></div>
                                                    <span className="text-[11px] font-black text-dark-teal uppercase tracking-[0.4em] opacity-30">Sincronizando Directorio</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Companies;