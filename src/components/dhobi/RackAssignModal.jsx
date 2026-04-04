import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { sendNotification } from '../../utils/sendNotification';

const RackAssignModal = ({ isOpen, onClose, order }) => {
  const [rackNo, setRackNo] = useState('');
  const [assigning, setAssigning] = useState(false);

  if (!isOpen || !order) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!rackNo.trim()) {
      toast.error('Please enter a rack number');
      return;
    }

    setAssigning(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'readyInRack',
        rackNo: rackNo.trim(),
        rackAssignedTime: new Date()
      });

      // Send Notification to student
      await sendNotification(
        order.studentId,
        `✅ Your laundry (${order.tokenId}) is clean and ready for pickup! Collect it from Rack ${rackNo.trim()}. — SmartDhobi`
      );

      toast.success(`Assigned to Rack ${rackNo.trim()}`);
      setRackNo('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign rack');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Assign Rack</h3>
            <p className="text-sm text-slate-500">Order: <span className="font-mono text-slate-700">{order.tokenId}</span> ({order.studentName})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-md border border-slate-200">✕</button>
        </div>
        
        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-200 flex items-center justify-center text-teal-800 font-bold text-xl shrink-0">
              {order.studentName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-800">{order.studentName}</p>
              <p className="text-sm text-slate-600">Room: {order.studentRoom}</p>
            </div>
          </div>

          <form onSubmit={handleAssign}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rack Number *</label>
              <input 
                type="text" 
                required
                value={rackNo}
                onChange={(e) => setRackNo(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-4 text-center text-3xl font-bold font-mono focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-teal-700"
                placeholder="e.g. R-5"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="flex-[2] py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex justify-center items-center shadow-lg shadow-teal-600/30 transition-colors"
              >
                {assigning ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Assign & Notify Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RackAssignModal;
