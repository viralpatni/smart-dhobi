import React, { useState } from 'react';

const DeliveryModal = ({ isOpen, onClose, onConfirm, order }) => {
  const [paymentOption, setPaymentOption] = useState('collected'); // collected, pending, waived
  
  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    onConfirm(paymentOption);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-amber-50">
          <h2 className="font-bold text-lg">Confirm Delivery</h2>
          <button onClick={onClose} className="hover:bg-amber-800 rounded p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Student</p>
              <p className="font-bold text-slate-800 text-lg">{order.studentName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Room</p>
              <p className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{order.studentRoom}</p>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6 text-center">
             <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Total Amount Due</p>
             <p className="text-3xl font-black text-amber-900">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
          </div>
          
          <div className="space-y-3 mb-8">
            <p className="text-sm font-bold text-slate-700 mb-2">Payment Collection Status</p>
            
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentOption === 'collected' ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" className="w-4 h-4 text-green-600 focus:ring-green-500" name="paymentOption" checked={paymentOption === 'collected'} onChange={() => setPaymentOption('collected')} />
              <div className="flex-1">
                <span className="block font-bold text-green-800">Cash Collected</span>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentOption === 'pending' ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" className="w-4 h-4 text-red-600 focus:ring-red-500" name="paymentOption" checked={paymentOption === 'pending'} onChange={() => setPaymentOption('pending')} />
              <div className="flex-1">
                <span className="block font-bold text-red-800">Payment Pending</span>
              </div>
            </label>
            
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentOption === 'waived' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" className="w-4 h-4 text-amber-600 focus:ring-amber-500" name="paymentOption" checked={paymentOption === 'waived'} onChange={() => setPaymentOption('waived')} />
              <div className="flex-1">
                <span className="block font-bold text-amber-800">Waived</span>
              </div>
            </label>
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-600/30"
          >
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
