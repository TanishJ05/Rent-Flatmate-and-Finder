import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts and Protection
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth Pages
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";

// Feature Pages (Placeholders)
import BrowseListings from "./features/listings/pages/BrowseListings";
import TenantProfile from "./features/tenant/pages/TenantProfile";
import OwnerListings from "./features/owner/pages/OwnerListings";
import AdminDashboard from "./features/admin/pages/AdminDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppShell />}>
            {/* Public Routes */}
            <Route index element={<Navigate to="/listings" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="listings" element={<BrowseListings />} />
            
            {/* Tenant Routes */}
            <Route element={<ProtectedRoute allowedRoles={["tenant"]} />}>
              <Route path="tenant/profile" element={<TenantProfile />} />
              <Route path="tenant/interests" element={<div>My Interests</div>} />
            </Route>

            {/* Owner Routes */}
            <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
              <Route path="owner/listings" element={<OwnerListings />} />
              <Route path="owner/post" element={<div>Post Listing</div>} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="admin/*" element={<AdminDashboard />} />
            </Route>
            
            {/* 404 Catch-all */}
            <Route path="*" element={<Navigate to="/listings" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
