# Product Status Filter Fix - Store Display

## সমস্যা (Problem)
Admin panel থেকে product upload করার পর সেগুলো store-এ show করছিল না। কারণ:
- Categories এবং Brands-এর জন্য `status === 'Active'` filter ছিল
- কিন্তু **Products-এর জন্য কোনো status filter ছিল না**
- ফলে Draft বা Inactive status এর products-ও store-এ দেখাচ্ছিল না

## সমাধান (Solution)
Store-এ শুধুমাত্র **Active status** এর products দেখানোর জন্য নিচের files-এ filter যোগ করা হয়েছে:

### 1. **StoreHome.tsx**
```typescript
// Before
const displayProducts = products && products.length > 0 ? products : INITIAL_PRODUCTS;

// After
const displayProducts = useMemo(() => {
  const allProducts = products && products.length > 0 ? products : INITIAL_PRODUCTS;
  return allProducts.filter(p => !p.status || p.status === 'Active');
}, [products]);
```

### 2. **StoreCategoryProducts.tsx**
```typescript
// Added activeProducts filter
const activeProducts = useMemo(() => 
  products.filter(p => !p.status || p.status === 'Active'), 
  [products]
);

// Updated filtered products to use activeProducts
const filtered = useMemo(() => activeProducts.filter(p => {
  // ... filtering logic
}), [activeProducts, selectedCategory, selectedBrand, isAll, isBrandFilter, brandFromUrl]);

// Updated catBrands to use activeProducts
const catBrands = useMemo(() => {
  if (isAll) return activeBrands;
  const names = new Set(activeProducts.filter(p => eq(p.category, selectedCategory)).map(p => p.brand).filter(Boolean));
  return activeBrands.filter(b => names.has(b.name));
}, [activeProducts, selectedCategory, activeBrands, isAll]);
```

### 3. **StoreProductDetail.tsx**
```typescript
// Filter catalog products for related products
const catalogProducts = useMemo(() => {
  const allProducts = Array.isArray(productCatalog) && productCatalog.length ? productCatalog : PRODUCTS;
  return allProducts.filter(p => !p.status || p.status === 'Active');
}, [productCatalog]);
```

### 4. **StoreHeader.tsx**
```typescript
// Filter products in search
const catalogSource = useMemo(
  () => {
    const allProducts = Array.isArray(productCatalog) && productCatalog.length ? productCatalog : PRODUCTS;
    return allProducts.filter(p => !p.status || p.status === 'Active');
  },
  [productCatalog]
);
```

## ফিল্টার লজিক (Filter Logic)
```typescript
// শুধুমাত্র Active বা কোনো status নেই এমন products দেখাবে
products.filter(p => !p.status || p.status === 'Active')
```

এই filter নিশ্চিত করে যে:
- ✅ `status: 'Active'` products দেখাবে
- ✅ `status` field নেই এমন products দেখাবে (backward compatibility)
- ❌ `status: 'Draft'` products লুকিয়ে থাকবে
- ❌ অন্য কোনো inactive status এর products লুকিয়ে থাকবে

## টেস্টিং (Testing)
Admin panel থেকে:
1. একটি নতুন product তৈরি করুন এবং status `Active` রাখুন → Store-এ দেখা যাবে ✅
2. Product edit করে status `Draft` করুন → Store থেকে লুকিয়ে যাবে ✅
3. আবার status `Active` করুন → Store-এ ফিরে আসবে ✅

## প্রভাব (Impact)
- ✅ Admin panel-এ সব products (Active + Draft) দেখা যাবে
- ✅ Store-এ শুধুমাত্র Active products দেখা যাবে
- ✅ Search, Categories, Related Products সব জায়গায় filter কাজ করবে
- ✅ কোনো breaking changes নেই

## Implementation Date
December 31, 2025
