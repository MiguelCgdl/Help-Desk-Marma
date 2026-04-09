export interface Company {
    _id: string;
    name: string;
    code: string;
    costPerTicket: number;
    email?: string;
    loginUsername?: string;
}
export interface Problem { _id: string; title: string; description?: string; active: boolean; costPerHour: number; }
export interface Ticket { _id: string; ticketNumber: string; companyId: Company; problemId: Problem; description: string; imagePath?: string; cost: number; status?: 'open' | 'solved'; solvedAt?: string; timeSpentMinutes?: number; createdAt: string; }