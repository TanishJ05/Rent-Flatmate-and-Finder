import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

interface Interest {
  _id: string;
  tenant: {
    _id: string;
    name: string;
    email: string;
  };
  listing: {
    _id: string;
    location: {
      city: string;
      area: string;
    };
    rent: number;
  };
  status: "pending" | "accepted" | "declined";
  compatibilityScoreAtRequest?: number;
  createdAt: string;
}

const IncomingInterests = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/interests/received");
      setInterests(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch incoming interests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, action: "accept" | "decline") => {
    // Optimistic update
    const previousInterests = [...interests];
    setInterests(interests.map(i => i._id === id ? { ...i, status: action === "accept" ? "accepted" : "declined" } : i));

    try {
      await axiosInstance.patch(`/interests/${id}/${action}`);
    } catch (err: any) {
      alert(`Failed to ${action} interest`);
      // Revert optimistic update
      setInterests(previousInterests);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Interests Received</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {interests.length === 0 && !error ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4">No interests received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => (
            <div key={interest._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{interest.tenant.name}</h3>
                  {interest.compatibilityScoreAtRequest !== undefined && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      interest.compatibilityScoreAtRequest >= 80 
                        ? 'bg-green-100 text-green-800 border border-green-300 shadow-sm' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {interest.compatibilityScoreAtRequest >= 80 && '🌟 '}{interest.compatibilityScoreAtRequest}% Match
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-1">
                  Interested in: <span className="font-medium text-gray-800">{interest.listing.location.city}, {interest.listing.location.area}</span> (₹{interest.listing.rent})
                </p>
                <p className="text-gray-500 text-xs">
                  Requested on: {new Date(interest.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                {interest.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(interest._id, "accept")}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(interest._id, "decline")}
                      className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      interest.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
                    </span>
                    {interest.status === 'accepted' && (
                      <Link
                        to={`/chat/${interest._id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
                      >
                        Chat
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomingInterests;
