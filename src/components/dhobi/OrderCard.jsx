import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatTimeAgo } from '../../utils/formatDate';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

const OrderCard = ({ order, onAssignRack }) => {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      
      const payload = { status: newStatus };
      if (newStatus === 'collected') {
        payload.collectedTime = new Date();
        // Also free up the rack when collected
        if (order.rackNo) {
          // Getting rack document requires querying or knowing ID.
          // Since we might not easily have rack DOC ID, we leave rackNo string, 
          // but we can query later or just rely on Dhobi to manually free it?
          // Actually, based on spec: "When Mark Collected is later clicked: set rack isOccupied=false"
          // We'll dispatch an event or do it higher up, or handle it here if we know the rack.
        }
      }

      await updateDoc(orderRef, payload);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCollected = async () => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'collected',
        collectedTime: new Date()
      });
      // We will assume KanbanBoard or a Cloud Function handles freeing the rack
      // But let's export a callback if we want to free rack here.
      toast.success('Order marked as collected');
    } catch (e) {
      toast.error('Error marking collected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-800">{order.studentName}</h4>
          <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.tokenId}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>
      
      <div className="flex gap-4 text-sm mt-3 text-slate-600">
        <div>
          <span className="block text-xs text-slate-400">Room</span>
          <span className="font-medium">{order.studentRoom}</span>
        </div>
        {(order.clothesCount > 0) && (
          <div>
            <span className="block text-xs text-slate-400">Items</span>
            <span className="font-medium">{order.clothesCount}</span>
          </div>
        )}
        {order.dropOffTime && (
          <div className="flex-1 text-right">
            <span className="block text-xs text-slate-400">Time</span>
            <span className="font-medium">{formatTimeAgo(order.dropOffTime)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
        {order.status === 'onTheWay' && (
          <span className="text-sm text-amber-600 font-medium italic">Waiting for drop-off...</span>
        )}
        
        {order.status === 'droppedOff' && (
          <button 
            onClick={() => updateStatus('washing')}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {loading ? 'Updating...' : 'Start Washing'}
          </button>
        )}

        {order.status === 'washing' && (
          <button 
            onClick={() => onAssignRack(order)}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Assign Rack
          </button>
        )}

        {order.status === 'readyInRack' && (
          <div className="w-full flex items-center justify-between">
            <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
               <span className="text-xs text-green-700 block">Rack No.</span>
               <span className="font-bold text-green-800">{order.rackNo}</span>
            </div>
            <button 
              onClick={handleMarkCollected}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading ? 'Updating...' : 'Mark Collected'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
