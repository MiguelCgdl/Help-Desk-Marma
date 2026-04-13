// ─── Sub-document returned inside a Ticket ─────────────────────────────────
export type ProblemEntry = {
    problemId?: { _id: string; title: string; costPerHour: number } | null;
    title: string;
    costPerHour: number;
    timeSpentMinutes: number;
    cost: number;
    manualCost?: boolean;
};

export type Company = {
    _id: string;
    name: string;
    code: string;
    costPerTicket: number;
    useCustomCost: boolean;
    customCostPerTicket: number;
    email?: string;
    loginUsername?: string;
    logoUrl?: string; // NEW
    rfc?: string;
};

export type Problem = {
    _id: string;
    title: string;
    description?: string;
    active: boolean;
    costPerHour: number;
};

export type Ticket = {
    _id: string;
    ticketNumber: string;
    companyId: Company;
    problems: ProblemEntry[];
    description: string;
    imagePath?: string;
    cost: number;
    taxAmount: number;
    totalCost: number;
    status?: 'open' | 'solved';
    solvedAt?: string;
    requiresInvoice?: boolean; // NEW
    invoiced?: boolean;
    operatorComments?: string;
    createdAt: string;
    // Legacy
    problemId?: Problem;
    timeSpentMinutes?: number;
};