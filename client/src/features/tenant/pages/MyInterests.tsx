import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

interface Interest {
  _id: string;
  listing: {
    _id: string;
    location: {
      city: string;
      area: string;
    };
    rent: number;
    photos: string[];
  };
  owner: {
    name: string;
  };
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

const MyInterests = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/interests/sent");
      setInterests(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch interests");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Interests</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {interests.length === 0 && !error ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't expressed interest in any listings yet.</p>
          <Link to="/listings" className="text-blue-600 hover:text-blue-800 font-medium">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interests.map((interest) => (
            <div key={interest._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative h-48">
                {interest.listing.photos && interest.listing.photos.length > 0 ? (
                  <img src={interest.listing.photos[0]} alt="Listing" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                    interest.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-200' :
                    interest.status === 'declined' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {interest.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <Link to={`/listings/${interest.listing._id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                    {interest.listing.location.city}, {interest.listing.location.area}
                  </h3>
                </Link>
                <p className="text-gray-600 font-medium mb-3">₹{interest.listing.rent} / month</p>
                
                <div className="mt-auto text-sm text-gray-500 space-y-1">
                  <p>Owner: {interest.owner.name}</p>
                  <p>Requested on: {new Date(interest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInterests;
