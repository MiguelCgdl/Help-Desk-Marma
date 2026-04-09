import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BuildingOffice2Icon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const HomeLanding: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFB] flex flex-col items-center justify-center p-6 font-jakarta">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg w-full text-center space-y-10"
            >
                <img
                    src="https://marmacore.com/wp-content/uploads/2025/02/mmcore-logo-main@4x.png"
                    alt="Marmacore"
                    className="h-16 mx-auto"
                />
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#00272E] tracking-tight">Mesa de ayuda</h1>
                    <p className="text-[#006D65] mt-3 font-medium">
                        Elige cómo deseas continuar: acceso para empresas registradas o reporte público.
                    </p>
                </div>

                <div className="grid gap-4">
                    <Link
                        to="/empresa/login"
                        className="marmacore-card p-6 flex items-center gap-4 text-left hover:border-[#006D65]/40 transition-colors group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-[#D5EFF2] flex items-center justify-center shrink-0 group-hover:bg-[#006D65]/10">
                            <BuildingOffice2Icon className="w-8 h-8 text-[#00272E]" />
                        </div>
                        <div>
                            <p className="font-extrabold text-[#00272E] text-lg">Acceso empresa</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Inicia sesión con el usuario de tu empresa para levantar incidentes y ver tus tickets.
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/reportar"
                        className="marmacore-card p-6 flex items-center gap-4 text-left hover:border-[#006D65]/40 transition-colors group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-[#FFF4ED] flex items-center justify-center shrink-0 group-hover:bg-[#FD5200]/10">
                            <GlobeAltIcon className="w-8 h-8 text-[#FD5200]" />
                        </div>
                        <div>
                            <p className="font-extrabold text-[#00272E] text-lg">Reporte público</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Genera un ticket eligiendo tu empresa sin iniciar sesión.
                            </p>
                        </div>
                    </Link>
                </div>

                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#006D65] transition-colors"
                >
                    <LockClosedIcon className="w-4 h-4" />
                    Panel de administración
                </Link>
            </motion.div>
        </div>
    );
};

export default HomeLanding;
