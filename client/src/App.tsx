import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts and Protection
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth Pages
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";

// Feature Pages
import BrowseListings from "./features/listings/pages/BrowseListings";
import ListingDetail from "./features/listings/pages/ListingDetail";
import TenantProfile from "./features/tenant/pages/TenantProfile";
import MyInterests from "./features/tenant/pages/MyInterests";
import MyListings from "./features/owner/pages/MyListings";
import PostListing from "./features/owner/pages/PostListing";
import IncomingInterests from "./features/owner/pages/IncomingInterests";
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
            <Route path="listings/:id" element={<ListingDetail />} />
            
            {/* Tenant Routes */}
            <Route element={<ProtectedRoute allowedRoles={["tenant"]} />}>
              <Route path="tenant/profile" element={<TenantProfile />} />
              <Route path="tenant/interests" element={<MyInterests />} />
            </Route>

            {/* Owner Routes */}
            <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
              <Route path="owner/listings" element={<MyListings />} />
              <Route path="owner/post" element={<PostListing />} />
              <Route path="owner/interests" element={<IncomingInterests />} />
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
