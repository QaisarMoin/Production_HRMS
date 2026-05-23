import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Masters from "./pages/Masters";
import CoreHR from "./pages/CoreHR";
import Attendance from "./pages/Attendance";
import DepartmentMaster from "./pages/masters/DepartmentMaster";
import Reimbursement from "./pages/Reimbursement";
import LeavePage from "./pages/LeavePage";
import Payroll from "./pages/Payroll";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="masters" element={<Masters />} />
        <Route path="core-hr" element={<CoreHR />} />
        <Route path="departments" element={<DepartmentMaster />} />
        <Route
          path="employees"
          element={
            <div className="p-6 text-left">
              <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
              <p className="mt-2 text-gray-600">
                Employee management module is active. Check Masters page to configure Categories and Roles.
              </p>
            </div>
          }
        />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="payroll" element={<Payroll />} />
        <Route
          path="reports"
          element={
            <div className="p-6 text-left">
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="mt-2 text-gray-600">
                Reports and Workforce attrition visualizations are operational on the primary Dashboard.
              </p>
            </div>
          }
        />
        <Route path="reimbursement" element={<Reimbursement />} />
        <Route
          path="geo-location"
          element={
            <div className="p-6 text-left">
              <h1 className="text-2xl font-bold text-gray-900">Geo Location</h1>
              <p className="mt-2 text-gray-600">
                Geo location tracking and checking locations are operational. Configure Office Locations in the Location Master.
              </p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
