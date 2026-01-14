/**
 * useAppHandlers.ts - All application handlers extracted from App.tsx
 */
import React, { useCallback, useMemo } from 'react';
import type {
  Product, Order, ThemeConfig, WebsiteConfig, DeliveryConfig,
  ProductVariantSelection, LandingPage, CourierConfig, Role, User
} from '../types';
import type { LandingCheckoutPayload } from '../components/LandingPageComponents';
import { DataService } from '../services/DataService';
import { ensureUniqueProductSlug, ensureVariantSelection, isAdminRole } from '../utils/appHelpers';

// Lazy load toast
let toastModule: typeof import('react-hot-toast') | null = null;
const getToast = async () => {
  if (toastModule) return toastModule;
  toastModule = await import('react-hot-toast');
  return toastModule;
};
const toast = {
  success: (msg: string) => getToast().then(m => m.toast.success(msg)),
  error: (msg: string) => getToast().then(m => m.toast.error(msg)),
};

interface UseAppHandlersProps {
  activeTenantId: string;
  products: Product[];
  orders: Order[];
  roles: Role[];
  wishlist: number[];
  checkoutQuantity: number;
  selectedProduct: Product | null;
  selectedVariant: ProductVariantSelection | null;
  user: User | null;
  cartItems: any[];
  
  // Setters
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setWishlist: React.Dispatch<React.SetStateAction<number[]>>;
  setCheckoutQuantity: React.Dispatch<React.SetStateAction<number>>;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedVariant: React.Dispatch<React.SetStateAction<ProductVariantSelection | null>>;
  setSelectedLandingPage: React.Dispatch<React.SetStateAction<LandingPage | null>>;
  setCurrentView: (view: any) => void;
  setLogo: React.Dispatch<React.SetStateAction<string | null>>;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig | null>>;
  setWebsiteConfig: React.Dispatch<React.SetStateAction<WebsiteConfig | undefined>>;
  setDeliveryConfig: React.Dispatch<React.SetStateAction<DeliveryConfig[]>>;
  setCourierConfig: React.Dispatch<React.SetStateAction<CourierConfig>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setSubCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setChildCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setBrands: React.Dispatch<React.SetStateAction<any[]>>;
  setTags: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Functions
  handleAddProductToCart: (product: Product, quantity: number, variant?: ProductVariantSelection, options?: { silent?: boolean }) => void;
}

