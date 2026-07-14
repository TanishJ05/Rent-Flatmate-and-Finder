import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const OwnerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.name || "Owner"}!
      </h1>
      <p className="text-gray-600 mb-8">
        Manage your room listings and tenant requests from your dashboard.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Listings Card */}
        <Link 
          to="/owner/listings"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">My Listings</h2>
          <p className="text-gray-500 mb-4 text-sm">
            View, edit, and manage your active and filled room listings.
          </p>
          <span className="text-blue-600 font-medium text-sm mt-auto">Go to Listings &rarr;</span>
        </Link>

        {/* Interests Card */}
        <Link 
          to="/owner/interests"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Incoming Interests</h2>
          <p className="text-gray-500 mb-4 text-sm">
            Review tenant applications, check compatibility scores, and accept requests.
          </p>
          <span className="text-green-600 font-medium text-sm mt-auto">View Interests &rarr;</span>
        </Link>
        
        {/* Post a Room Card */}
        <Link 
          to="/owner/post"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group flex flex-col items-center text-center md:col-span-2"
        >
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Post a New Room</h2>
          <p className="text-gray-500 text-sm">
            Create a new listing and find your perfect flatmate.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default OwnerDashboard;
