
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { User, Order, WebsiteConfig, Product } from '../types';

// Lazy load heavy layout components from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

// Skeleton loaders removed for faster initial render
import { User as UserIcon, Mail, Phone, MapPin, Package, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';

interface StoreProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  orders: Order[];
  onHome: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
   searchValue?: string;
   onSearchChange?: (value: string) => void;
   onImageSearchClick?: () => void;
   onOpenChat?: () => void;
   cart?: number[];
   onToggleCart?: (id: number) => void;
   onCheckoutFromCart?: (productId: number) => void;
   productCatalog?: Product[];
}

const StoreProfile = ({ 
  user, 
  onUpdateProfile, 
  orders, 
  onHome, 
  onLoginClick, 
  onLogoutClick,
  logo,
   websiteConfig,
   searchValue,
   onSearchChange,
   onImageSearchClick,
   onOpenChat,
   cart,
   onToggleCart,
   onCheckoutFromCart,
   productCatalog
}: StoreProfileProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Filter orders for this user - simulating match by name since we don't have proper Auth IDs in all mock data
  const myOrders = orders.filter(o => 
    o.customer.toLowerCase() === user.name.toLowerCase() || 
    (o.email && o.email.toLowerCase() === user.email.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...user,
      ...formData
    });
    setIsEditing(false);
    setSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Suspense fallback={null}>
        <StoreHeader 
          onHomeClick={onHome}
          onImageSearchClick={onImageSearchClick}
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={() => {}} // Already on profile
          logo={logo}
          websiteConfig={websiteConfig}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              cart={cart}
              onToggleCart={onToggleCart}
              onCheckoutFromCart={onCheckoutFromCart}
              productCatalog={productCatalog}
        />
      </Suspense>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
               <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 text-center btn-order rounded-none">
                     <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-theme-primary shadow-md">
                        <UserIcon size={32} />
                     </div>
                     <h3 className="text-white font-bold truncate">{user.name}</h3>
                     <p className="text-white/80 text-xs truncate">{user.email}</p>
                  </div>
                  <nav className="p-2">
                     <button 
                       onClick={() => setActiveTab('info')}
                       className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition mb-1 ${activeTab === 'info' ? 'bg-theme-primary/10 text-theme-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                     >
                        <UserIcon size={18} /> Personal Info
                     </button>
                     <button 
                       onClick={() => setActiveTab('orders')}
                       className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeTab === 'orders' ? 'bg-theme-primary/10 text-theme-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                     >
                        <Package size={18} /> My Orders
                     </button>
                  </nav>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
               
               {/* PERSONAL INFO TAB */}
               {activeTab === 'info' && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in">
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                       {!isEditing && (
                         <button 
                           onClick={() => setIsEditing(true)}
                           className="text-green-600 font-medium hover:underline text-sm"
                         >
                           Edit Details
                         </button>
                       )}
                    </div>

                    {successMsg && (
                      <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
                         <CheckCircle size={16} /> {successMsg}
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <label className="text-sm font-medium text-gray-500">Full Name</label>
                             <div className="relative">
                                <UserIcon size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                  type="text" 
                                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  readOnly={!isEditing}
                                />
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-sm font-medium text-gray-500">Email Address</label>
                             <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                  type="email" 
                                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-transparent bg-gray-50 text-gray-500 cursor-not-allowed"
                                  value={formData.email}
                                  readOnly
                                  title="Email cannot be changed"
                                />
                             </div>
                          </div>

                          <div className="space-y-1">
                             <label className="text-sm font-medium text-gray-500">Phone Number</label>
                             <div className="relative">
                                <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                  type="tel" 
                                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                  value={formData.phone}
                                  onChange={e => setFormData({...formData, phone: e.target.value})}
                                  readOnly={!isEditing}
                                  placeholder={isEditing ? "Enter phone number" : "Not set"}
                                />
                             </div>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                             <label className="text-sm font-medium text-gray-500">Address</label>
                             <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                                <textarea 
                                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none h-24 ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                  value={formData.address}
                                  onChange={e => setFormData({...formData, address: e.target.value})}
                                  readOnly={!isEditing}
                                  placeholder={isEditing ? "Enter delivery address" : "Not set"}
                                />
                             </div>
                          </div>
                       </div>

                       {isEditing && (
                          <div className="mt-8 flex gap-3 justify-end">
                             <button 
                               type="button" 
                               onClick={() => { setIsEditing(false); setFormData({name: user.name, email: user.email, phone: user.phone||'', address: user.address||''}); }}
                               className="px-6 py-2 rounded-lg border border-theme-primary/30 text-theme-primary font-medium hover:bg-theme-primary/10 transition"
                             >
                               Cancel
                             </button>
                             <button 
                               type="submit" 
                               className="btn-order px-6 py-2 rounded-lg"
                             >
                               Save Changes
                             </button>
                          </div>
                       )}
                    </form>
                 </div>
               )}

               {/* ORDERS TAB */}
               {activeTab === 'orders' && (
                 <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 animate-in fade-in">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Order History</h2>
                    
                    {myOrders.length > 0 ? (
                       <div className="space-y-4">
                          {myOrders.map(order => (
                             <div key={order.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b border-gray-50">
                                   <div>
                                      <div className="flex items-center gap-3">
                                         <span className="font-bold text-gray-800">{order.id}</span>
                                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-theme-hover/10 text-theme-hover'
                                         }`}>
                                            {order.status}
                                         </span>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">{order.date}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="font-bold text-gray-800">৳ {order.amount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-500">Total Amount</p>
                                   </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2 text-sm text-gray-600">
                                      {order.status === 'Delivered' && <><CheckCircle size={16} className="text-green-500"/> Delivered</>}
                                      {order.status === 'Pending' && <><Clock size={16} className="text-theme-hover"/> Processing</>}
                                      {order.status === 'Shipped' && <><Truck size={16} className="text-blue-500"/> On the way</>}
                                   </div>
                                   <button className="text-green-600 text-sm font-medium hover:underline">View Details</button>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="text-center py-12">
                          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Package size={32} className="text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                          <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
                          <button onClick={onHome} className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition">
                             Start Shopping
                          </button>
                       </div>
                    )}
                 </div>
               )}

            </div>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} onOpenChat={onOpenChat} />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreProfile;
