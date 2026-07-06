import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/pages/LoginPage';
import DropzonePage from '@/pages/forms/DropzonePage';
import FormElementsPage from '@/pages/forms/FormElementsPage';
import FormValidationPage from '@/pages/forms/FormValidationPage';
import TablePage from '@/pages/TablePage';
import AdvancedTablePage from '@/pages/tables/AdvancedTablePage';
import BasicTablePage from '@/pages/tables/BasicTablePage';
import TableButtonsPage from '@/pages/tables/TableButtonsPage';
import ButtonsPage from '@/pages/ui/ButtonsPage';
import GeneralPage from '@/pages/ui/GeneralPage';
import TabsAccordionsPage from '@/pages/ui/TabsAccordionsPage';
import ModalNotificationPage from '@/pages/ui/ModalNotificationPage';
import ModelsPage from '@/pages/system/ModelsPage';
import ProductCategoriesPage from '@/pages/system/ProductCategoriesPage';
import ProductMeasurementPage from '@/pages/system/ProductMeasurementPage';
import ConsignorPage from '@/pages/system/ConsignorPage';
import UserPage from '@/pages/system/UserPage';
import CompanyPage from '@/pages/system/CompanyPage';
import LocationPage from '@/pages/system/LocationPage';
import WarehousePage from '@/pages/system/WarehousePage';
import WarehouseFormPage from '@/pages/system/WarehousePage/WarehouseFormPage';

export default function App() {
	return (
		<Routes>
			<Route path='login' element={<LoginPage />} />

			<Route element={<ProtectedRoute />}>
				<Route element={<Layout />}>
					<Route index element={<Dashboard />} />

					{/* UI Elements */}
					<Route path='ui/general' element={<GeneralPage />} />
					<Route path='ui/buttons' element={<ButtonsPage />} />
					<Route path='ui/tabs-accordions' element={<TabsAccordionsPage />} />
					<Route path='ui/modal-notification' element={<ModalNotificationPage />} />

					{/* Form Stuff */}
					<Route path='forms/elements' element={<FormElementsPage />} />
					<Route path='forms/validation' element={<FormValidationPage />} />
					<Route path='forms/dropzone' element={<DropzonePage />} />

					{/* Tables */}
					<Route path='tables' element={<TablePage />} />
					<Route path='tables/basic' element={<BasicTablePage />} />
					<Route path='tables/buttons' element={<TableButtonsPage />} />
					<Route path='tables/advanced' element={<AdvancedTablePage />} />

					{/* System management */}
					<Route path='system/product-categories' element={<ProductCategoriesPage />} />
					<Route path='system/models' element={<ModelsPage />} />
					<Route path='system/product-measurement' element={<ProductMeasurementPage />} />
						<Route path='system/consignors' element={<ConsignorPage />} />
						<Route path='system/users' element={<UserPage />} />
						<Route path='system/companies' element={<CompanyPage />} />
						<Route path='system/locations' element={<LocationPage />} />
						<Route path='system/warehouse-prices' element={<WarehousePage />} />
						<Route path='system/warehouse-prices/create' element={<WarehouseFormPage mode='create' />} />
						<Route path='system/warehouse-prices/:id/edit' element={<WarehouseFormPage mode='edit' />} />
				</Route>
			</Route>
		</Routes>
	);
}
