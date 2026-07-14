import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";

interface Stats {
  users: number;
  listings: number;
  messages: number;
  interests: {
    pending: number;
    accepted: number;
    declined: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface Listing {
  _id: string;
  location: { city: string; area: string };
  rent: number;
  status: string;
  owner?: { name: string; email: string };
  createdAt: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "listings">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData(activeTab);
    }
  }, [activeTab, user]);

  if (user?.role !== "admin") {
    return <Navigate to="/listings" replace />;
  }

  const fetchData = async (tab: string) => {
    try {
      setLoading(true);
      setError(null);
      if (tab === "stats") {
        const res = await axiosInstance.get("/admin/stats");
        setStats(res.data.data);
      } else if (tab === "users") {
        const res = await axiosInstance.get("/admin/users");
        setUsers(res.data.data);
      } else if (tab === "listings") {
        const res = await axiosInstance.get("/admin/listings");
        setListings(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to load ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const res = await axiosInstance.patch(`/admin/users/${id}/status`);
      setUsers(users.map(u => u._id === id ? { ...u, active: res.data.data.active } : u));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to toggle user status");
    }
  };

  const deactivateListing = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'removed' ? 'active' : 'removed';
      const res = await axiosInstance.patch(`/admin/listings/${id}/status`, { status: newStatus });
      setListings(listings.map(l => l._id === id ? { ...l, status: res.data.data.status } : l));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update listing status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {["stats", "users", "listings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* STATS SECTION */}
          {activeTab === "stats" && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-500 truncate">Total Users</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.users}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-500 truncate">Total Listings</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.listings}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-500 truncate">Messages Exchanged</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.messages}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm font-medium text-gray-500 truncate">Interest Requests</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {stats.interests.pending + stats.interests.accepted + stats.interests.declined}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.interests.accepted} Accepted • {stats.interests.pending} Pending
                </p>
              </div>
            </div>
          )}

          {/* USERS SECTION */}
          {activeTab === "users" && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{u.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {u.role !== 'admin' && (
                          <button 
                            onClick={() => toggleUserStatus(u._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {u.active ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LISTINGS SECTION */}
          {activeTab === "listings" && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map(l => (
                    <tr key={l._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {l.location.city}, {l.location.area}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{l.rent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.owner?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          l.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => deactivateListing(l._id, l.status)}
                          className={`${l.status === 'removed' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                        >
                          {l.status === 'removed' ? 'Re-activate' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
