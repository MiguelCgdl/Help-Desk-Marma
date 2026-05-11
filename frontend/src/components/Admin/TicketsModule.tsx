import React, { useState } from 'react';
import { 
    TicketIcon, 
    ChartBarIcon, 
    DocumentTextIcon,
    CurrencyDollarIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import TicketsList from './TicketsList';
import Reports from './Reports';
import Billing from './Billing';
import Costs from './Costs';
import Problems from './Problems';

const TicketsModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'list' | 'reports' | 'billing' | 'costs' | 'problems'>('list');

    const tabs = [
        { id: 'list', name: 'Gestión de Tickets', icon: TicketIcon },
        { id: 'reports', name: 'Reportes y Análisis', icon: ChartBarIcon },
        { id: 'billing', name: 'Cortes y Facturación', icon: DocumentTextIcon },
        { id: 'costs', name: 'Configurar Costos', icon: CurrencyDollarIcon },
        { id: 'problems', name: 'Tipos de Problema', icon: ExclamationCircleIcon },
    ] as const;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Módulo de Tickets</h1>
                    <p className="text-[#006D65] mt-1 text-sm font-medium">Centro de control para incidencias, reportes y facturación.</p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-max overflow-x-auto max-w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                isActive 
                                ? 'bg-[#FD5200] text-white shadow-lg shadow-[#FD5200]/20' 
                                : 'text-gray-400 hover:text-[#00272E] hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.name}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'list' && <TicketsList />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'billing' && <Billing />}
                {activeTab === 'costs' && <Costs />}
                {activeTab === 'problems' && <Problems />}
            </div>
        </div>
    );
};

export default TicketsModule;
