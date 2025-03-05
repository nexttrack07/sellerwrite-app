import { createServerFn, useServerFn } from "@tanstack/react-start";
import { CreateProductListing, createProductListingSchema, styleSchema } from "~/types/schemas";
import { getSupabaseServerClient } from "~/utils/supabase";
import { useState } from "react";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "~/hooks/useMutation";

export const createListing = createServerFn({
  method: 'POST',
})
.validator(
  (d: unknown) => {
    // Use the createProductListingSchema for validation
    return createProductListingSchema.parse(d);
  }
)
.handler(async ({ data }) => {
  const supabase = await getSupabaseServerClient();
  
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(`Failed to get user: ${userError.message}`);
  }
  // Insert the listing with the validated data and current user ID
  const { data: insertedData, error } = await supabase
    .from('product_listings')
    .insert({
      ...data,
      user_id: userData.user?.id
    });

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  return insertedData;
});

// Extract the style values for our dropdown
const styleOptions = styleSchema.options;

export function CreateListing() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateProductListing>>({
    marketplace: '',
    asins: [],
    keywords: [],
    style: 'professional',
    tone: 5
  });
  const [asinsInput, setAsinsInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const createListingMutation = useMutation({
    fn: useServerFn(createListing),
    onSuccess: () => {
      setIsOpen(false);
      // Reset form
      setFormData({
        marketplace: '',
        asins: [],
        keywords: [],
        style: 'professional',
        tone: 5
      });
      // Refresh listings page
      navigate({ to: '/listings' });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'tone' ? parseInt(value, 10) : value
    });
  };

  const handleAsinsAdd = () => {
    if (asinsInput.trim()) {
      setFormData({
        ...formData,
        asins: [...(formData.asins || []), asinsInput]
      });
      setAsinsInput('');
    }
  };

  const handleKeywordsAdd = () => {
    if (keywordsInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordsInput]
      });
      setKeywordsInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Client-side validation before sending to server
      createProductListingSchema.parse(formData);
      createListingMutation.mutate({
        data: formData as CreateProductListing
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  // Check for server errors
  if (createListingMutation.error) {
    setError(createListingMutation.error.message);
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create Listing
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Create New Listing</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Marketplace
                </label>
                <input
                  type="text"
                  name="marketplace"
                  value={formData.marketplace || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  ASINs
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={asinsInput}
                    onChange={(e) => setAsinsInput(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleAsinsAdd}
                    className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap">
                  {formData.asins?.map((asin, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded mr-2 mb-2">
                      {asin}
                      <button
                        type="button"
                        className="ml-1 text-red-500"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            asins: formData.asins?.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Keywords
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleKeywordsAdd}
                    className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap">
                  {formData.keywords?.map((keyword, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded mr-2 mb-2">
                      {keyword}
                      <button
                        type="button"
                        className="ml-1 text-red-500"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            keywords: formData.keywords?.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Style
                </label>
                <select
                  name="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {styleOptions.map(style => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Tone (1-10)
                </label>
                <input
                  type="range"
                  name="tone"
                  min="1"
                  max="10"
                  value={formData.tone || 5}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <div className="flex justify-between">
                  <span>1</span>
                  <span>{formData.tone}</span>
                  <span>10</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mr-2 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createListingMutation.status === 'pending'}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {createListingMutation.status === 'pending' ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}