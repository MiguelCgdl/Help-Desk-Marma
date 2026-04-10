import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Company } from '../../types';
import { BASE_SERVER_URL } from '../../config';
import { PlusIcon, TrashIcon, PencilIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        costPerTicket: 0,
        email: '',
        loginUsername: '',
        password: '',
        logoUrl: '',
        rfc: ''
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
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
            password: '',
            logoUrl: c.logoUrl || '',
            rfc: c.rfc || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setLogoFile(null);
        setForm({ name: '', code: '', costPerTicket: 0, email: '', loginUsername: '', password: '', logoUrl: '', rfc: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('code', form.code);
            formData.append('costPerTicket', String(form.costPerTicket));
            if (form.email) formData.append('email', form.email);
            if (form.loginUsername) formData.append('loginUsername', form.loginUsername);
            if (form.password) formData.append('password', form.password);
            if (form.logoUrl && !logoFile) formData.append('logoUrl', form.logoUrl);
            if (form.rfc) formData.append('rfc', form.rfc);
            if (logoFile) formData.append('logo', logoFile);

            if (editingId) {
                await api.put(`/companies/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/companies', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchCompanies();
            cancelEdit();
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al conectar con el servidor';
            alert(`ERROR: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta empresa?')) {
            try {
                await api.delete(`/companies/${id}`);
                fetchCompanies();
            } catch {
                alert('No se pudo eliminar la empresa.');
            }
        }
    };

    return (
        <div className="animate-fade-in pb-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Empresas</h1>
                <p className="text-[#006D65] mt-1 text-sm font-medium">Gestión de socios comerciales y acceso al sistema</p>
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
                                <span className="font-bold text-[#00272E] text-base">
                                    {editingId ? 'Editar empresa' : 'Nueva empresa'}
                                </span>
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

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* ── Datos Generales ── */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                {/* Nombre */}
                                <div className="md:col-span-5">
                                    <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                        Nombre Comercial
                                    </label>
                                    <input
                                            type="text"
                                            placeholder="Nombre de la empresa"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="marmacore-input"
                                            required
                                        />
                                    </div>

                                    {/* Código ID */}
                                    <div className="md:col-span-3">
                                        <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                            Código ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="MARMA"
                                            value={form.code}
                                            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                            className="marmacore-input font-mono font-bold tracking-widest"
                                            required
                                        />
                                    </div>

                                    {/* Tarifa */}
                                    <div className="md:col-span-4">
                                        <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                            Tarifa Fija ($)
                                        </label>
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

                                    {/* Logo */}
                                    <div className="md:col-span-8">
                                        <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                            Logo (JPG/PNG o URL)
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="file"
                                                accept=".jpeg, .jpg, .png"
                                                onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setLogoFile(e.target.files[0]);
                                                        setForm({ ...form, logoUrl: '' });
                                                    }
                                                }}
                                                className="w-full sm:w-1/2 text-[11px] text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-gray-100 file:text-[#00272E] hover:file:bg-gray-200"
                                            />
                                            <input
                                                type="url"
                                                placeholder="o URL https://..."
                                                value={form.logoUrl}
                                                onChange={e => { setForm({ ...form, logoUrl: e.target.value }); setLogoFile(null); }}
                                                className="marmacore-input sm:w-1/2"
                                            />
                                        </div>
                                    </div>

                                    {/* RFC */}
                                    <div className="md:col-span-4">
                                        <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                            RFC (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={13}
                                            placeholder="ABC123456T1"
                                            value={form.rfc}
                                            onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                                            className="marmacore-input uppercase"
                                        />
                                    </div>
                                </div>

                                {/* ── Acceso al sistema ── */}
                                <div className="bg-[#F8FAFB] rounded-xl p-5 border border-gray-100">
                                    <p className="text-[10px] font-black text-[#00272E] uppercase tracking-[0.25em] opacity-40 mb-4">
                                        Accesos de Plataforma
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                                Correo Electrónico
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="admin@dominio.com"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="marmacore-input bg-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                                Usuario
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="username"
                                                value={form.loginUsername}
                                                onChange={e => setForm({ ...form, loginUsername: e.target.value.trim() })}
                                                className="marmacore-input bg-white"
                                                autoComplete="off"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-60">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                placeholder={editingId ? '••••••••' : 'Inicial'}
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                className="marmacore-input bg-white"
                                                autoComplete="new-password"
                                                required={!editingId}
                                            />
                                        </div>
                                    </div>
                                </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FD5200] text-white font-bold text-sm transition-all duration-200 ${isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#E64A00] hover:shadow-lg hover:shadow-[#FD5200]/20 active:scale-[0.98]'}`}
                            >
                                {isSaving
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><PlusIcon className="w-4 h-4" />{editingId ? 'Confirmar cambios' : 'Registrar empresa'}</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Directory Table ── */}
                <div className="w-full">
                    <div className="marmacore-table-container">
                        {/* Table header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div>
                                <h3 className="text-base font-bold text-[#00272E]">Directorio</h3>
                                <p className="text-[11px] text-[#006D65] font-semibold mt-0.5 opacity-60 uppercase tracking-wider">
                                    Empresas activas
                                </p>
                            </div>
                            <span className="bg-[#00272E] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg tracking-wider">
                                {companies.length} TOTAL
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="marmacore-table-head">
                                        <th className="px-6 py-3">Empresa</th>
                                        <th className="px-6 py-3">Usuario y RFC</th>
                                        <th className="px-6 py-3">Tarifa</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading && companies.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-[3px] border-[#FD5200]/20 border-t-[#FD5200] rounded-full animate-spin" />
                                                    <span className="text-[11px] font-bold text-[#00272E] uppercase tracking-widest opacity-30">Cargando...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && companies.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-16 text-center">
                                                <p className="text-sm text-gray-400 font-medium">No hay empresas registradas aún.</p>
                                            </td>
                                        </tr>
                                    )}
                                    {companies.map(c => (
                                        <tr
                                            key={c._id}
                                            className={`group transition-colors hover:bg-gray-50/80 ${editingId === c._id ? 'bg-orange-50/40' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {c.logoUrl ? (
                                                        <img 
                                                            src={c.logoUrl.startsWith('http') ? c.logoUrl : `${BASE_SERVER_URL}/${c.logoUrl}`} 
                                                            alt={c.name} 
                                                            className="w-8 h-8 object-contain rounded bg-gray-50 p-1 border border-gray-100" 
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                                                            {c.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-[#00272E] text-sm group-hover:text-[#FD5200] transition-colors">
                                                            {c.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] bg-[#00272E] text-white px-2 py-0.5 rounded font-mono font-bold">
                                                                {c.code}
                                                            </span>
                                                            {c.email && (
                                                                <span className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                                                                    {c.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="inline-flex items-center gap-1.5 bg-[#F8FAFB] border border-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#00272E] w-max">
                                                        <UserIcon className="w-3 h-3 opacity-30" />
                                                        {c.loginUsername || '—'}
                                                    </div>
                                                    {c.rfc && (
                                                        <div className="text-[10px] font-bold text-[#006D65] uppercase tracking-wider bg-[#D5EFF2]/30 px-2 py-0.5 rounded w-max">
                                                            RFC: {c.rfc}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xl font-black text-[#00272E] tracking-tight">
                                                    <span className="text-xs font-bold text-[#FD5200] mr-0.5">$</span>
                                                    {c.costPerTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(c)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#FD5200] border border-[#FD5200]/20 bg-white rounded-lg hover:bg-[#FD5200] hover:text-white hover:border-[#FD5200] transition-all active:scale-95"
                                                    >
                                                        <PencilIcon className="w-3.5 h-3.5" /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(c._id)}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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

export default Companies;