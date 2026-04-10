// frontend/src/pages/TicketForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../api/client';

const ticketSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    company: z.string().min(1, 'Selecciona una empresa'),
    priority: z.enum(['low', 'medium', 'high']),
    cost: z.number().min(0, 'El costo no puede ser negativo'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function TicketForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<TicketFormData>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            priority: 'medium',
            cost: 0,
        }
    });

    useEffect(() => {
        // Cargar empresas para el select
        apiClient.get('/companies').then(res => setCompanies(res.data));

        if (id) {
            // Cargar datos del ticket para edición
            apiClient.get(`/tickets/${id}`).then(res => {
                const ticket = res.data;
                reset({
                    title: ticket.title,
                    description: ticket.description,
                    company: ticket.company._id,
                    priority: ticket.priority,
                    cost: ticket.cost,
                });
            });
        }
    }, [id, reset]);

    const onSubmit = async (data: TicketFormData) => {
        setIsLoading(true);
        try {
            if (id) {
                await apiClient.put(`/tickets/${id}`, data);
            } else {
                await apiClient.post('/tickets', data);
            }
            navigate('/tickets');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-marma-accent bg-clip-text text-transparent">
                    {id ? 'Editar Ticket' : 'Nuevo Ticket'}
                </h1>
                <p className="text-marma-text-muted mt-1">
                    {id ? 'Modifica los detalles del ticket' : 'Crea un nuevo ticket de soporte'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-6 space-y-6 shadow-card">
                <div>
                    <label className="block text-sm font-medium text-marma-text mb-1.5">Título</label>
                    <input
                        {...register('title')}
                        className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text"
                        placeholder="Ej: Error al generar reporte"
                    />
                    {errors.title && <p className="mt-1 text-xs text-marma-danger">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-marma-text mb-1.5">Descripción</label>
                    <textarea
                        {...register('description')}
                        rows={5}
                        className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text"
                        placeholder="Describe el problema detalladamente..."
                    />
                    {errors.description && <p className="mt-1 text-xs text-marma-danger">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-marma-text mb-1.5">Empresa</label>
                        <select
                            {...register('company')}
                            className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text"
                        >
                            <option value="">Seleccionar empresa</option>
                            {companies.map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.company && <p className="mt-1 text-xs text-marma-danger">{errors.company.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-marma-text mb-1.5">Prioridad</label>
                        <select
                            {...register('priority')}
                            className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text"
                        >
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-marma-text mb-1.5">Costo de la consulta ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('cost', { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 bg-marma-bg/50 border border-marma-border rounded-lg focus:ring-2 focus:ring-marma-accent/50 focus:border-marma-accent outline-none transition text-marma-text"
                    />
                    {errors.cost && <p className="mt-1 text-xs text-marma-danger">{errors.cost.message}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-marma-border">
                    <button
                        type="button"
                        onClick={() => navigate('/tickets')}
                        className="px-5 py-2.5 border border-marma-border rounded-lg text-marma-text-muted hover:bg-white/5 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-gradient-to-r from-marma-accent to-marma-accent-dark text-marma-bg font-medium rounded-lg shadow-glow hover:shadow-lg transition disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : (id ? 'Actualizar' : 'Crear')}
                    </button>
                </div>
            </form>
        </div>
    );
}