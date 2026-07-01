import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import DropzonePage from './pages/forms/DropzonePage'
import FormElementsPage from './pages/forms/FormElementsPage'
import FormValidationPage from './pages/forms/FormValidationPage'
import TablePage from './pages/TablePage'
import AdvancedTablePage from './pages/tables/AdvancedTablePage'
import BasicTablePage from './pages/tables/BasicTablePage'
import TableButtonsPage from './pages/tables/TableButtonsPage'
import ButtonsPage from './pages/ui/ButtonsPage'
import GeneralPage from './pages/ui/GeneralPage'
import TabsAccordionsPage from './pages/ui/TabsAccordionsPage'
import ModalNotificationPage from './pages/ui/ModalNotificationPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />

          {/* UI Elements */}
          <Route path="ui/general" element={<GeneralPage />} />
          <Route path="ui/buttons" element={<ButtonsPage />} />
          <Route path="ui/tabs-accordions" element={<TabsAccordionsPage />} />
          <Route path="ui/modal-notification" element={<ModalNotificationPage />} />

          {/* Form Stuff */}
          <Route path="forms/elements" element={<FormElementsPage />} />
          <Route path="forms/validation" element={<FormValidationPage />} />
          <Route path="forms/dropzone" element={<DropzonePage />} />

          {/* Tables */}
          <Route path="tables" element={<TablePage />} />
          <Route path="tables/basic" element={<BasicTablePage />} />
          <Route path="tables/buttons" element={<TableButtonsPage />} />
          <Route path="tables/advanced" element={<AdvancedTablePage />} />
        </Route>
      </Route>
    </Routes>
  )
}
