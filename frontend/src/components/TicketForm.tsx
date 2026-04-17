import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import companyApi from '../services/companyApi';
import type { Problem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TicketIcon, CheckCircleIcon, PhotoIcon, BuildingOffice2Icon,
    ExclamationTriangleIcon, LockClosedIcon, PlusIcon, TrashIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export type TicketFormProps = {
    lockedCompany?: { _id: string; name: string } | null;
    useCompanyAuth?: boolean;
    isModal?: boolean;
    onTicketCreated?: () => void;
    editingTicket?: any;
};

type ProblemSelection = {
    id: string;              // unique UI key
    problemId: string;       // ObjectId or '' for Otros
    title: string;           // display label
};

const TicketForm: React.FC<TicketFormProps> = ({ 
    lockedCompany = null, 
    useCompanyAuth = false,
    isModal = false,
    onTicketCreated,
    editingTicket = null
}) => {
    const [problems, setProblems]         = useState<Problem[]>([]);
    const [selectedCompany, setSelectedCompany] = useState(editingTicket?.companyId?._id || editingTicket?.companyId || '');
    const [companies, setCompanies]       = useState<{ _id: string; name: string }[]>([]);
    const [description, setDescription]   = useState(editingTicket?.description || '');
    const [image, setImage]               = useState<File | null>(null);
    const [preview, setPreview]           = useState<string | null>(editingTicket?.imagePath ? `${BASE_SERVER_URL}/${editingTicket.imagePath}` : null);
    const [ticketNumber, setTicketNumber] = useState('');
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [success, setSuccess]           = useState(false);

    // Multi-problem selection
    const [selectedProblems, setSelectedProblems] = useState<ProblemSelection[]>(
        editingTicket?.problems?.map((p: any) => ({
            id: crypto.randomUUID(),
            problemId: p.problemId?._id || p.problemId || '__otros__',
            title: p.title
        })) || [{ id: crypto.randomUUID(), problemId: '', title: '' }]
    );

    // Captcha
    const [captcha, setCaptcha]           = useState({ a: 0, b: 0, answer: '' });
    const [solvedAt, setSolvedAt]         = useState(editingTicket?.solvedAt || null);
    const [archived, setArchived]         = useState(editingTicket?.archived || false);
    const [captchaInput, setCaptchaInput] = useState('');

    const generateCaptcha = () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ a, b, answer: (a + b).toString() });
    };

    useEffect(() => {
        generateCaptcha();
        const fetchData = async () => {
            try {
                if (lockedCompany) {
                    setSelectedCompany(lockedCompany._id);
                    const probRes = await api.get('/problems');
                    setProblems(probRes.data.filter((p: Problem) => p.active));
                } else {
                    const [compRes, probRes] = await Promise.all([api.get('/companies'), api.get('/problems')]);
                    setCompanies(compRes.data);
                    setProblems(probRes.data.filter((p: Problem) => p.active));
                }
            } catch {
                setError('Error al cargar datos. Verifique su conexión.');
            }
        };
        fetchData();
    }, [lockedCompany?._id]);

    // ── Problem list helpers ─────────────────────────────────────────────────
    const addProblem = () =>
        setSelectedProblems(prev => [...prev, { id: crypto.randomUUID(), problemId: '', title: '' }]);

    const removeProblem = (id: string) =>
        setSelectedProblems(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev);

    const updateProblem = (id: string, problemId: string) => {
        const found = problems.find(p => p._id === problemId);
        setSelectedProblems(prev =>
            prev.map(p => p.id === id
                ? { ...p, problemId, title: found ? found.title : (problemId === '__otros__' ? 'Otros / Sin categoría' : '') }
                : p
            )
        );
    };

    // ── Image ────────────────────────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            alert('Solo se permiten imágenes JPG/JPEG');
        }
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (captchaInput !== captcha.answer) {
            setError('La respuesta de seguridad es incorrecta.');
            generateCaptcha();
            setCaptchaInput('');
            return;
        }

        const incomplete = selectedProblems.some(p => !p.problemId);
        if (incomplete) {
            setError('Selecciona un tipo de problema para cada fila.');
            return;
        }

        setLoading(true);
        setError('');

        const problemsPayload = selectedProblems.map(p => ({
            problemId: p.problemId === '__otros__' ? null : p.problemId,
            title: p.title
        }));

        const formData = new FormData();
        formData.append('companyId', selectedCompany);
        formData.append('problems', JSON.stringify(problemsPayload));
        formData.append('description', description);
        formData.append('archived', String(archived));
        if (image) formData.append('image', image);

        try {
            const http = useCompanyAuth ? companyApi : api;
            let res;
            if (editingTicket) {
                res = await http.patch(`/tickets/${editingTicket._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await http.post('/tickets', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setTicketNumber(res.data.ticketNumber || editingTicket?.ticketNumber);
            setSuccess(true);
            if (!editingTicket) {
                setDescription('');
                setImage(null);
                setPreview(null);
                setSelectedProblems([{ id: crypto.randomUUID(), problemId: '', title: '' }]);
                if (!lockedCompany) setSelectedCompany('');
            }
            setCaptchaInput('');
            generateCaptcha();
            if (onTicketCreated) onTicketCreated();
        } catch {
            setError('Error al crear el ticket. Por favor intente de nuevo.');
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ───────────────────────────────────────────────────────
    if (success) {
        return (
            <div className={`flex items-center justify-center ${isModal ? 'p-6' : 'p-10'} bg-white min-h-[400px]`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-10 max-w-md w-full text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircleIcon className="w-9 h-9 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#00272E]">
                            {editingTicket ? '¡Ticket Actualizado!' : '¡Ticket Generado!'}
                        </h2>
                        <p className="text-[#006D65] text-sm mt-1">Su solicitud ha sido registrada con éxito.</p>
                    </div>
                    <div className="bg-[#D5EFF2] p-4 rounded-xl border border-[#006D65]/20">
                        <p className="text-xs text-[#006D65] uppercase font-bold tracking-wider">Número de Ticket</p>
                        <p className="text-2xl font-mono text-[#00272E] font-bold mt-1">{ticketNumber}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                setTicketNumber('');
                                setSuccess(false);
                            }}
                            className="w-full py-3 rounded-xl bg-[#FD5200] text-white font-bold text-sm hover:bg-[#E64A00] transition-colors"
                        >
                            Generar otro ticket
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Main form ────────────────────────────────────────────────────────────
    return (
        <div className={`${isModal ? 'bg-white p-0 h-full' : 'bg-gray-50 py-10 px-4'} transition-all duration-300`}>
            <div className={`${isModal ? 'h-full' : 'max-w-5xl mx-auto'}`}>
                <div className={`grid grid-cols-1 lg:grid-cols-5 ${isModal ? 'gap-0 h-full' : 'gap-8'} items-stretch`}>
                    {/* Left panel */}
                    <div className={`lg:col-span-2 space-y-6 ${isModal ? 'bg-[#F8FAFB] p-8 lg:px-10 lg:py-12 border-r border-gray-100 h-full flex flex-col justify-center' : ''}`}>
                        <div>
                            {!isModal && (
                                <img
                                    src="https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png"
                                    alt="Marmacore"
                                    className="h-12 mb-6"
                                />
                            )}
                            {isModal && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FD5200]/10 rounded-lg text-[#FD5200] text-[10px] font-black uppercase tracking-widest mb-4">
                                    Admin Support
                                </div>
                            )}
                            <h1 className={`${isModal ? 'text-4xl' : 'text-3xl'} font-black text-[#00272E] leading-tight`}>
                                {editingTicket ? 'Editar Ticket' : (lockedCompany ? 'Levantar incidente' : 'Mesa de Ayuda')}
                            </h1>
                            <p className="text-[#006D65] text-sm mt-3 leading-relaxed opacity-80">
                                {editingTicket 
                                    ? `Editando los detalles del ticket ${editingTicket.ticketNumber}.`
                                    : (lockedCompany
                                        ? 'Describe el problema y adjunta evidencia. La empresa ya está seleccionada.'
                                        : 'Reporta problemas técnicos y solicita asistencia de manera rápida y eficiente.')}
                            </p>
                        </div>

                        <div className={`bg-[#00272E] rounded-3xl ${isModal ? 'p-5' : 'p-6'} shadow-xl shadow-[#00272E]/10 ${isModal ? 'space-y-4' : 'space-y-5'}`}>
                            <p className="text-[10px] font-black text-[#FD5200] uppercase tracking-[0.2em] mb-2">Información de Soporte</p>
                            {[
                                { icon: TicketIcon, title: 'Seguimiento Real', desc: 'Folios automáticos por empresa.' },
                                { icon: ExclamationCircleIcon, title: 'Múltiples Problemas', desc: 'Varios temas en un solo reporte.' },
                                { icon: LockClosedIcon, title: 'Sistema Seguro', desc: 'Integración directa con el panel.' }
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 group">
                                    <div className={`p-2 bg-white/5 rounded-xl group-hover:bg-[#FD5200]/20 transition-colors`}>
                                        <Icon className={`${isModal ? 'w-4 h-4' : 'w-5 h-5'} text-[#FD5200] flex-shrink-0`} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm tracking-tight">{title}</p>
                                        <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className={`lg:col-span-3 ${isModal ? 'p-6 lg:px-10 lg:py-8' : ''}`}>
                        <motion.div
                            initial={isModal ? false : { opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${isModal ? '' : 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6'}`}
                        >
                            <form onSubmit={handleSubmit} className={`${isModal ? 'space-y-4' : 'space-y-6'}`}>
                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 border border-red-100 text-sm">
                                        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Empresa */}
                                {!lockedCompany ? (
                                    <div className="relative group">
                                        <BuildingOffice2Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FD5200] transition-colors pointer-events-none" />
                                        <select
                                            value={selectedCompany}
                                            onChange={e => setSelectedCompany(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FD5200] focus:bg-white text-sm font-medium transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Selecciona tu empresa...</option>
                                            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-[#00272E] text-sm font-bold">
                                        <BuildingOffice2Icon className="w-5 h-5 text-[#FD5200]" />
                                        {lockedCompany.name}
                                    </div>
                                )}

                                {/* Problemas */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-[#00272E] uppercase tracking-widest opacity-70">
                                            Tipo(s) de Problema
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addProblem}
                                            className="flex items-center gap-1 text-[11px] font-bold text-[#FD5200] hover:text-[#E64A00] transition-colors"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" /> Agregar otro
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {selectedProblems.map((sp, idx) => (
                                                <motion.div
                                                    key={sp.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    <span className="text-[10px] text-gray-400 font-black w-4 text-center flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="relative flex-1 group">
                                                        <select
                                                            value={sp.problemId}
                                                            onChange={e => updateProblem(sp.id, e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FD5200] focus:bg-white text-sm font-medium transition-all appearance-none"
                                                            required
                                                        >
                                                            <option value="">¿Qué está sucediendo?</option>
                                                            {problems.map(p => (
                                                                <option key={p._id} value={p._id}>
                                                                    {p.mainCategory} &gt; {p.subcategory} &gt; {p.specificType || p.title}
                                                                </option>
                                                            ))}
                                                            <option value="__otros__">Otros / No está en la lista</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                    {selectedProblems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProblem(sp.id)}
                                                            className="p-3 text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="text-xs font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-70 block">
                                        Descripción{' '}
                                        <span className="normal-case font-normal opacity-60">
                                            ({800 - description.length} caracteres restantes)
                                        </span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value.slice(0, 800))}
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#FD5200] focus:bg-white text-sm font-medium transition-all min-h-[140px] resize-none leading-relaxed"
                                        placeholder="Describe el problema detalladamente..."
                                        maxLength={800}
                                        required
                                    />
                                </div>

                                {/* Imagen */}
                                <div>
                                    <label className="text-xs font-bold text-[#00272E] uppercase tracking-widest mb-1.5 opacity-70 block">
                                        Imagen de Referencia <span className="normal-case font-normal opacity-60">(Opcional)</span>
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`p-5 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 ${preview ? 'border-[#FD5200] bg-orange-50/30' : 'border-gray-200 group-hover:border-[#FD5200]/40'}`}>
                                            {preview ? (
                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <p className="text-white text-xs font-bold">Cambiar imagen</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <PhotoIcon className="w-8 h-8 text-gray-300 group-hover:text-[#FD5200] transition-colors" />
                                                    <p className="text-sm text-gray-400">Haz clic o arrastra una imagen JPG</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Captcha */}
                                <div className={`bg-[#D5EFF2]/40 ${isModal ? 'p-3' : 'p-4'} rounded-xl border border-[#D5EFF2]`}>
                                    <label className="text-xs font-bold text-[#00272E] uppercase tracking-widest mb-2 block opacity-70">
                                        Verificación de Seguridad
                                    </label>
                                    <div className="flex items-stretch gap-3">
                                        <div className="bg-white px-6 flex items-center justify-center rounded-xl font-mono font-bold text-base text-[#00272E] border border-[#D5EFF2] whitespace-nowrap shadow-sm min-w-[140px]">
                                            {captcha.a} + {captcha.b} = ?
                                        </div>
                                        <div className="relative flex-1 group">
                                            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FD5200] transition-colors" />
                                            <input
                                                type="text"
                                                value={captchaInput}
                                                onChange={e => setCaptchaInput(e.target.value)}
                                                placeholder="Respuesta"
                                                className="w-full pl-12 pr-4 py-4 bg-white border border-[#D5EFF2] rounded-xl outline-none focus:border-[#FD5200] text-sm font-bold transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#FD5200] text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#FD5200]/25 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#E64A00] hover:-translate-y-0.5 active:translate-y-0'}`}
                                    >
                                        {loading
                                            ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
                                            : <><TicketIcon className="w-5 h-5" /> Enviar Reporte de Incidente</>
                                        }
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketForm;