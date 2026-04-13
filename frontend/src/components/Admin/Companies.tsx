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
                                <div>
                                    <h3 className="text-base font-bold text-[#00272E]">
                                        {editingId ? 'Editar empresa' : 'Nueva empresa'}
                                    </h3>
                                    <p className="text-[11px] text-[#006D65] font-semibold mt-0.5 opacity-60 uppercase tracking-wider">
                                        {editingId ? 'Actualiza los datos del socio' : 'Registra un nuevo socio comercial'}
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
                            {/* ── Datos Generales ── */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Nombre */}
                                <div className="md:col-span-5">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Nombre Comercial
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la empresa"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="marmacore-input py-2 text-xs"
                                        required
                                    />
                                </div>

                                {/* Código ID */}
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Código ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="MARMA"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        className="marmacore-input py-2 text-xs font-mono font-bold tracking-widest text-center"
                                        required
                                    />
                                </div>

                                {/* Tarifa */}
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Tarifa Fija ($)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={form.costPerTicket}
                                        onChange={e => setForm({ ...form, costPerTicket: Number(e.target.value) })}
                                        className="marmacore-input py-2 text-xs"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                {/* Logo */}
                                <div className="md:col-span-8">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        Logo (JPG/PNG o URL)
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="file"
                                            accept=".jpeg, .jpg, .png"
                                            onChange={e => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setLogoFile(e.target.files[0]);
                                                    setForm({ ...form, logoUrl: '' });
                                                }
                                            }}
                                            className="w-full sm:w-1/2 text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 file:text-[#00272E] hover:file:bg-gray-200"
                                        />
                                        <input
                                            type="text"
                                            placeholder="o URL https://..."
                                            value={form.logoUrl}
                                            onChange={e => { setForm({ ...form, logoUrl: e.target.value }); setLogoFile(null); }}
                                            className="marmacore-input py-2 text-xs sm:w-1/2"
                                        />
                                    </div>
                                </div>

                                {/* RFC */}
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                        RFC (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={13}
                                        placeholder="ABC123456T1"
                                        value={form.rfc}
                                        onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                                        className="marmacore-input py-2 text-xs uppercase"
                                    />
                                </div>
                            </div>

                            {/* ── Acceso al sistema ── */}
                            <div className="bg-[#F8FAFB] rounded-xl p-4 border border-gray-50">
                                <p className="text-[9px] font-black text-[#00272E] uppercase tracking-[0.25em] opacity-40 mb-3">
                                    Accesos de Plataforma
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="admin@dominio.com"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            className="marmacore-input py-2 text-xs bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                            Usuario
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="username"
                                            value={form.loginUsername}
                                            onChange={e => setForm({ ...form, loginUsername: e.target.value.trim() })}
                                            className="marmacore-input py-2 text-xs bg-white"
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#00272E] uppercase tracking-widest mb-1 opacity-60">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder={editingId ? '••••••••' : 'Inicial'}
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            className="marmacore-input py-2 text-xs bg-white"
                                            autoComplete="new-password"
                                            required={!editingId}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD5200] text-white font-bold text-xs transition-all duration-200 ${isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#E64A00] hover:shadow-lg hover:shadow-[#FD5200]/20 active:scale-[0.98]'}`}
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

                        {/* Desktop Table View */}
                        <div className="hidden xl:block overflow-x-auto w-full">
                            <table className="w-full text-left whitespace-nowrap min-w-[700px]">
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

                        {/* Mobile Card View */}
                        <div className="xl:hidden divide-y divide-gray-100">
                            {loading && companies.length === 0 && (
                                <div className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-[3px] border-[#FD5200]/20 border-t-[#FD5200] rounded-full animate-spin" />
                                        <span className="text-[11px] font-bold text-[#00272E] uppercase tracking-widest opacity-30">Cargando...</span>
                                    </div>
                                </div>
                            )}
                            {!loading && companies.length === 0 && (
                                <div className="py-16 text-center">
                                    <p className="text-sm text-gray-400 font-medium">No hay empresas registradas aún.</p>
                                </div>
                            )}
                            {companies.map(c => (
                                <div key={c._id} className={`p-4 space-y-4 ${editingId === c._id ? 'bg-orange-50/40' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        {c.logoUrl ? (
                                            <img 
                                                src={c.logoUrl.startsWith('http') ? c.logoUrl : `${BASE_SERVER_URL}/${c.logoUrl}`} 
                                                alt={c.name} 
                                                className="w-12 h-12 object-contain rounded-xl bg-gray-50 p-2 border border-gray-100 shadow-sm" 
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-400">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-bold text-[#00272E] text-base truncate">{c.name}</div>
                                            <span className="text-[10px] bg-[#00272E] text-white px-2 py-0.5 rounded font-mono font-bold inline-block mt-1">
                                                {c.code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                        <div className="bg-[#F8FAFB] p-2.5 rounded-lg border border-gray-50">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Usuario</p>
                                            <p className="text-xs font-bold text-[#00272E] truncate flex items-center gap-1.5">
                                                <UserIcon className="w-3 h-3 opacity-40 shrink-0" />
                                                {c.loginUsername || '—'}
                                            </p>
                                        </div>
                                        <div className="bg-[#F8FAFB] p-2.5 rounded-lg border border-gray-50">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tarifa Fija</p>
                                            <p className="text-sm font-black text-[#FD5200]">
                                                ${c.costPerTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        {c.rfc ? (
                                            <span className="text-[10px] font-bold text-[#006D65] uppercase tracking-wider bg-[#D5EFF2]/30 px-2.5 py-1 rounded-lg">
                                                RFC: {c.rfc}
                                            </span>
                                        ) : <div />}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => startEdit(c)}
                                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FD5200] border border-[#FD5200]/20 bg-white rounded-xl shadow-sm active:scale-95"
                                            >
                                                <PencilIcon className="w-4 h-4" /> Editar
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

export default Companies;