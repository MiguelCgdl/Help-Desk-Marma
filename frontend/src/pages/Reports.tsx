// frontend/src/pages/Reports.tsx
import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import apiClient from '../api/client';

export default function Reports() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        apiClient.get(`/reports/monthly?year=${selectedYear}`)
            .then(res => setMonthlyData(res.data));
    }, [selectedYear]);

    const totalFacturado = monthlyData.reduce((sum, item: any) => sum + item.totalCost, 0);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-marma-accent bg-clip-text text-transparent">
                        Reportes
                    </h1>
                    <p className="text-marma-text-muted mt-1">Análisis de facturación y tickets por empresa/mes</p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 bg-marma-card/50 border border-marma-border rounded-lg text-marma-text"
                    >
                        {[2023, 2024, 2025, 2026].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button className="inline-flex items-center px-4 py-2 bg-marma-card/50 border border-marma-border rounded-lg text-marma-text hover:bg-white/5 transition">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-5">
                    <p className="text-sm text-marma-text-muted">Total Facturado {selectedYear}</p>
                    <p className="text-3xl font-bold text-marma-accent mt-1">${totalFacturado.toLocaleString()}</p>
                </div>
                <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-5">
                    <p className="text-sm text-marma-text-muted">Tickets Totales</p>
                    <p className="text-3xl font-bold text-marma-text mt-1">
                        {monthlyData.reduce((sum, item: any) => sum + item.ticketCount, 0)}
                    </p>
                </div>
                <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-5">
                    <p className="text-sm text-marma-text-muted">Promedio por Ticket</p>
                    <p className="text-3xl font-bold text-marma-text mt-1">
                        ${(totalFacturado / monthlyData.reduce((sum, item: any) => sum + item.ticketCount, 0) || 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Gráfico de facturación mensual */}
            <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl p-6">
                <h2 className="text-xl font-semibold text-marma-text mb-4">Facturación Mensual</h2>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="month" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#141A29', border: '1px solid #1E293B', borderRadius: '8px' }}
                            formatter={(value) => [`$${value}`, 'Facturación']}
                        />
                        <Bar dataKey="totalCost" fill="#00E5FF" radius={[4, 4, 0, 0]} name="Facturación" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Tabla de concentrado por empresa/mes */}
            <div className="bg-marma-card/50 backdrop-blur-sm border border-marma-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-marma-border">
                    <h2 className="text-lg font-semibold text-marma-text">Concentrado por Empresa</h2>
                </div>
                <table className="min-w-full divide-y divide-marma-border">
                    <thead className="bg-marma-bg/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase">Empresa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase">Tickets</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase">Costo Promedio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-marma-text-muted uppercase">Total Facturado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-marma-border">
                        {/* Aquí irían los datos agregados por empresa */}
                        <tr className="hover:bg-white/5">
                            <td className="px-6 py-4 text-sm font-medium text-marma-text">Empresa XYZ</td>
                            <td className="px-6 py-4 text-sm text-marma-text-muted">45</td>
                            <td className="px-6 py-4 text-sm text-marma-text-muted">$120.50</td>
                            <td className="px-6 py-4 text-sm font-semibold text-marma-accent">$5,422.50</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}