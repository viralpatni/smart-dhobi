import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

const MissingItemModal = ({ isOpen, onClose, order }) => {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) {
      toast.error('Description is required');
      return;
    }

    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        missingItemReported: true,
        missingItemDesc: desc
      });
      toast.success('Report submitted successfully. Staff will contact you.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden transform transition-all translate-y-0 opacity-100 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            ⚠️ Report Missing Item
          </h3>
          <button onClick={onClose} className="text-red-400 hover:text-red-600">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
             <p className="text-sm text-slate-500 mb-2">Order: <span className="font-mono text-slate-800">{order.tokenId}</span></p>
             <label className="block text-sm font-medium text-slate-700 mb-1">
               Description of missing items
             </label>
             <textarea
               className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-red-500 focus:border-red-500"
               rows="4"
               placeholder="E.g., One black Nike t-shirt, large size..."
               value={desc}
               onChange={(e) => setDesc(e.target.value)}
               disabled={loading}
             ></textarea>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex justify-center items-center"
              disabled={loading}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MissingItemModal;
