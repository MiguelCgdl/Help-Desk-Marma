import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import TicketForm from './components/TicketForm';
import HomeLanding from './components/HomeLanding';
import CompanyLogin from './components/CompanyLogin';
import CompanyLayout from './components/CompanyLayout';
import CompanyTickets from './components/CompanyTickets';
import CompanyIncidentPage from './components/CompanyIncidentPage';
import AdminLayout from './components/Admin/AdminLayout';
import Companies from './components/Admin/Companies';
import Problems from './components/Admin/Problems';
import Dashboard from './components/Admin/Dashboard';
import TicketsList from './components/Admin/TicketsList';
import Reports from './components/Admin/Reports';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeLanding />} />
        <Route path="/reportar" element={<TicketForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/empresa/login" element={<CompanyLogin />} />
        <Route path="/empresa" element={<CompanyLayout />}>
          <Route index element={<Navigate to="incidente" replace />} />
          <Route path="incidente" element={<CompanyIncidentPage />} />
          <Route path="tickets" element={<CompanyTickets />} />
        </Route>
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="problems" element={<Problems />} />
          <Route path="tickets" element={<TicketsList />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;