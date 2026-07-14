import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";

const TenantProfile = () => {
  const [formData, setFormData] = useState({
    city: "",
    area: "",
    minBudget: "",
    maxBudget: "",
    moveInDate: "",
    preferences: "",
  });
  
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/tenant-profile/me");
      if (res.data.data) {
        const profile = res.data.data;
        setFormData({
          city: profile.preferredLocation.city,
          area: profile.preferredLocation.area || "",
          minBudget: profile.budgetRange.min.toString(),
          maxBudget: profile.budgetRange.max.toString(),
          moveInDate: new Date(profile.moveInDate).toISOString().split("T")[0],
          preferences: profile.preferences || "",
        });
        setExists(true);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      preferredLocation: {
        city: formData.city,
        area: formData.area,
      },
      budgetRange: {
        min: Number(formData.minBudget),
        max: Number(formData.maxBudget),
      },
      moveInDate: formData.moveInDate,
      preferences: formData.preferences,
    };

    try {
      if (exists) {
        await axiosInstance.put("/tenant-profile", payload);
      } else {
        await axiosInstance.post("/tenant-profile", payload);
        setExists(true);
      }
      setSuccessMsg("Profile saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Preferred Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Area</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Budget Range (Monthly)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum</label>
              <input
                type="number"
                name="minBudget"
                required
                min="0"
                value={formData.minBudget}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Maximum</label>
              <input
                type="number"
                name="maxBudget"
                required
                min={formData.minBudget || 0}
                value={formData.maxBudget}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Other Details</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Move-in Date</label>
              <input
                type="date"
                name="moveInDate"
                required
                value={formData.moveInDate}
                onChange={handleChange}
                className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferences & About You</label>
              <textarea
                name="preferences"
                rows={4}
                value={formData.preferences}
                onChange={handleChange}
                placeholder="E.g., I'm a working professional, prefer a quiet environment, non-smoker, have a cat."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6 flex flex-col items-end">
          {error && (
            <div className="mb-4 text-red-600 font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 text-green-600 font-medium">
              {successMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantProfile;
