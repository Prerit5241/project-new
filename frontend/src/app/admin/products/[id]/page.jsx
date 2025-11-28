"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiHelpers } from "@/lib/api";
import { toast } from "react-hot-toast";
import axios from "axios";


export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    stock: 0,
    brand: "",
    featured: false,
    images: []
  });
  const [imageUrl, setImageUrl] = useState("");
  const [existingImages, setExistingImages] = useState([]);

  // Load product and categories on mount
  useEffect(() => {
    if (!id) {
      toast.error('No product ID provided');
      router.push('/admin/products');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load product data
        const productRes = await apiHelpers.products.getById(id);
        const product = productRes?.data;
        
        if (!product) {
          throw new Error('Product not found');
        }
        
        console.log('Loaded product data:', product);
        
        // Set form data with proper null checks
        setFormData({
          title: product?.title || "",
          description: product?.description || "",
          price: product?.price?.toString() || "",
          category: product?.category?._id?.toString() || "",
          subCategory: product?.subCategory?._id?.toString() || "",
          stock: Number(product?.stock) || 0,
          brand: product.brand || "",
          featured: product.featured || false,
          images: []
        });
        
        // Set existing images
        if (product.images && product.images.length > 0) {
          setExistingImages(product.images);
        }
        
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load product data");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, router]);

  // Load subcategories when category changes
  useEffect(() => {
    const loadSubCategories = async () => {
      if (!formData.category) {
        setSubCategories([]);
        return;
      }
      try {
        const res = await fetch(`/api/subcategories?category=${formData.category}`).then(res => res.json());
        if (res.success) {
          setSubCategories(res.data || []);
        }
      } catch (error) {
        console.error("Error loading subcategories:", error);
      }
    };
    loadSubCategories();
  }, [formData.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  const addImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    
    // Basic URL validation
    try {
      new URL(imageUrl);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
      
      setImageUrl("");
    } catch (error) {
      toast.error("Please enter a valid URL");
    }
  };

  const removeImage = (index, isExisting) => {
    if (isExisting) {
      // Mark existing image for removal (soft delete)
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove image from the form data
      const newImages = [...formData.images];
      newImages.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
    }
  };

   // ...existing code...
// ...existing code...

   const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate / normalize numeric fields
      const priceNum = Number(formData.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("Please provide a valid non-negative price");
      }
      const stockNum = Number(formData.stock) || 0;

      // Basic URL validator
      const isValidUrl = (u) => {
        try { new URL(u); return true; } catch { return false; }
      };

      // Combine remaining existing images with any new images the admin added (only valid URLs)
      const validExisting = Array.isArray(existingImages) ? existingImages.filter(isValidUrl) : [];
      const validNew = Array.isArray(formData.images) ? formData.images.filter(isValidUrl) : [];
      const combinedImages = [...validExisting, ...validNew].slice(0, 10); // limit to 10 images

      // Build payload expected by backend: single `images` array
      const productData = {
        title: (formData.title || "").trim(),
        description: (formData.description || "").trim(),
        price: priceNum,
        stock: stockNum,
        category: formData.category || undefined,
        subCategory: formData.subCategory || undefined,
        brand: formData.brand?.trim() || undefined,
        featured: Boolean(formData.featured),
        images: combinedImages
      };

      // Remove undefined keys to avoid backend validation issues
      Object.keys(productData).forEach((k) => {
        if (productData[k] === undefined) delete productData[k];
      });

      console.log("Sending product data:", JSON.stringify(productData, null, 2));

      let response;
      try {
        // Primary attempt: use existing json helper
        console.log("Attempting JSON update...");
        response = await apiHelpers.products.update(id, productData);
        console.log("JSON update response:", response);
      } catch (err) {
        console.warn("JSON update failed:", {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          message: err.message
        });

        // If server returned 500, try multipart/form-data fallback
        if (err?.response?.status === 500 || err?.response?.status === 400) {
          const fd = new FormData();
          Object.entries(productData).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (Array.isArray(v)) {
              v.forEach((item) => item !== undefined && fd.append(k, item));
            } else if (typeof v === 'object') {
              fd.append(k, JSON.stringify(v));
            } else {
              fd.append(k, v);
            }
          });

          console.log("Retrying update with multipart/form-data");
          try {
            response = await axios.put(`/api/products/${id}`, fd, {
              headers: { 
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
              }
            });
            console.log("Multipart update response:", response);
          } catch (formDataErr) {
            console.error("Multipart form-data update failed:", {
              status: formDataErr?.response?.status,
              statusText: formDataErr?.response?.statusText,
              data: formDataErr?.response?.data,
              message: formDataErr.message
            });
            throw formDataErr;
          }
        } else {
          throw err;
        }
      }

      // Handle successful response
      const responseData = response?.data?.data || response?.data;
      console.log("Response data:", responseData);
      
      if (responseData?.success || response?.status === 200) {
        toast.success(responseData?.message || "Product updated successfully!");
        router.push("/admin/products");
        return;
      }
      
      // If we get here, the request didn't fail but wasn't successful either
      const errorMessage = responseData?.message || 
                         response?.data?.message || 
                         response?.statusText || 
                         "Failed to update product";
      console.error("Update failed with response:", {
        status: response?.status,
        statusText: response?.statusText,
        data: response?.data,
        responseData
      });
      throw new Error(errorMessage);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error?.response) {
        console.error("Server response:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      const errorMessage = error?.response?.data?.message || error.message || "Failed to update product";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };
 // ...existing code...

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update the product details below</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/products`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Products
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Product Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-lg"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images</h2>
                
                <div className="space-y-4">
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {existingImages.map((img, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img 
                              src={img} 
                              alt={`Product ${index + 1}`} 
                              className="h-24 w-full object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, true)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Image URL */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Add Image by URL</h3>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={addImageUrl}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Enter the full URL of the image</p>
                  </div>
                  
                  {/* New Image Previews */}
                  {formData.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">New Images to Add</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((img, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img 
                              src={img} 
                              alt={`New ${index + 1}`} 
                              className="h-24 w-full object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, false)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Organization */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>

              {/* Categories Section Removed */}
              
              {/* Subcategories (if needed) */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory (Optional)
                    </label>
                    <select
                      id="subCategory"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!formData.category}
                    >
                      <option value="">Select a subcategory</option>
                      {subCategories.map((subCat) => (
                        <option key={subCat._id} value={subCat._id}>
                          {subCat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Brand */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Brand</h2>
                
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Nike, Apple, Samsung"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="sticky top-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Update Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
