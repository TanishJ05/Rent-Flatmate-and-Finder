import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

interface Listing {
  _id: string;
  location: {
    city: string;
    area: string;
    address: string;
  };
  rent: number;
  availableFrom: string;
  roomType: string;
  furnishingStatus: string;
  photos: string[];
  description: string;
  status: "active" | "filled";
}

const MyListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/listings/mine");
      setListings(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing: Listing) => {
    navigate("/owner/post", { state: { listing } });
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "filled" : "active";
    try {
      await axiosInstance.patch(`/listings/${id}/status`, { status: newStatus });
      setListings(listings.map(l => l._id === id ? { ...l, status: newStatus } : l));
    } catch (err: any) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await axiosInstance.delete(`/listings/${id}`);
      setListings(listings.filter(l => l._id !== id));
    } catch (err: any) {
      alert("Failed to delete listing");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
        <button
          onClick={() => navigate("/owner/post")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Post a Room
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {listings.length === 0 && !error ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't posted any listings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {listing.photos && listing.photos.length > 0 ? (
                <img src={listing.photos[0]} alt="Listing" className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {listing.location.city}, {listing.location.area}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {listing.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">₹{listing.rent} / month</p>
                <p className="text-sm text-gray-500 mb-4 capitalize">
                  {listing.roomType} • {listing.furnishingStatus}
                </p>
                
                <div className="mt-auto flex justify-between space-x-2 border-t pt-4">
                  <button
                    onClick={() => handleEdit(listing)}
                    className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(listing._id, listing.status)}
                    className="flex-1 text-gray-600 hover:text-gray-800 text-sm font-medium border-l border-r border-gray-200"
                  >
                    {listing.status === "active" ? "Mark Filled" : "Reopen"}
                  </button>
                  <button
                    onClick={() => handleDelete(listing._id)}
                    className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
