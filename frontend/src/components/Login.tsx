import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import { motion } from 'framer-motion';
import { LockClosedIcon, UserIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            navigate('/admin');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const msg = (err.response?.data as { message?: string })?.message;
                if (!err.response) {
                    setError(
                        'No hay conexión con el servidor (puerto 5001). Ejecuta en la raíz del proyecto: npm run dev (frontend + backend) o npm run dev:backend.'
                    );
                } else if (status === 503) {
                    setError(msg || 'Base de datos no disponible. Espera unos segundos e intenta de nuevo.');
                } else if (status === 401) {
                    setError('Credenciales inválidas. Por favor intente de nuevo.');
                } else {
                    setError(msg || 'No se pudo iniciar sesión. Intente de nuevo.');
                }
            } else {
                setError('Error inesperado. Intente de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4 font-jakarta">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-medium-teal hover:text-dark-teal mb-8"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Volver al inicio
                </Link>

                <div className="text-center mb-10">
                    <img src="https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png" alt="Marmacore" className="h-14 mx-auto mb-6" />
                    <h2 className="text-3xl font-extrabold text-dark-teal tracking-tight">Acceso Administrador</h2>
                    <p className="text-medium-teal font-medium mt-3">Panel de control de Tickets y Facturación</p>
                </div>

                <div className="marmacore-card p-10 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-medium-teal uppercase tracking-widest mb-2">Usuario</label>
                            <div className="relative">
                                <UserIcon className="marmacore-icon-left" />
                                <input 
                                    type="text" 
                                    className="marmacore-input marmacore-input-icon"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-medium-teal uppercase tracking-widest mb-2">Contraseña</label>
                            <div className="relative">
                                <LockClosedIcon className="marmacore-icon-left" />
                                <input 
                                    type="password" 
                                    className="marmacore-input marmacore-input-icon"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="marmacore-button-primary w-full py-4 text-lg group"
                        >
                            {loading ? 'Validando...' : (
                                <span className="flex items-center justify-center gap-2">
                                    Iniciar Sesión
                                    <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="mt-8 text-center text-gray-400 text-xs">
                    ¿Olvidaste tu acceso? Contacta al soporte de <span className="text-dark-teal font-bold uppercase">Marmacore</span>.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;