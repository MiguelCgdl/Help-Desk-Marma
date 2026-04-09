import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Company } from '../../types';
import { BuildingOfficeIcon, TagIcon, CurrencyDollarIcon, PlusIcon, TrashIcon, PencilIcon, EnvelopeIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [form, setForm] = useState({
        name: '',
        code: '',
        costPerTicket: 0,
        email: '',
        loginUsername: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/companies', form);
            fetchCompanies();
            setForm({ name: '', code: '', costPerTicket: 0, email: '', loginUsername: '', password: '' });
        } catch (err) {
            alert('Error al guardar empresa');
        }
    };

    const handleDelete = async (id: string) => { 
        if(window.confirm('¿Eliminar esta empresa?')) {
            await api.delete(`/companies/${id}`); 
            fetchCompanies(); 
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#00272E]">Gestión de Empresas</h1>
                    <p className="text-[#006D65] mt-1">
                        Alta de empresas con usuario y contraseña para el portal de incidentes; código para numeración de tickets.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Card */}
                <div className="marmacore-card p-8 h-fit">
                    <h3 className="text-lg font-bold text-[#00272E] mb-6 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-[#FD5200]" />
                        Nueva Empresa
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Nombre Comercial</label>
                            <div className="relative">
                                <BuildingOfficeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Ej. Marmacore Solutions" 
                                    value={form.name} 
                                    onChange={e => setForm({ ...form, name: e.target.value })} 
                                    className="marmacore-input pl-10" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Código/Prefijo</label>
                            <div className="relative">
                                <TagIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Ej. MARMA" 
                                    value={form.code} 
                                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                                    className="marmacore-input pl-10" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Costo por Ticket (MXN)</label>
                            <div className="relative">
                                <CurrencyDollarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={form.costPerTicket} 
                                    onChange={e => setForm({ ...form, costPerTicket: Number(e.target.value) })} 
                                    className="marmacore-input pl-10" 
                                    step="0.01"
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Correo electrónico</label>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="contacto@empresa.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="marmacore-input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Usuario (acceso empresa)</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ej. acme_soporte"
                                    value={form.loginUsername}
                                    onChange={(e) => setForm({ ...form, loginUsername: e.target.value.trim() })}
                                    className="marmacore-input pl-10"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase mb-2">Contraseña (acceso empresa)</label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="Contraseña inicial"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="marmacore-input pl-10"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="marmacore-button-primary w-full py-4">
                            Registrar Empresa
                        </button>
                    </form>
                </div>

                {/* List Table */}
                <div className="lg:col-span-2 marmacore-card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8FAFB] text-xs font-bold text-[#006D65] uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Empresa</th>
                                <th className="px-8 py-5">Usuario</th>
                                <th className="px-8 py-5">Correo</th>
                                <th className="px-8 py-5">Código</th>
                                <th className="px-8 py-5">Costo Unit.</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic-last">
                            {companies.map(c => (
                                <tr key={c._id} className="hover:bg-[#D5EFF2]/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-[#00272E]">{c.name}</div>
                                        <div className="text-[10px] text-[#006D65] uppercase font-bold mt-1">Socio Activo</div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-mono text-gray-700">
                                        {c.loginUsername ?? '—'}
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-600 max-w-[180px] truncate" title={c.email}>
                                        {c.email ?? '—'}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="bg-[#00272E] text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
                                            {c.code}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 font-extrabold text-[#FD5200]">
                                        ${c.costPerTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[#00272E]">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(c._id)}
                                                className="p-2 text-gray-400 hover:text-red-500"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {loading && <tr><td colSpan={6} className="p-10 text-center text-gray-400">Actualizando lista...</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Companies;