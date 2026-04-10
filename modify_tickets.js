const fs = require('fs');
const file = '/Users/Mike/Documents/GitHub/T.Marmacore/Help Desk Marma/frontend/src/components/Admin/TicketsList.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add CutoffModal component
const cutoffModalStr = `
// ─── Cutoff Modal ─────────────────────────────────────────────────────────────
const CutoffModal: React.FC<{
    tickets: Ticket[];
    selectedIds: string[];
    onClose: () => void;
    onConfirm: () => void;
}> = ({ tickets, selectedIds, onClose, onConfirm }) => {
    const selected = tickets.filter(t => selectedIds.includes(t._id));
    const byCompany = selected.reduce((acc, t) => {
        const cId = (t.companyId as any)._id;
        if (!acc[cId]) acc[cId] = { company: t.companyId, tickets: [], total: 0 };
        acc[cId].tickets.push(t);
        acc[cId].total += t.cost;
        return acc;
    }, {} as Record<string, any>);

    const [processing, setProcessing] = React.useState(false);

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            const api = require('../../services/api').default;
            await api.patch('/tickets/bulk-invoice', { ticketIds: selectedIds });
            onConfirm();
        } catch (e) {
            alert('Error al facturar tickets');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-black text-[#00272E] text-lg">Corte de Tickets (Facturación)</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    {Object.values(byCompany).map((group: any) => (
                        <div key={group.company._id} className="bg-[#F8FAFB] border border-gray-100 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                <div>
                                    <h3 className="font-black text-[#00272E]">{group.company.name}</h3>
                                    <p className="text-xs text-[#006D65] font-bold tracking-wider uppercase">
                                        RFC: {group.company.rfc || <span className="text-red-500 opacity-80">NO REGISTRADO</span>}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total de la empresa</p>
                                    <p className="font-black text-[#FD5200] text-lg">
                                        ${group.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                            <ul className="space-y-1.5 line-clamp-4 overflow-y-auto max-h-32 pr-2">
                                {group.tickets.map((t: any) => (
                                    <li key={t._id} className="text-xs flex justify-between items-center bg-white p-2 rounded border border-gray-50">
                                        <span className="font-mono font-bold text-[#00272E]">{t.ticketNumber}</span>
                                        <span className="font-semibold text-gray-500">${t.cost.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button disabled={processing} onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD5200] text-white font-bold text-sm hover:bg-[#E64A00] transition-colors active:scale-95 disabled:opacity-60">
                        {processing ? 'Procesando...' : 'Elaborar Factura'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main TicketsList
`;

data = data.replace('// ─── Main TicketsList', cutoffModalStr);

// 2. Add state
data = data.replace(
    /const \[detail, setDetail\]       = useState<Ticket \| null>\(null\);/,
    `const [detail, setDetail]       = useState<Ticket | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
    const [showCutoffModal, setShowCutoffModal] = useState(false);`
);

// 3. Clear selected tickets when filter changes
data = data.replace(
    /const fetchTickets = async \(\) => {/,
    `const fetchTickets = async () => {
        setSelectedTickets([]);`
);

// 4. In "Header", add Generate Cutoff button
data = data.replace(
    /<div className="mb-6">/,
    `<div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">`
);

data = data.replace(
    /<h1 className="text-3xl font-black text-\[#00272E\] tracking-tight">Registro de Tickets<\/h1>\n\s*<p className="text-\[#006D65\] mt-1 text-sm font-medium">Historial completo de reportes y asistencias técnicas\.<\/p>\n\s*<\/div>/,
    `<div>
                    <h1 className="text-3xl font-black text-[#00272E] tracking-tight">Registro de Tickets</h1>
                    <p className="text-[#006D65] mt-1 text-sm font-medium">Historial completo de reportes y asistencias técnicas.</p>
                </div>
                {selectedTickets.length > 0 && (
                    <button 
                        onClick={() => setShowCutoffModal(true)}
                        className="px-6 py-3 bg-[#FD5200] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FD5200]/20 hover:bg-[#E64A00] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                        <CurrencyDollarIcon className="w-5 h-5" />
                        Generar Corte de {selectedTickets.length} Tickets
                    </button>
                )}
            </div>`
);

// 5. Checkboxes in table headers
data = data.replace(
    /<th className="px-6 py-3">Ticket<\/th>/,
    `<th className="px-6 py-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                        checked={filtered.length > 0 && selectedTickets.length === filtered.length}
                                        onChange={e => {
                                            if (e.target.checked) setSelectedTickets(filtered.map(t => t._id));
                                            else setSelectedTickets([]);
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-3">Ticket</th>`
);

// 6. Checkboxes in table row
data = data.replace(
    /<td className="px-6 py-4">\n\s*<span className="font-mono font-bold text-\[#00272E\] text-sm group-hover:text-\[#FD5200\] transition-colors">\n\s*\{t.ticketNumber\}\n\s*<\/span>\n\s*<\/td>/g,
    `<td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-[#FD5200] focus:ring-[#FD5200]"
                                            checked={selectedTickets.includes(t._id)}
                                            onChange={e => {
                                                if(e.target.checked) setSelectedTickets(prev => [...prev, t._id]);
                                                else setSelectedTickets(prev => prev.filter(id => id !== t._id));
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-[#00272E] text-sm group-hover:text-[#FD5200] transition-colors">
                                            {t.ticketNumber}
                                        </span>
                                    </td>`
);

// 7. Update colSpans from 8 to 9
data = data.replace(/colSpan=\{8\}/g, "colSpan={9}");

// 8. Add modal logic in bottom
data = data.replace(
    /\{detail && \(\n\s*<DetailModal ticket=\{detail\} onClose=\{\(\) => setDetail\(null\)\} \/>\n\s*\)\}/,
    `{detail && (
                <DetailModal ticket={detail} onClose={() => setDetail(null)} />
            )}
            {showCutoffModal && (
                <CutoffModal 
                    tickets={filtered} 
                    selectedIds={selectedTickets} 
                    onClose={() => setShowCutoffModal(false)}
                    onConfirm={() => {
                        setShowCutoffModal(false);
                        setSelectedTickets([]);
                        fetchTickets();
                    }}
                />
            )}`
);

// 9. Change Invoice cell to display Facturada if t.invoiced is true
data = data.replace(
    /\{t.requiresInvoice \? \(\n\s*<span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-\[10px\] font-bold uppercase">\n\s*Requerida\n\s*<\/span>\n\s*\) : \(/,
    `{t.invoiced ? (
                                            <span className="inline-block px-2 py-1 bg-[#00272E] text-white rounded-lg text-[10px] font-bold uppercase">
                                                Facturada
                                            </span>
                                        ) : t.requiresInvoice ? (
                                            <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-[10px] font-bold uppercase">
                                                Requerida
                                            </span>
                                        ) : (`
);

// Add empty option in filters for invoiced "Pendiente" / "Facturado"
// Actually we'll just rename the requiresInvoice filter to understand this. Filter should probably remain unchanged as per request, just visually showing Facturada. Wait, I can add a filter for "invoiced".
// But we won't over-engineer it. The user has "Corte" now.

fs.writeFileSync(file, data);
