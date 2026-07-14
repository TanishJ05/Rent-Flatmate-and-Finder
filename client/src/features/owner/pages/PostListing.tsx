import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

const PostListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!location.state?.listing;
  const listingToEdit = location.state?.listing;

  const [formData, setFormData] = useState({
    city: "",
    area: "",
    address: "",
    rent: "",
    availableFrom: "",
    roomType: "private",
    furnishingStatus: "semi-furnished",
    photos: [""],
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && listingToEdit) {
      setFormData({
        city: listingToEdit.location.city,
        area: listingToEdit.location.area,
        address: listingToEdit.location.address,
        rent: listingToEdit.rent.toString(),
        availableFrom: new Date(listingToEdit.availableFrom).toISOString().split("T")[0],
        roomType: listingToEdit.roomType,
        furnishingStatus: listingToEdit.furnishingStatus,
        photos: listingToEdit.photos.length ? listingToEdit.photos : [""],
        description: listingToEdit.description || "",
      });
    }
  }, [isEditing, listingToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (index: number, value: string) => {
    const newPhotos = [...formData.photos];
    newPhotos[index] = value;
    setFormData({ ...formData, photos: newPhotos });
  };

  const addPhotoField = () => {
    setFormData({ ...formData, photos: [...formData.photos, ""] });
  };

  const removePhotoField = (index: number) => {
    if (formData.photos.length > 1) {
      const newPhotos = formData.photos.filter((_, i) => i !== index);
      setFormData({ ...formData, photos: newPhotos });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      location: {
        city: formData.city,
        area: formData.area,
        address: formData.address,
      },
      rent: Number(formData.rent),
      availableFrom: formData.availableFrom,
      roomType: formData.roomType,
      furnishingStatus: formData.furnishingStatus,
      photos: formData.photos.filter((p) => p.trim() !== ""),
      description: formData.description,
    };

    try {
      if (isEditing) {
        await axiosInstance.put(`/listings/${listingToEdit._id}`, payload);
      } else {
        await axiosInstance.post("/listings", payload);
      }
      navigate("/owner/listings");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {isEditing ? "Edit Listing" : "Post a Room"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              required
              value={formData.area}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rent (per month)</label>
            <input
              type="number"
              name="rent"
              required
              min="1"
              value={formData.rent}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Available From</label>
            <input
              type="date"
              name="availableFrom"
              required
              value={formData.availableFrom}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Type</label>
            <select
              name="roomType"
              value={formData.roomType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Furnishing</label>
            <select
              name="furnishingStatus"
              value={formData.furnishingStatus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo URLs</label>
          {formData.photos.map((photo, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="url"
                value={photo}
                onChange={(e) => handlePhotoChange(index, e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              <button
                type="button"
                onClick={() => removePhotoField(index)}
                disabled={formData.photos.length === 1}
                className="bg-gray-200 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md text-gray-600 hover:bg-gray-300 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPhotoField}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add another photo URL
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6 flex flex-col items-end">
          {error && (
            <div className="mb-4 text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/owner/listings")}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Post Room"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostListing;
