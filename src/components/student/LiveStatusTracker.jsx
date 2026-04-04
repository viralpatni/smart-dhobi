import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';const steps = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'droppedOff', label: 'Dropped Off' },
  { id: 'washing', label: 'Washing' },
  { id: 'readyInRack', label: 'Ready in Rack' },
  { id: 'collected', label: 'Collected' }
];

// Order mapping logic
const statusOrder = {
  scheduled: 0,
  onTheWay: 0,
  droppedOff: 1,
  washing: 2,
  readyInRack: 3,
  collected: 4
};

const LiveStatusTracker = ({ currentStatus, rackNo, order }) => {
  const [loading, setLoading] = useState(false);
  const currentIndex = statusOrder[currentStatus] ?? 0;

  const handleDisputeAction = async (action) => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        countDisputeStatus: action
      });
      if (action === 'confirmed') {
        toast.success('Count confirmed.');
      } else {
        toast('Dispute raised. Speak to staff.', { icon: '⚠️' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const hasCountUpdate = order?.verifiedCount && order?.declaredCount && order.verifiedCount !== order.declaredCount;
  const hasMissingItems = order?.missingItemReported && order?.missingCount > 0;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-4">
      <h3 className="text-gray-800 font-bold mb-6">Live Status</h3>
      
      <div className="relative flex justify-between">
        {/* Connecting Lines */}
        <div className="absolute top-3 left-0 w-full h-[3px] bg-slate-200 -z-10 rounded-full"></div>
        <div 
          className="absolute top-3 left-0 h-[3px] bg-teal-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isActive ? 'bg-teal-600 text-white ring-4 ring-teal-100' : ''}
                  ${isFuture ? 'bg-white border-2 border-slate-300' : ''}
                `}
              >
                {(isCompleted || isActive) && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && currentStatus !== 'collected' && (
                  <div className="absolute inset-0 rounded-full bg-teal-400 animate-pulse-ring"></div>
                )}
              </div>
              
              <span className={`text-[10px] sm:text-xs font-medium mt-2 text-center absolute -bottom-6 w-16 left-1/2 -translate-x-1/2
                ${(isCompleted || isActive) ? 'text-gray-800' : 'text-gray-400'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-12 space-y-3">
        {/* Count Update Notification */}
        {/* Removed count update notification for students */}

        {/* Missing Items Alert */}
        {hasMissingItems && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-600 text-sm">🚨</span>
              <span className="text-red-800 font-bold text-sm">Missing Items Detected</span>
            </div>
            <p className="text-red-700 text-sm">
              <strong>{order.missingCount}</strong> item(s) missing from your laundry. A report has been automatically filed. Please contact the laundry counter.
            </p>
          </div>
        )}

        {currentStatus === 'readyInRack' && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center animate-pulse">
            <span className="text-green-800 font-medium">✨ Laundry is ready!</span>
            <p className="text-green-900 font-bold text-lg mt-1">Collect from Rack No. {rackNo}</p>
          </div>
        )}

        {currentStatus === 'collected' && !hasMissingItems && (
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200 text-center">
             <span className="text-teal-800 font-medium text-lg">✅ All done!</span>
             <p className="text-teal-700 text-sm mt-1">See you next wash.</p>
          </div>
        )}

        {/* Order summary info */}
        {/* Removed order summary info for students */}
      </div>
    </div>
  );
};

export default LiveStatusTracker;
