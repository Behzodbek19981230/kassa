import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/pages/LoginPage';

import ModelsPage from '@/pages/system/ModelsPage';
import ProductCategoriesPage from '@/pages/system/ProductCategoriesPage';
import ProductMeasurementPage from '@/pages/system/ProductMeasurementPage';
import ConsignorPage from '@/pages/system/ConsignorPage';
import UserPage from '@/pages/system/UserPage';
import CompanyPage from '@/pages/system/CompanyPage';
import LocationPage from '@/pages/system/LocationPage';
import SkladTypePage from '@/pages/system/SkladTypePage';
import WarehousePage from '@/pages/WarehousePage';
import WarehouseFormPage from '@/pages/WarehousePage/WarehouseFormPage';
import WarehouseProductsPage from '@/pages/WarehouseProductsPage';
import PlaceOrderPage from '@/pages/PlaceOrderPage';
import ImportPage from '@/pages/ImportPage';
import CustomerOrderHistoryPage from '@/pages/CustomerOrderHistoryPage';
import OrderAccountHistoryDetailPage from '@/pages/OrderAccountHistoryDetailPage';
import OrderAccountHistoryEditPage from '@/pages/OrderAccountHistoryEditPage';
import OrderAndDebtPage from '@/pages/OrderAndDebtPage';
import VozvratPage from '@/pages/VozvratPage';
import VozvratOrderHistoryPage from '@/pages/VozvratOrderHistoryPage';
import VozvratOrderHistoryDetailPage from '@/pages/VozvratOrderHistoryDetailPage';
import WarehouseAccountPage from '@/pages/WarehouseAccountPage';
import WarehouseAccountDetailPage from '@/pages/WarehouseAccountDetailPage';
import ExpensePage from '@/pages/system/ExpensePage';
import AboutPage from '@/pages/system/AboutPage';
import ClientPage from '@/pages/settings/ClientPage';
import DebtRepaymentPage from '@/pages/settings/DebtRepaymentPage';

export default function App() {
	return (
		<Routes>
			<Route path='login' element={<LoginPage />} />

			<Route element={<ProtectedRoute />}>
				<Route element={<Layout />}>
					<Route index element={<Dashboard />} />

					<Route path='warehouse-products' element={<WarehouseProductsPage />} />
					<Route path='place-order' element={<PlaceOrderPage />} />
					<Route path='import' element={<ImportPage />} />
					<Route path='customer-order-history' element={<CustomerOrderHistoryPage />} />
						<Route path='customer-order-history/:id' element={<OrderAccountHistoryDetailPage />} />
						<Route path='customer-order-history/:id/edit' element={<OrderAccountHistoryEditPage />} />
					<Route path='order-and-debt' element={<OrderAndDebtPage />} />
						<Route path='vozvrat' element={<VozvratPage />} />
						<Route path='vozvrat-order-history' element={<VozvratOrderHistoryPage />} />
						<Route path='vozvrat-order-history/:id' element={<VozvratOrderHistoryDetailPage />} />
					<Route path='warehouse-report' element={<WarehouseAccountPage />} />
					<Route path='warehouse-report/:id' element={<WarehouseAccountDetailPage />} />

					{/* System management */}
					<Route path='system/product-categories' element={<ProductCategoriesPage />} />
					<Route path='system/models' element={<ModelsPage />} />
					<Route path='system/product-measurement' element={<ProductMeasurementPage />} />
					<Route path='system/consignors' element={<ConsignorPage />} />
					<Route path='system/users' element={<UserPage />} />
                    
					<Route path='system/companies' element={<CompanyPage />} />
					<Route path='system/locations' element={<LocationPage />} />
					<Route path='system/sklad-types' element={<SkladTypePage />} />
					<Route path='warehouse-prices' element={<WarehousePage />} />
					<Route path='warehouse-prices/create' element={<WarehouseFormPage mode='create' />} />
					<Route path='warehouse-prices/:id/edit' element={<WarehouseFormPage mode='edit' />} />
					<Route path='system/expenses' element={<ExpensePage />} />
					<Route path='system/about' element={<AboutPage />} />
					<Route path='settings/clients' element={<ClientPage />} />
					<Route path='settings/debt-repayments' element={<DebtRepaymentPage />} />
				</Route>
			</Route>
		</Routes>
	);
}