export function useAppHandlers(props: UseAppHandlersProps) {
  const {
    activeTenantId,
    products,
    orders,
    roles,
    wishlist,
    checkoutQuantity,
    selectedProduct,
    selectedVariant,
    user,
    setProducts,
    setOrders,
    setRoles,
    setWishlist,
    setCheckoutQuantity,
    setSelectedProduct,
    setSelectedVariant,
    setSelectedLandingPage,
    setCurrentView,
    setLogo,
    setThemeConfig,
    setWebsiteConfig,
    setDeliveryConfig,
    setCourierConfig,
    setCategories,
    setSubCategories,
    setChildCategories,
    setBrands,
    setTags,
    handleAddProductToCart,
  } = props;

  // === ROLE HANDLERS ===
  const handleAddRole = useCallback((newRole: Role) => {
    const scopedRole = { ...newRole, tenantId: newRole.tenantId || activeTenantId };
    setRoles(prev => [...prev, scopedRole]);
  }, [activeTenantId, setRoles]);

  const handleUpdateRole = useCallback((updatedRole: Role) => {
    const scopedRole = { ...updatedRole, tenantId: updatedRole.tenantId || activeTenantId };
    setRoles(prev => prev.map(r => r.id === scopedRole.id ? scopedRole : r));
  }, [activeTenantId, setRoles]);

  const handleDeleteRole = useCallback((roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  }, [setRoles]);

  // === PRODUCT HANDLERS ===
  const handleAddProduct = useCallback((newProduct: Product) => {
    const tenantId = newProduct.tenantId || activeTenantId;
    const slug = ensureUniqueProductSlug(newProduct.slug || newProduct.name || `product-${newProduct.id}`, products, tenantId, newProduct.id);
    setProducts(prev => [...prev, { ...newProduct, slug, tenantId }]);
  }, [activeTenantId, products, setProducts]);

  const handleUpdateProduct = useCallback((updatedProduct: Product) => {
    const tenantId = updatedProduct.tenantId || activeTenantId;
    const slug = ensureUniqueProductSlug(updatedProduct.slug || updatedProduct.name || `product-${updatedProduct.id}`, products, tenantId, updatedProduct.id);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...updatedProduct, slug, tenantId } : p));
  }, [activeTenantId, products, setProducts]);

  const handleDeleteProduct = useCallback((id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [setProducts]);

  const handleBulkDeleteProducts = useCallback((ids: number[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
  }, [setProducts]);

  const handleBulkUpdateProducts = useCallback((ids: number[], updates: Partial<Product>) => {
    const { slug, ...restUpdates } = updates;
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, ...restUpdates } : p));
  }, [setProducts]);

  // === ORDER HANDLERS ===
  const handleUpdateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates, tenantId: o.tenantId || activeTenantId } : o));
  }, [activeTenantId, setOrders]);

  // === WISHLIST HANDLERS ===
  const addToWishlist = useCallback((id: number) => {
    setWishlist(prev => prev.includes(id) ? prev : [...prev, id]);
  }, [setWishlist]);

  const removeFromWishlist = useCallback((id: number) => {
    setWishlist(prev => prev.filter(wId => wId !== id));
  }, [setWishlist]);

  const isInWishlist = useCallback((id: number) => wishlist.includes(id), [wishlist]);

  // === CHECKOUT HANDLERS ===
  const handleCheckoutStart = useCallback((product: Product, quantity: number = 1, variant?: ProductVariantSelection) => {
    setSelectedProduct(product);
    setCheckoutQuantity(quantity);
    setSelectedVariant(ensureVariantSelection(product, variant));
    setCurrentView('checkout');
    window.history.pushState({}, '', '/checkout');
    // Preload success page while user is filling checkout form
    import('../pages/StoreOrderSuccess').catch(() => {});
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [setSelectedProduct, setCheckoutQuantity, setSelectedVariant, setCurrentView]);

  const handleCheckoutFromCart = useCallback((productId: number) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) {
      toast.error('Product unavailable for checkout');
      return;
    }
    handleCheckoutStart(targetProduct, 1, ensureVariantSelection(targetProduct));
  }, [products, handleCheckoutStart]);

  const handlePlaceOrder = useCallback(async (formData: any) => {
    const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      customer: formData.fullName,
      location: formData.address,
      amount: formData.amount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      email: formData.email,
      phone: formData.phone,
      division: formData.division,
      variant: ensureVariantSelection(selectedProduct, formData.variant || selectedVariant),
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      quantity: formData.quantity || checkoutQuantity,
      deliveryType: formData.deliveryType,
      deliveryCharge: formData.deliveryCharge
    };

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const response = await fetch(`${apiBase}/api/orders/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrders(prev => [result.data || newOrder, ...prev]);
      } else {
        setOrders(prev => [newOrder, ...prev]);
      }
    } catch (error) {
      setOrders(prev => [newOrder, ...prev]);
    }

    setCurrentView('success');
    window.history.pushState({}, '', `/success-order?orderId=${encodeURIComponent(orderId)}`);
    window.scrollTo(0, 0);
  }, [activeTenantId, selectedProduct, selectedVariant, checkoutQuantity, setOrders, setCurrentView]);

  const handleLandingOrderSubmit = useCallback(async (payload: LandingCheckoutPayload & { pageId: string; productId: number }) => {
    const product = products.find(p => p.id === payload.productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    const orderId = `LP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderAmount = product.price * payload.quantity;
    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      customer: payload.fullName,
      location: payload.address,
      phone: payload.phone,
      amount: orderAmount,
      date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      email: payload.email,
      division: payload.division,
      variant: ensureVariantSelection(product),
      productId: product.id,
      productName: product.name,
      quantity: payload.quantity,
      source: 'landing_page',
      landingPageId: payload.pageId
    };

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/orders/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOrders(prev => [result.data || newOrder, ...prev]);
        toast.success(`Order ${orderId} placed successfully! You will be contacted soon.`);
        
        // Show success message and redirect after 2 seconds
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      } else {
        setOrders(prev => [newOrder, ...prev]);
        toast.success(`Order ${orderId} placed successfully! You will be contacted soon.`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setOrders(prev => [newOrder, ...prev]);
      toast.success(`Order ${orderId} placed successfully! You will be contacted soon.`);
    }
  }, [activeTenantId, products, setOrders]);

  const handleCloseLandingPreview = useCallback(() => {
    setSelectedLandingPage(null);
    setCurrentView(isAdminRole(user?.role) ? 'admin' : 'store');
  }, [user, setSelectedLandingPage, setCurrentView]);

  // === CONFIG HANDLERS ===
  const handleUpdateLogo = useCallback((newLogo: string | null) => setLogo(newLogo), [setLogo]);
  
  const handleUpdateTheme = useCallback(async (newConfig: ThemeConfig) => {
    console.log('[handleUpdateTheme] Updating theme config:', newConfig);
    setThemeConfig(newConfig);
    if (activeTenantId) {
      console.log('[handleUpdateTheme] Saving to DataService for tenant:', activeTenantId);
      await DataService.saveImmediate('theme_config', newConfig, activeTenantId);
      console.log('[handleUpdateTheme] Saved to DataService successfully');
    }
  }, [activeTenantId, setThemeConfig]);

  const handleUpdateWebsiteConfig = useCallback(async (newConfig: WebsiteConfig) => {
    setWebsiteConfig(newConfig);
    if (activeTenantId) {
      await DataService.saveImmediate('website_config', newConfig, activeTenantId);
    }
  }, [activeTenantId, setWebsiteConfig]);

  const handleUpdateCourierConfig = useCallback((config: CourierConfig) => setCourierConfig(config), [setCourierConfig]);
  const handleUpdateDeliveryConfig = useCallback((configs: DeliveryConfig[]) => setDeliveryConfig(configs), [setDeliveryConfig]);

  // === CATALOG CRUD HANDLERS ===
  // Memoize catalog handlers to prevent re-creation loops
  const catHandlers = useMemo(() => ({
    add: (item: any) => {
      setCategories(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('categories', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setCategories(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('categories', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setCategories(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('categories', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setCategories]);

  const subCatHandlers = useMemo(() => ({
    add: (item: any) => {
      setSubCategories(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('subcategories', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setSubCategories(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('subcategories', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setSubCategories(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('subcategories', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setSubCategories]);

  const childCatHandlers = useMemo(() => ({
    add: (item: any) => {
      setChildCategories(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('childcategories', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setChildCategories(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('childcategories', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setChildCategories(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('childcategories', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setChildCategories]);

  const brandHandlers = useMemo(() => ({
    add: (item: any) => {
      setBrands(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('brands', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setBrands(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('brands', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setBrands(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('brands', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setBrands]);

  const tagHandlers = useMemo(() => ({
    add: (item: any) => {
      setTags(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save('tags', updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setTags(prev => {
        const updated = prev.map((i: any) => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save('tags', updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setTags(prev => {
        const updated = prev.filter((i: any) => i.id !== id);
        DataService.save('tags', updated, activeTenantId);
        return updated;
      });
    }
  }), [activeTenantId, setTags]);

  return {
    // Role handlers
    handleAddRole,
    handleUpdateRole,
    handleDeleteRole,
    
    // Product handlers
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleBulkDeleteProducts,
    handleBulkUpdateProducts,
    
    // Order handlers
    handleUpdateOrder,
    
    // Wishlist handlers
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    
    // Checkout handlers
    handleCheckoutStart,
    handleCheckoutFromCart,
    handlePlaceOrder,
    handleLandingOrderSubmit,
    handleCloseLandingPreview,
    
    // Config handlers
    handleUpdateLogo,
    handleUpdateTheme,
    handleUpdateWebsiteConfig,
    handleUpdateCourierConfig,
    handleUpdateDeliveryConfig,
    
    // Catalog handlers
    catHandlers,
    subCatHandlers,
    childCatHandlers,
    brandHandlers,
    tagHandlers,
  };
}

export type AppHandlers = ReturnType<typeof useAppHandlers>;
