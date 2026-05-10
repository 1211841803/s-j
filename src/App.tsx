import { Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./components/AdminDashboard";
import { ClientView } from "./components/ClientView";
import { ProtectedAdmin } from "./components/ProtectedAdmin";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ClientView />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminDashboard />
          </ProtectedAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
