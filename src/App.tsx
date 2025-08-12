
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import QuickEntry from "./pages/QuickEntry";
import Login from "./pages/Login";
import SyncTest from "./pages/SyncTest";
import AdminPanel from "./pages/AdminPanel";
import DatabaseAdmin from "./pages/DatabaseAdmin";
import UserManagement from "./pages/UserManagement";
import SystemLogs from "./pages/SystemLogs";
import SystemSettings from "./pages/SystemSettings";
import SecurityDashboard from "./pages/SecurityDashboard";
import LoadingSpinner from "./components/LoadingSpinner";


const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/quick-entry" element={<QuickEntry />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/system-logs" element={<SystemLogs />} />
        <Route path="/system-settings" element={<SystemSettings />} />
        <Route path="/database-admin" element={<DatabaseAdmin />} />
        <Route path="/security-dashboard" element={<SecurityDashboard />} />
        <Route path="/sync-test" element={<SyncTest />} />
        <Route path="*" element={<Index />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
