import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { styleSchema } from "~/types/schemas";
import { getSupabaseServerClient } from "~/utils/supabase";
import { useState } from "react";
import { z } from "zod";
import { useMutation } from "~/hooks/useMutation";

// Combined schema for both product listing and listing version
const createCombinedSchema = z.object({
  // Product listing fields
  marketplace: z.string().min(1, "Marketplace is required"),
  asins: z.array(z.string()),
  keywords: z.array(z.string()),
  style: styleSchema,
  tone: z.number().min(1).max(10),
  
  // Version fields
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  bullet_points: z.array(z.string()).min(1, "At least one bullet point is required")
});

type CreateCombinedInput = z.infer<typeof createCombinedSchema>;

export const createListing = createServerFn({
  method: 'POST',
})
.validator((d: unknown) => {
  // Validate both product listing and version data
  return createCombinedSchema.parse(d);
})
.handler(async ({ data }) => {
  const supabase = await getSupabaseServerClient();
  
  // Get the authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Authentication error: ${userError.message}`);
  if (!userData.user?.id) throw new Error('User must be authenticated');

  // Transaction to create both listing and version
  // 1. Create product listing
  const { data: listingData, error: listingError } = await supabase
    .from('product_listings')
    .insert({
      marketplace: data.marketplace,
      asins: data.asins,
      keywords: data.keywords,
      style: data.style,
      tone: data.tone,
      user_id: userData.user.id
    })
    .select()
    .single();

  if (listingError) throw new Error(`Failed to create listing: ${listingError.message}`);
  
  // 2. Create initial version (version_number = 1, is_current = true)
  const { data: versionData, error: versionError } = await supabase
    .from('listing_versions')
    .insert({
      listing_id: listingData.id,
      title: data.title,
      description: data.description,
      bullet_points: data.bullet_points,
      version_number: 1,
      is_current: true
    })
    .select()
    .single();
    
  if (versionError) throw new Error(`Failed to create version: ${versionError.message}`);
  
  // 3. Update product listing with current_version_id
  const { error: updateError } = await supabase
    .from('product_listings')
    .update({ current_version_id: versionData.id })
    .eq('id', listingData.id);
    
  if (updateError) throw new Error(`Failed to update listing: ${updateError.message}`);
  
  // Return combined data
  return {
    listing: listingData,
    version: versionData
  };
});

// Extract the style values for our dropdown
const styleOptions = styleSchema.options;

export const Route = createFileRoute('/_protected/listings/create')({
  component: CreateListingPage,
})

function CreateListingPage() {
  const [formData, setFormData] = useState<CreateCombinedInput>({
    marketplace: '',
    asins: [],
    keywords: [],
    style: 'professional',
    tone: 5,
    title: '',
    description: '',
    bullet_points: []
  });
  
  // Inputs for array fields
  const [asinsInput, setAsinsInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [bulletPointInput, setBulletPointInput] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const createListingMutation = useMutation({
    fn: useServerFn(createListing),
    onSuccess: () => {
      // Navigate back to listings page after successful creation
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

  // Handlers for array fields
  const handleAsinsAdd = () => {
    if (asinsInput.trim()) {
      setFormData({
        ...formData,
        asins: [...formData.asins, asinsInput.trim()]
      });
      setAsinsInput('');
    }
  };

  const handleKeywordsAdd = () => {
    if (keywordsInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordsInput.trim()]
      });
      setKeywordsInput('');
    }
  };

  const handleBulletPointAdd = () => {
    if (bulletPointInput.trim()) {
      setFormData({
        ...formData,
        bullet_points: [...formData.bullet_points, bulletPointInput.trim()]
      });
      setBulletPointInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Client-side validation before sending to server
      createCombinedSchema.parse(formData);
      createListingMutation.mutate({
        data: formData
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Listing</h1>
        <button
          onClick={() => navigate({ to: '/listings' })}
          className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
        >
          Cancel
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Listing Fields */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">Product Details</h3>
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2">
              Marketplace
            </label>
            <input
              type="text"
              name="marketplace"
              value={formData.marketplace}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
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
          
          <div>
            <label className="block text-gray-700 font-bold mb-2">
              Tone (1-10)
            </label>
            <input
              type="range"
              name="tone"
              min="1"
              max="10"
              value={formData.tone}
              onChange={handleInputChange}
              className="w-full"
            />
            <div className="flex justify-between">
              <span>1</span>
              <span>{formData.tone}</span>
              <span>10</span>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-bold mb-2">
              ASINs
            </label>
            <div className="flex">
              <input
                type="text"
                value={asinsInput}
                onChange={(e) => setAsinsInput(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter ASIN and press Add"
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
              {formData.asins.map((asin, index) => (
                <span key={index} className="bg-gray-200 px-2 py-1 rounded mr-2 mb-2">
                  {asin}
                  <button
                    type="button"
                    className="ml-1 text-red-500"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        asins: formData.asins.filter((_, i) => i !== index)
                      });
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-bold mb-2">
              Keywords
            </label>
            <div className="flex">
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter keyword and press Add"
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
              {formData.keywords.map((keyword, index) => (
                <span key={index} className="bg-gray-200 px-2 py-1 rounded mr-2 mb-2">
                  {keyword}
                  <button
                    type="button"
                    className="ml-1 text-red-500"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        keywords: formData.keywords.filter((_, i) => i !== index)
                      });
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Listing Version Fields */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">Content Details</h3>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-bold mb-2">
              Bullet Points
            </label>
            <div className="flex">
              <input
                type="text"
                value={bulletPointInput}
                onChange={(e) => setBulletPointInput(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter bullet point and press Add"
              />
              <button
                type="button"
                onClick={handleBulletPointAdd}
                className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add
              </button>
            </div>
            <div className="mt-2">
              {formData.bullet_points.map((point, index) => (
                <div key={index} className="flex items-center bg-gray-100 p-2 rounded mb-2">
                  <span className="mr-2">•</span>
                  <span className="flex-grow">{point}</span>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        bullet_points: formData.bullet_points.filter((_, i) => i !== index)
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {formData.bullet_points.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">Add at least one bullet point</p>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={createListingMutation.status === 'pending'}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {createListingMutation.status === 'pending' ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
} 