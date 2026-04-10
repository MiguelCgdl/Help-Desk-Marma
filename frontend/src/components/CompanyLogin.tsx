import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import { motion } from 'framer-motion';
import { LockClosedIcon, UserIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const CompanyLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [logo, setLogo] = useState<{name: string, url: string} | null>(null);
    const navigate = useNavigate();

    const handleUsernameBlur = async () => {
        if (!username) {
            setLogo(null);
            return;
        }
        try {
            const res = await api.get(`/companies/logo?username=${username}`);
            if (res.data && res.data.name) {
                let finalLogo = res.data.logoUrl;
                if (finalLogo && !finalLogo.startsWith('http')) finalLogo = `http://localhost:5001/${finalLogo}`;
                setLogo({ name: res.data.name, url: finalLogo });
            } else {
                setLogo(null);
            }
        } catch { setLogo(null); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/company-login', { username, password });
            localStorage.setItem('companyToken', res.data.token);
            localStorage.setItem('companyProfile', JSON.stringify(res.data.company));
            navigate('/empresa/incidente', { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (!err.response) {
                    setError('No hay conexión con el servidor. Verifica que el backend esté en ejecución.');
                } else if (err.response.status === 401) {
                    setError('Usuario o contraseña incorrectos.');
                } else {
                    setError('No se pudo iniciar sesión. Intenta de nuevo.');
                }
            } else {
                setError('Error inesperado.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4 font-jakarta">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#006D65] hover:text-[#00272E] mb-8"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Volver al inicio
                </Link>

                <div className="text-center mb-10">
                    <img
                        src={logo?.url || "https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png"}
                        alt={logo?.name || "Marmacore"}
                        className="h-14 mx-auto mb-6 object-contain transition-all duration-300"
                    />
                    <h2 className="text-3xl font-extrabold text-[#00272E] tracking-tight">
                        {logo ? `Hola, ${logo.name}` : 'Acceso empresa'}
                    </h2>
                    <p className="text-[#006D65] font-medium mt-3">Usa el usuario y contraseña que te asignó el administrador.</p>
                </div>

                <div className="marmacore-card p-10 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase tracking-widest mb-2">Usuario</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    className="marmacore-input !pl-14"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={handleUsernameBlur}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#006D65] uppercase tracking-widest mb-2">Contraseña</label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    className="marmacore-input !pl-14"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="marmacore-button-primary w-full py-4 text-lg group">
                            {loading ? (
                                'Entrando...'
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Entrar
                                    <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default CompanyLogin;
