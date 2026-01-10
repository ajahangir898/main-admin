import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  suggestedProducts: Product[];
  onAddToCart?: (products: Product[]) => void;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  mainProduct,
  suggestedProducts,
  onAddToCart
}) => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([mainProduct.id]);

  useEffect(() => {
    // Always include main product
    if (!selectedProducts.includes(mainProduct.id)) {
      setSelectedProducts([mainProduct.id, ...selectedProducts]);
    }
  }, [mainProduct.id]);

  const toggleProduct = (productId: number) => {
    if (productId === mainProduct.id) return; // Main product always selected

    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const allProducts = [mainProduct, ...suggestedProducts];
  const selectedProductsData = allProducts.filter(p => selectedProducts.includes(p.id));
  const totalPrice = selectedProductsData.reduce((sum, p) => sum + p.price, 0);
  const originalTotal = selectedProductsData.reduce((sum, p) => sum + (p.originalPrice || p.price), 0);
  const savings = originalTotal - totalPrice;

  const handleAddAll = () => {
    onAddToCart?.(selectedProductsData);
  };

  return (
    <div className="enhanced-fbt-section">
      <h3 className="enhanced-fbt-title">Frequently Bought Together</h3>
      
      <div className="enhanced-fbt-container">
        {allProducts.slice(0, 3).map((product, index) => (
          <React.Fragment key={product.id}>
            <div
              className={`enhanced-fbt-product ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
              onClick={() => toggleProduct(product.id)}
            >
              <img
                src={normalizeImageUrl(product.galleryImages?.[0] || product.image)}
                alt={product.name}
                className="enhanced-fbt-product-image"
              />
              <div className="enhanced-fbt-product-name line-clamp-2">{product.name}</div>
              <div className="enhanced-fbt-product-price">৳{product.price.toLocaleString()}</div>
              {product.id === mainProduct.id && (
                <div className="text-xs text-purple-600 font-semibold mt-1">This item</div>
              )}
            </div>
            {index < Math.min(allProducts.length - 1, 2) && (
              <div className="enhanced-fbt-plus">+</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="enhanced-fbt-total">
        <div>
          <div className="enhanced-fbt-total-label">Total for {selectedProducts.length} items:</div>
          {savings > 0 && (
            <div className="text-sm text-gray-500">
              Save ৳{savings.toLocaleString()}
            </div>
          )}
        </div>
        <div className="enhanced-fbt-total-price">৳{totalPrice.toLocaleString()}</div>
      </div>

      <button className="enhanced-fbt-add-btn" onClick={handleAddAll}>
        Add {selectedProducts.length} {selectedProducts.length === 1 ? 'Item' : 'Items'} to Cart
      </button>
    </div>
  );
};

export default FrequentlyBoughtTogether;
