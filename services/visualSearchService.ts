/**
 * Visual Search Service using YOLO API
 * Lazy-loaded to avoid affecting initial page load
 */

export interface VisualSearchResult {
  searchTerms: string[];
  description: string;
  categories: string[];
  colors: string[];
  confidence: number;
}

// Get the YOLO API URL
const getApiUrl = (): string => {
  return import.meta.env.VITE_YOLO_API_URL || 'https://systemnextit.com/yolo-api';
};

/**
 * Analyze image using YOLO API
 * Returns search terms and product attributes
 */
export const analyzeImage = async (imageFile: File): Promise<VisualSearchResult> => {
  const apiUrl = getApiUrl();
  
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(`${apiUrl}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `YOLO API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error('No response from YOLO API');
  }

  const result = data.data;
  
  return {
    searchTerms: result.tags || [],
    description: result.description || '',
    categories: result.category ? [result.category, result.subcategory].filter(Boolean) : [],
    colors: result.color ? [result.color] : [],
    confidence: 85,
  };
};

/**
 * Search products by visual search results
 */
export const searchProductsByVisualResult = <T extends { 
  name: string; 
  description?: string; 
  category?: string; 
  tags?: string[];
  searchTags?: string[];
  colors?: string[];
}>(
  products: T[],
  visualResult: VisualSearchResult
): T[] => {
  const { searchTerms, categories, colors } = visualResult;
  
  // Create search terms set for faster lookup
  const searchSet = new Set(searchTerms.map(t => t.toLowerCase()));
  const categorySet = new Set(categories.map(c => c.toLowerCase()));
  const colorSet = new Set(colors.map(c => c.toLowerCase()));
  
  // Score each product
  const scoredProducts = products.map(product => {
    let score = 0;
    const productText = [
      product.name,
      product.description || '',
      product.category || '',
      ...(product.tags || []),
      ...(product.searchTags || []),
    ].join(' ').toLowerCase();
    
    // Match search terms
    for (const term of searchSet) {
      if (productText.includes(term)) {
        score += 10;
      }
    }
    
    // Match categories
    const productCategory = (product.category || '').toLowerCase();
    for (const cat of categorySet) {
      if (productCategory.includes(cat) || cat.includes(productCategory)) {
        score += 15;
      }
    }
    
    // Match colors
    const productColors = (product.colors || []).map(c => c.toLowerCase());
    for (const color of colorSet) {
      if (productColors.some(pc => pc.includes(color) || color.includes(pc))) {
        score += 5;
      }
    }
    
    return { product, score };
  });
  
  // Filter and sort by score
  return scoredProducts
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
};
