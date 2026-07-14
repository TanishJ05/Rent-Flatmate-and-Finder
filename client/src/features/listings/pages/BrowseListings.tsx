import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";

interface Listing {
  _id: string;
  location: {
    city: string;
    area: string;
    address: string;
  };
  rent: number;
  roomType: string;
  furnishingStatus: string;
  photos: string[];
  compatibilityScore?: number;
  compatibilityExplanation?: string;
  needsScoring?: boolean;
}

const BrowseListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState({
    city: "",
    area: "",
    minRent: "",
    maxRent: "",
    roomType: "",
    furnishingStatus: "",
  });

  useEffect(() => {
    fetchListings();
  }, [filters]); // Re-fetch when filters change

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await axiosInstance.get(`/listings?${params.toString()}`);
      setListings(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="e.g. Mumbai"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <input
              type="text"
              name="area"
              value={filters.area}
              onChange={handleFilterChange}
              placeholder="e.g. Bandra"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Rent</label>
              <input
                type="number"
                name="minRent"
                value={filters.minRent}
                onChange={handleFilterChange}
                placeholder="₹"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Rent</label>
              <input
                type="number"
                name="maxRent"
                value={filters.maxRent}
                onChange={handleFilterChange}
                placeholder="₹"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select
              name="roomType"
              value={filters.roomType}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="">Any</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing</label>
            <select
              name="furnishingStatus"
              value={filters.furnishingStatus}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="">Any</option>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>
          
          <button
            onClick={() => setFilters({ city: "", area: "", minRent: "", maxRent: "", roomType: "", furnishingStatus: "" })}
            className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Available Listings</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">No listings found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link key={listing._id} to={`/listings/${listing._id}`} className="group block">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-200 h-full flex flex-col">
                  <div className="relative h-48">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img src={listing.photos[0]} alt="Listing" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    
                    {/* Compatibility Score Badge (Tenant Only) */}
                    {user?.role === "tenant" && (
                      <div className="absolute top-2 right-2">
                        {listing.needsScoring ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-gray-600 shadow-sm flex items-center gap-1">
                            <span className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></span>
                            Calculating...
                          </span>
                        ) : listing.compatibilityScore !== undefined ? (
                          <div className="group/tooltip relative">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm cursor-help ${
                              listing.compatibilityScore >= 80 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-white text-gray-700 border border-gray-200'
                            }`}>
                              {listing.compatibilityScore >= 80 && '🌟 '}{listing.compatibilityScore}% Match
                            </span>
                            {listing.compatibilityExplanation && (
                              <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-20">
                                {listing.compatibilityExplanation}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                      {listing.location.city}, {listing.location.area}
                    </h3>
                    <p className="text-blue-600 font-bold text-lg mb-3">₹{listing.rent} <span className="text-sm font-normal text-gray-500">/ month</span></p>
                    
                    <div className="mt-auto flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded capitalize">{listing.roomType}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded capitalize">{listing.furnishingStatus}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseListings;
