import React, { useState, useEffect, useRef } from 'react';

interface ProductPricingAndStockProps {
  onDataChange?: (data: ProductPricingData) => void;
  initialData?: Partial<ProductPricingData>;
}

export interface ProductPricingData {
  regularPrice: number;
  salesPrice: number;
  costPrice: number;
  stockValue: number;
  sku: string;
  isWholesale: boolean;
}

const ProductPricingAndStock: React.FC<ProductPricingAndStockProps> = ({
  onDataChange,
  initialData = {} as Partial<ProductPricingData>
}) => {
  const [formData, setFormData] = useState<ProductPricingData>({
    regularPrice: initialData?.regularPrice ?? 0,
    salesPrice: initialData?.salesPrice ?? 0,
    costPrice: initialData?.costPrice ?? 0,
    stockValue: initialData?.stockValue ?? 0,
    sku: initialData?.sku ?? '',
    isWholesale: initialData?.isWholesale ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isInitialMount = useRef(true);

  // Validate required fields
  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };
    
    if (field === 'regularPrice' && (!value || value <= 0)) {
      newErrors.regularPrice = 'Regular price is required and must be greater than 0';
    } else {
      delete newErrors.regularPrice;
    }

    if (field === 'stockValue' && (!value || value < 0)) {
      newErrors.stockValue = 'Stock value is required and must be 0 or greater';
    } else {
      delete newErrors.stockValue;
    }

    setErrors(newErrors);
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ProductPricingData
  ) => {
    const { type, value, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedData = {
      ...formData,
      [field]: type === 'checkbox' ? checked : (field !== 'sku' ? parseFloat(value) || 0 : value),
    };

    setFormData(updatedData);
    validateField(field, newValue);
  };

  // Notify parent of changes (skip initial mount to prevent infinite loop)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  return (
    <div className="flex flex-col gap-6 p-6 border border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-800 m-0">Price And Stock</h3>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.isWholesale}
            onChange={(e) => handleInputChange(e, 'isWholesale')}
            className="w-5 h-5 cursor-pointer accent-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700">Is Wholesale</span>
        </label>
      </div>

      {/* Price Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       
         <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 capitalize">Regular Price</label>
          <input
            type="number"
            value={formData.salesPrice || ''}
            onChange={(e) => handleInputChange(e, 'salesPrice')}
            placeholder="675"
            className="px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-300"
            min="0"
            step="0.01"
          />
        </div>
       
       
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 capitalize">
            Sale Price<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            value={formData.regularPrice || ''}
            onChange={(e) => handleInputChange(e, 'regularPrice')}
            placeholder="900"
            className={`px-4 py-3 border rounded-md text-base text-gray-800 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-300 ${errors.regularPrice ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'}`}
            min="0"
            step="0.01"
          />
          {errors.regularPrice && (
            <p className="text-xs text-red-500 m-0 mt-1">{errors.regularPrice}</p>
          )}
        </div>
      </div>

      {/* Cost, Stock, SKU Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 capitalize">Cost Price</label>
          <input
            type="number"
            value={formData.costPrice || ''}
            onChange={(e) => handleInputChange(e, 'costPrice')}
            placeholder="340"
            className="px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-300"
            min="0"
            step="0.01"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 capitalize">
            Stock Quantity<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            value={formData.stockValue || ''}
            onChange={(e) => handleInputChange(e, 'stockValue')}
            placeholder="10"
            className={`px-4 py-3 border rounded-md text-base text-gray-800 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-300 ${errors.stockValue ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'}`}
            min="0"
            step="1"
          />
          {errors.stockValue && (
            <p className="text-xs text-red-500 m-0 mt-1">{errors.stockValue}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500 capitalize">SKU</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => handleInputChange(e, 'sku')}
            placeholder="CS-FROG-EDU-TOY"
            className="px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductPricingAndStock;
