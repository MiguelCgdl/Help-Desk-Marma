import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import companyApi from '../services/companyApi';
import type { Company, Problem } from '../types';
import { motion } from 'framer-motion';
import { TicketIcon, CheckCircleIcon, PhotoIcon, BuildingOffice2Icon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export type TicketFormProps = {
    /** Si viene del portal empresa: empresa fija y no editable */
    lockedCompany?: { _id: string; name: string } | null;
    /** Usar token de empresa en las peticiones (crear ticket) */
    useCompanyAuth?: boolean;
};

const TicketForm: React.FC<TicketFormProps> = ({ lockedCompany = null, useCompanyAuth = false }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedProblem, setSelectedProblem] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [ticketNumber, setTicketNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
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
            } catch (err) {
                setError('Error al cargar datos iniciales. Verifique su conexión.');
            }
        };
        fetchData();
    }, [lockedCompany?._id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                setImage(file);
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                alert('Solo se permiten imágenes JPG/JPEG');
            }
        }
    };

    const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: '' });
    const [captchaInput, setCaptchaInput] = useState('');

    const generateCaptcha = () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ a, b, answer: (a + b).toString() });
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (captchaInput !== captcha.answer) {
            setError('La respuesta de seguridad es incorrecta.');
            generateCaptcha();
            setCaptchaInput('');
            return;
        }

        setLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('companyId', selectedCompany);
        formData.append('problemId', selectedProblem);
        formData.append('description', description);
        if (image) formData.append('image', image);

        try {
            const http = useCompanyAuth ? companyApi : api;
            const res = await http.post('/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTicketNumber(res.data.ticketNumber);
            setDescription('');
            setImage(null);
            setPreview(null);
            if (!lockedCompany) setSelectedCompany('');
            setSelectedProblem('');
            setCaptchaInput('');
            generateCaptcha();
        } catch (err) {
            setError('Error al crear el ticket. Por favor intente de nuevo.');
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    if (ticketNumber) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="marmacore-card p-10 max-w-md w-full text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircleIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold text-[#00272E]">¡Ticket Generado!</h2>
                        <p className="text-[#006D65]">Su solicitud ha sido registrada con éxito.</p>
                    </div>
                    <div className="bg-[#D5EFF2] p-4 rounded-xl border border-[#006D65]/20">
                        <p className="text-sm text-[#006D65] uppercase font-bold tracking-wider">Número de Ticket</p>
                        <p className="text-2xl font-mono text-[#00272E] font-bold">{ticketNumber}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setTicketNumber('')} className="marmacore-button-primary w-full">
                            Generar otro ticket
                        </button>
                        {useCompanyAuth && (
                            <Link
                                to="/empresa/tickets"
                                className="block text-center py-3 text-sm font-bold text-[#006D65] hover:text-[#00272E]"
                            >
                                Ver mis tickets
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-jakarta">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="animate-fade-in">
                        <img src="https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png" alt="Marmacore" className="h-14 mb-8" />
                        <h1 className="text-4xl font-extrabold text-dark-teal">
                            {lockedCompany ? 'Levantar incidente' : 'Mesa de Ayuda'}
                        </h1>
                        <p className="text-medium-teal text-lg mt-2">
                            {lockedCompany
                                ? 'Describe el problema y adjunta evidencia si aplica. Tu empresa ya está identificada en la sesión.'
                                : 'Reporta problemas técnicos y solicita asistencia de manera rápida y eficiente.'}
                        </p>
                    </div>
                    
                    <div className="marmacore-card p-6 bg-dark-teal text-white space-y-4">
                        <div className="flex items-center gap-4">
                            <TicketIcon className="w-8 h-8 text-primary" />
                            <div>
                                <h3 className="font-bold">Seguimiento Real</h3>
                                <p className="text-sm text-gray-400">Cada reporte genera un número único basado en tu empresa.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <PhotoIcon className="w-8 h-8 text-primary" />
                            <div>
                                <h3 className="font-bold">Evidencia Visual</h3>
                                <p className="text-sm text-gray-400">Adjunta fotos para ayudarnos a entender mejor el problema.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <LockClosedIcon className="w-8 h-8 text-primary" />
                            <div>
                                <h3 className="font-bold">Seguridad de Datos</h3>
                                <p className="text-sm text-gray-400">Verificamos tu identidad con un sistema de seguridad anti-bots.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="marmacore-card p-8 bg-white"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-dark-teal mb-2 flex items-center gap-2">
                                    <BuildingOffice2Icon className="w-4 h-4" /> Empresa
                                </label>
                                {lockedCompany ? (
                                    <div className="marmacore-input bg-gray-50 text-gray-700 cursor-not-allowed border-gray-200">
                                        {lockedCompany.name}
                                    </div>
                                ) : (
                                    <select
                                        value={selectedCompany}
                                        onChange={(e) => setSelectedCompany(e.target.value)}
                                        className="marmacore-input"
                                        required
                                    >
                                        <option value="">Selecciona tu empresa</option>
                                        {companies.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-teal mb-2">Problema</label>
                                <select 
                                    value={selectedProblem} 
                                    onChange={e => setSelectedProblem(e.target.value)} 
                                    className="marmacore-input"
                                    required
                                >
                                    <option value="">¿Qué está sucediendo?</option>
                                    {problems.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-teal mb-2">
                                    Descripción <span className="text-xs font-normal text-medium-teal">({800 - description.length} caracteres restantes)</span>
                                </label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value.slice(0, 800))} 
                                    className="marmacore-input min-h-[120px]" 
                                    placeholder="Describe el problema detalladamente..."
                                    maxLength={800} 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-teal mb-2">Imagen de Referencia</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/jpg" 
                                        onChange={handleImageChange} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`p-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-3 ${preview ? 'border-primary bg-primary/5' : 'border-gray-200 group-hover:border-primary/50'}`}>
                                        {preview ? (
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <p className="text-white text-sm font-bold">Cambiar imagen</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-10 h-10 text-gray-300 group-hover:text-primary transition-colors" />
                                                <div className="text-center">
                                                    <p className="text-medium-teal font-semibold">Haz clic o arrastra una imagen</p>
                                                    <p className="text-xs text-gray-400 mt-1">Solo formato JPG/JPEG (Máx 5MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-accent-teal/30 p-4 rounded-xl border border-accent-teal/50">
                                <label className="block text-sm font-bold text-dark-teal mb-3">Seguridad Anti-Bots</label>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white px-4 py-2 rounded-lg font-mono font-bold text-lg text-dark-teal border border-accent-teal">
                                        ¿Cuánto es {captcha.a} + {captcha.b}?
                                    </div>
                                    <input 
                                        type="number" 
                                        value={captchaInput}
                                        onChange={(e) => setCaptchaInput(e.target.value)}
                                        className="marmacore-input max-w-[100px] text-center"
                                        placeholder="?"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-medium-teal mt-2 flex items-center gap-1">
                                    <LockClosedIcon className="w-3 h-3" /> Resuelve para confirmar que eres humano
                                </p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`marmacore-button-primary w-full py-4 text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Enviando Ticket...
                                    </span>
                                ) : 'Enviar Reporte'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
            
            <footer className="mt-12 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Marmacore Solutions. Todos los derechos reservados.
            </footer>
        </div>
    );
};

export default TicketForm;