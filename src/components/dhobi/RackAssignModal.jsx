import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { sendNotification } from '../../utils/sendNotification';

const RackAssignModal = ({ isOpen, onClose, order }) => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const q = query(collection(db, 'racks'));
    const unsub = onSnapshot(q, (snapshot) => {
      const rackData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort numerically by rack number
      rackData.sort((a, b) => parseInt(a.rackNumber) - parseInt(b.rackNumber));
      setRacks(rackData);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen]);

  const handleAssign = async (rack) => {
    if (rack.isOccupied) return;
    
    setAssigning(true);
    try {
      // 1. Update Order
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'readyInRack',
        rackNo: rack.rackNumber,
        rackAssignedTime: new Date()
      });

      // 2. Update Rack
      const rackRef = doc(db, 'racks', rack.id);
      await updateDoc(rackRef, {
        isOccupied: true,
        currentOrderId: order.id
      });

      // 3. Send Notification
      await sendNotification(
        order.studentPhone,
        `🎉 Your laundry is clean and ready! Please collect from Rack No. ${rack.rackNumber}. — SmartDhobi`
      );

      toast.success(`Assigned to Rack ${rack.rackNumber}`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign rack');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Assign Rack</h3>
            <p className="text-sm text-slate-500">Order: <span className="font-mono text-slate-700">{order.tokenId}</span> ({order.studentName})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {racks.map(rack => (
                <button
                  key={rack.id}
                  disabled={rack.isOccupied || assigning}
                  onClick={() => handleAssign(rack)}
                  className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-center h-20 transition-all font-medium
                    ${rack.isOccupied 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed hidden' // Or opacity-50
                      : 'bg-white border-teal-100 text-teal-700 hover:border-teal-400 hover:bg-teal-50 cursor-pointer shadow-sm'
                    }
                  `}
                >
                  <span className="text-xs uppercase mb-1">Rack</span>
                  <span className="text-xl font-bold">{rack.rackNumber}</span>
                  {rack.isOccupied && <span className="absolute inset-0 bg-slate-100/50 rounded-xl"></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RackAssignModal;
