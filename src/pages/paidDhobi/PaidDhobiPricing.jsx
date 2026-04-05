import React, { useState } from 'react';
import { useAllPaidPricing } from '../../hooks/usePaidPricing';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import PricingTable from '../../components/paidDhobi/PricingTable';
import toast from 'react-hot-toast';

const PaidDhobiPricing = () => {
  const { items, loading } = useAllPaidPricing();
  const { userData } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: '',
    category: 'Topwear',
    pricePerPiece: '',
    unit: 'per piece',
    isAvailable: true,
    iconEmoji: '👕'
  });

  if (loading) return <Loader fullScreen />;

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const numPrice = Number(newItem.pricePerPiece);
      if (!newItem.itemName || isNaN(numPrice) || numPrice <= 0) {
        toast.error("Valid name and price required");
        return;
      }

      await addDoc(collection(db, 'paidPricing'), {
        ...newItem,
        pricePerPiece: numPrice,
        displayOrder: items.length + 1,
        lastUpdatedBy: userData.uid,
        lastUpdatedAt: serverTimestamp()
      });

      toast.success('Pricelist item added successfully');
      setIsModalOpen(false);
      setNewItem({ ...newItem, itemName: '', pricePerPiece: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to add item');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in-up pb-20">
      <div className="mb-6 flex justify-between items-center bg-amber-50 p-6 rounded-2xl border border-amber-200">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Manage Service Pricing</h1>
          <p className="text-sm text-amber-700 mt-1">Changes take effect immediately for all students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-amber-600/20 sm:flex hidden items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add New Item
        </button>
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full mb-6 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl sm:hidden flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        Add New Item
      </button>

      <PricingTable items={items} />

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
             <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-amber-50">
               <h2 className="font-bold text-lg">Add Pricing Item</h2>
               <button onClick={() => setIsModalOpen(false)} className="hover:bg-amber-800 rounded p-1 transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
             </div>
             
             <form onSubmit={handleAdd} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label>
                  <input required type="text" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. Formal Shirt" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                    <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500">
                      <option>Topwear</option>
                      <option>Bottomwear</option>
                      <option>Ethnic</option>
                      <option>Bedding</option>
                      <option>Misc</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input required type="number" min="1" value={newItem.pricePerPiece} onChange={e => setNewItem({...newItem, pricePerPiece: e.target.value})} className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. 25" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Unit</label>
                    <input type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" placeholder="per piece" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Emoji Icon</label>
                    <input type="text" value={newItem.iconEmoji} onChange={e => setNewItem({...newItem, iconEmoji: e.target.value})} className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
                 </div>
               </div>

               <div className="pt-2">
                 <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-600/30">
                   Add Item
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaidDhobiPricing;
