import { FoodCategory } from '../constants';

export interface FoodImageData {
  url: string;
  category: string;
  photographer?: string;
  downloadUrl?: string | null;
}

const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';

/**
 * Fetch a random food image from Unsplash API
 * Falls back to Picsum if API fails or key is missing
 */
export const fetchFoodImage = async (category: FoodCategory): Promise<FoodImageData> => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('Unsplash API key not found, using fallback images');
    return getFallbackImage(category);
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}?` +
      `query=${encodeURIComponent(category)}&` +
      `orientation=squarish&` +
      `content_filter=high&` +
      `client_id=${accessKey}`
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      url: data.urls.regular, // 1080px image
      category,
      photographer: data.user.name,
      downloadUrl: data.links.download_location,
    };
  } catch (error) {
    console.error('Failed to fetch from Unsplash:', error);
    return getFallbackImage(category);
  }
};

/**
 * Fallback to Picsum photos when Unsplash fails
 */
const getFallbackImage = (category: FoodCategory): FoodImageData => {
  const randomId = Math.floor(Math.random() * 1000);
  return {
    url: `https://picsum.photos/600?random=${randomId}`,
    category,
    photographer: 'Unknown',
    downloadUrl: null,
  };
};
