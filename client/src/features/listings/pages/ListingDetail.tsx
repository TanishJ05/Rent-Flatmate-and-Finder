import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  availableFrom: string;
  roomType: string;
  furnishingStatus: string;
  photos: string[];
  description: string;
  compatibilityScore?: number;
  compatibilityExplanation?: string;
  needsScoring?: boolean;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestStatus, setInterestStatus] = useState<"idle" | "success" | "already_sent" | "error">("idle");
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        // Note: We might just want to use the list endpoint and filter if there's no by-id endpoint,
        // but assuming there is a GET /api/listings/:id endpoint (from phase 7 standard patterns).
        // Let's fallback to browsing if GET /:id is not implemented, but ideally it is.
        // I'll assume /api/listings works or I can fetch all and find it. 
        // Actually, backend has GET /api/listings/:id from phase 7? The plan was CRUD.
        const res = await axiosInstance.get(`/listings?_id=${id}`);
        const found = res.data.data.find((l: any) => l._id === id);
        if (found) {
          setListing(found);
        } else {
          setError("Listing not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch listing");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchListing();
  }, [id]);

  const handleExpressInterest = async () => {
    try {
      setInterestLoading(true);
      setInterestStatus("idle");
      await axiosInstance.post("/interests", { listingId: listing?._id });
      setInterestStatus("success");
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.data?.error?.includes("already expressed")) {
        setInterestStatus("already_sent");
      } else {
        setInterestStatus("error");
      }
    } finally {
      setInterestLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-sm rounded-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-700">{error || "Listing not found."}</p>
        <button onClick={() => navigate("/listings")} className="mt-4 text-blue-600 hover:underline">
          &larr; Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate("/listings")} className="mb-4 text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium">
        &larr; Back to Search
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header & Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-64 md:h-96">
          {listing.photos && listing.photos.length > 0 ? (
            <>
              <div className="h-full">
                <img src={listing.photos[0]} alt="Main" className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-1 p-1">
                {listing.photos.slice(1, 5).map((photo, i) => (
                  <img key={i} src={photo} alt={`Sub ${i}`} className="w-full h-full object-cover rounded-sm" />
                ))}
              </div>
            </>
          ) : (
            <div className="col-span-1 md:col-span-2 bg-gray-200 flex items-center justify-center text-gray-400">
              No Photos Available
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.location.address}, {listing.location.area}, {listing.location.city}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium capitalize border border-blue-100">
                  {listing.roomType} Room
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium capitalize border border-gray-200">
                  {listing.furnishingStatus}
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                  Available from {new Date(listing.availableFrom).toLocaleDateString()}
                </span>
              </div>

              {/* Compatibility Score - Tenant Only */}
              {user?.role === "tenant" && (
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">AI Compatibility</h3>
                  {listing.needsScoring ? (
                     <div className="flex items-center gap-2 text-blue-600">
                       <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                       <span>Calculating your perfect match...</span>
                     </div>
                  ) : listing.compatibilityScore !== undefined ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${listing.compatibilityScore >= 80 ? 'text-green-600' : 'text-gray-800'}`}>
                            {listing.compatibilityScore}%
                          </span>
                          <span className="text-gray-500 font-medium">Match Score</span>
                        </div>
                        {listing.compatibilityExplanation && (
                          <button 
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {showExplanation ? "Hide Details" : "Why this score?"}
                          </button>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className={`h-2.5 rounded-full ${listing.compatibilityScore >= 80 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${listing.compatibilityScore}%` }}
                        ></div>
                      </div>

                      {showExplanation && listing.compatibilityExplanation && (
                        <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md text-sm text-gray-700 italic">
                          {listing.compatibilityExplanation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Score not available. Please complete your tenant profile first.</p>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">About this room</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {listing.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Sticky Action Card */}
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900 mb-1">₹{listing.rent}</p>
                  <p className="text-gray-500 font-medium">per month</p>
                </div>

                {user?.role === "tenant" ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleExpressInterest}
                      disabled={interestLoading || interestStatus === "success" || interestStatus === "already_sent"}
                      className={`w-full py-3 px-4 rounded-lg font-bold text-white transition ${
                        interestStatus === "success" ? "bg-green-600 cursor-not-allowed" :
                        interestStatus === "already_sent" ? "bg-gray-400 cursor-not-allowed" :
                        "bg-blue-600 hover:bg-blue-700 shadow-sm"
                      }`}
                    >
                      {interestLoading ? "Sending..." :
                       interestStatus === "success" ? "✓ Interest Sent" :
                       interestStatus === "already_sent" ? "Already Sent" :
                       "Express Interest"}
                    </button>

                    {interestStatus === "success" && (
                      <p className="text-sm text-green-700 text-center bg-green-50 py-2 rounded-md border border-green-100">
                        The owner has been notified!
                      </p>
                    )}
                    {interestStatus === "error" && (
                      <p className="text-sm text-red-600 text-center">
                        Something went wrong. Try again.
                      </p>
                    )}
                  </div>
                ) : user?.role === "owner" ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-600 text-sm">
                    Log in as a tenant to express interest in listings.
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm"
                  >
                    Log in to apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
