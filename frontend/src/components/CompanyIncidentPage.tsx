import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TicketForm from './TicketForm';
import type { CompanyOutletContext } from './CompanyLayout';

const CompanyIncidentPage: React.FC = () => {
    const { lockedCompany } = useOutletContext<CompanyOutletContext>();
    return <TicketForm lockedCompany={lockedCompany} useCompanyAuth />;
};

export default CompanyIncidentPage;
