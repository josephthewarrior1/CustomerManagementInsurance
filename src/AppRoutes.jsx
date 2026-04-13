import { Route, Routes } from 'react-router';
import Page404 from './pages/miscellaneous/Page404';
import DashboardLayout from './reusables/layouts/DashboardLayout';
import LoginPage from './pages/authentications/LoginPage';
import SignUpPage from './pages/authentications/SignupPage';
import AdminList from './pages/Admin/AdminList';
import CreateAdmin from './pages/Admin/CreateAdmin';
import AdminEdit from './pages/Admin/AdminEdit';
import AdminAssignPage from './pages/Admin/AdminAssignPage';
import Kwitansi from './pages/Kwitansi/KwitansiCreate';
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerEditPage from './pages/customers/CustomerEditPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import PropertyListPage from './pages/Property/PropertyList';
import PropertyDetailPage from './pages/Property/PropertyDetailPage';
import CarListPage from './pages/Cars/CarListPage';
import CarDetailPage from './pages/Cars/CarDetailPage';
import CarEditPage from './pages/Cars/CarEditPage';
import CreateQuotationPage from './pages/quotations/CreateQuotationPage';
import CreateInvoicePage from './pages/invoices/CreateInvoicePage';
import DashboardPage from './pages/dashboard/Dashboard';
import RenewalListPage from './pages/Renewals/RenewalListPage';
import RenewalDetailPage from './pages/Renewals/RenewalDetailPage';
import PaymentListPage from './pages/Payments/PaymentListPage';
import PaymentDetailPage from './pages/Payments/PaymentDetailPage';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            
            <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />{/* Ubah default ke PropertyListPage */}

                {/* Customers Routes */}
                <Route path="customers">
                    <Route index element={<CustomerListPage />} />
                    <Route path=":id" element={<CustomerDetailPage />} />
                    <Route path="edit/:id" element={<CustomerEditPage />} />
                </Route>

                {/* Properties Routes */}
                <Route path="properties">
                    <Route index element={<PropertyListPage />} />
                    <Route path=":id" element={<PropertyDetailPage />} />
                </Route>

                {/* Cars Routes */}
                <Route path="cars">
                    <Route index element={<CarListPage />} />
                    <Route path=":id" element={<CarDetailPage />} />
                    <Route path="edit/:id" element={<CarEditPage />} />
                </Route>

                {/* Renewals Routes */}
                <Route path="renewals">
                    <Route index element={<RenewalListPage />} />
                    <Route path=":id" element={<RenewalDetailPage />} />
                </Route>

                {/* Payments Routes */}
                <Route path="payments">
                    <Route index element={<PaymentListPage />} />
                    <Route path=":id" element={<PaymentDetailPage />} />
                </Route>

                {/* Quotations Routes */}
                <Route path="quotations">
                    <Route path="create" element={<CreateQuotationPage />} />
                </Route>

                {/* Dashboard Routes */}
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Invoices Routes */}
                <Route path="invoices">
                    <Route path="create" element={<CreateInvoicePage />} />
                </Route>

                {/* Other Routes */}

                <Route path="admin-management" element={<AdminList />} />
                <Route path="create-admin" element={<CreateAdmin />} />
                <Route path="edit-admin/:id" element={<AdminEdit />} />
                <Route path="assign-admin/:id" element={<AdminAssignPage />} />
                <Route path="kwitansi" element={<Kwitansi />} />

            </Route>

            <Route path="*" element={<Page404 />} />
        </Routes>
    );
}
