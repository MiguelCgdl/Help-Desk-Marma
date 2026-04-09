// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import apiClient from '../api/client';

const loginSchema = z.object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/login', data);
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-marma-bg bg-gradient-radial from-marma-card/50 to-marma-bg p-4">
            {/* Tarjeta con efecto glass */}
            <div className="w-full max-w-md p-8 space-y-6 bg-marma-card/70 backdrop-blur-md rounded-2xl border border-marma-border shadow-card">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-marma-accent to-marma-accent-dark shadow-glow mb-4" />
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-marma-accent bg-clip-text text-transparent">
                        Bienvenido
                    </h2>
                    <p className="mt-2 text-sm text-marma-text-muted">
                        Ingresa tus credenciales para continuar
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="block text-sm font-medium text-marma-text mb-1.5">
                            Correo electrónico
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text placeholder-marma-text-muted"
                            placeholder="tu@email.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-marma-danger">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-marma-text mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-marma-text-muted hover:text-marma-text"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-marma-danger">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-marma-accent to-marma-accent-dark text-marma-bg font-semibold rounded-lg shadow-glow hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}