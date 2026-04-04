import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { formatStandardDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const PricingTable = ({ items }) => {
  const { userData } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditPrice(item.pricePerPiece);
    setEditAvailable(item.isAvailable);
  };

  const handleSave = async (id) => {
    try {
      const numPrice = Number(editPrice);
      if (isNaN(numPrice) || numPrice < 1 || numPrice > 9999) {
        toast.error('Price must be a number between 1 and 9999');
        return;
      }
      
      await supabase.from('paid_pricing').update({
        price_per_piece: numPrice,
        is_available: editAvailable,
        updated_by: userData.id,
        updated_at: new Date()
      }).eq('id', id);
      
      toast.success('Price updated — students will see this immediately');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update price');
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to remove this item? (It will just be hidden from students)")) {
      try {
        await supabase.from('paid_pricing').update({
          is_available: false,
          updated_by: userData.id,
          updated_at: new Date()
        }).eq('id', id);
        toast.success('Item removed successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to remove item');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price (₹)</th>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Available</th>
              <th className="px-6 py-4 hidden md:table-cell">Last Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
               <tr><td colSpan="7" className="text-center p-8">No pricing items found</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.iconEmoji}</span>
                    <span className="font-bold text-slate-800">{item.itemName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{item.category}</td>
                
                <td className="px-6 py-4">
                  {editingId === item.id ? (
                    <input 
                      type="number" 
                      value={editPrice} 
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-20 border border-amber-300 rounded px-2 py-1 focus:ring-amber-500 focus:border-amber-500 font-bold text-slate-800"
                    />
                  ) : (
                    <span className="font-bold text-slate-800 text-base">₹{item.pricePerPiece}</span>
                  )}
                </td>

                <td className="px-6 py-4 text-xs">{item.unit}</td>

                <td className="px-6 py-4">
                  {editingId === item.id ? (
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={editAvailable} onChange={e => setEditAvailable(e.target.checked)} />
                       <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                     </label>
                  ) : (
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                       {item.isAvailable ? 'Yes' : 'No'}
                     </span>
                  )}
                </td>

                <td className="px-6 py-4 text-[10px] hidden md:table-cell text-slate-400">
                  {item.lastUpdatedAt ? formatStandardDate(item.lastUpdatedAt) : 'Never'}
                </td>

                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  {editingId === item.id ? (
                    <>
                      <button onClick={() => handleSave(item.id)} className="text-green-600 hover:text-green-800 font-bold text-xs bg-green-50 px-3 py-1.5 rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditClick(item)} className="text-amber-600 hover:text-amber-800 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded border border-amber-200">Edit</button>
                      <button onClick={() => handleDeleteClick(item.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-3 py-1.5 rounded border border-red-100">Remove</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingTable;
