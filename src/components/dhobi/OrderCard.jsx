import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatTimeAgo } from '../../utils/formatDate';
import { doc, updateDoc, deleteDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { sendNotification } from '../../utils/sendNotification';
import toast from 'react-hot-toast';

const OrderCard = ({ order, onAssignRack }) => {
  const [loading, setLoading] = useState(false);
  const [showRecount, setShowRecount] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(order.verifiedCount || order.clothesCount || '');
  const [showReturnCount, setShowReturnCount] = useState(false);
  const [returnCount, setReturnCount] = useState('');

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const payload = { status: newStatus };
      await updateDoc(orderRef, payload);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Zone 3: Batch Recount — Dhobi verifies the declared count at their own pace
  const handleVerifyCount = async () => {
    const newCount = parseInt(verifiedCount, 10);
    if (isNaN(newCount) || newCount < 0) {
      toast.error('Enter a valid count');
      return;
    }

    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const updatePayload = {
        verifiedCount: newCount,
        clothesCount: newCount, // Update the official count
      };

      // If count differs from declared, send silent notification
      if (order.declaredCount && newCount !== order.declaredCount) {
        // Set a 2-hour dispute deadline
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 2);

        updatePayload.countDisputeStatus = 'pending';
        updatePayload.countDisputeDeadline = deadline;
        updatePayload['notificationLog.countUpdateAlert'] = true;

        await updateDoc(orderRef, updatePayload);

        // Send silent notification to student
        await sendNotification(
          order.studentPhone,
          `📋 Count Update: Your laundry order (${order.tokenId}) count was updated from ${order.declaredCount} to ${newCount} by staff. If this is incorrect, check your app within 2 hours to dispute.`
        );

        toast.success(`Count updated to ${newCount}. Student notified of the change.`);
      } else {
        updatePayload.countDisputeStatus = 'confirmed';
        await updateDoc(orderRef, updatePayload);
        toast.success(`Count verified: ${newCount} items ✓`);
      }

      setShowRecount(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update count');
    } finally {
      setLoading(false);
    }
  };

  // Missing Item Auto-Detection: Return count on collection
  const handleMarkCollected = async () => {
    // If return count panel isn't showing yet, show it
    if (!showReturnCount) {
      setShowReturnCount(true);
      setReturnCount(order.verifiedCount || order.clothesCount || '');
      return;
    }

    const returnNum = parseInt(returnCount, 10);
    if (isNaN(returnNum) || returnNum < 0) {
      toast.error('Enter a valid return count');
      return;
    }

    const verifiedNum = order.verifiedCount || order.clothesCount || 0;

    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const updatePayload = {
        status: 'collected',
        collectedTime: new Date(),
        returnCount: returnNum,
      };

      if (returnNum < verifiedNum) {
        // AUTO-FILE missing item report
        const missingNum = verifiedNum - returnNum;
        updatePayload.missingItemReported = true;
        updatePayload.missingCount = missingNum;
        updatePayload.missingItemDesc = `Auto-detected: ${missingNum} item(s) missing. Verified count: ${verifiedNum}, returned: ${returnNum}. Reported by Dhobi at collection.`;
        
        await updateDoc(orderRef, updatePayload);

        // Update analytics
        const today = new Date().toISOString().split('T')[0];
        const analyticsRef = doc(db, 'analytics', today);
        const analyticsSnap = await getDoc(analyticsRef);
        if (analyticsSnap.exists()) {
          await updateDoc(analyticsRef, {
            totalMissingReports: increment(1)
          });
        }

        // Notify student about missing items
        await sendNotification(
          order.studentPhone,
          `⚠️ Missing Items Alert: ${missingNum} item(s) are missing from your laundry (${order.tokenId}). Verified count: ${verifiedNum}, items returned: ${returnNum}. Please contact the laundry counter.`
        );

        toast.error(`⚠️ ${missingNum} item(s) missing — report auto-filed!`, {
          duration: 5000,
          icon: '🚨',
        });
      } else {
        // All items accounted for
        updatePayload.missingItemReported = false;
        updatePayload.missingCount = 0;
        await updateDoc(orderRef, updatePayload);
        toast.success('Order collected — all items accounted for ✓');
      }

      setShowReturnCount(false);
    } catch (e) {
      console.error(e);
      toast.error('Error marking collected');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${order.studentName}'s entry from the queue?`)) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'orders', order.id));
      toast.success('Entry removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove entry');
    } finally {
      setLoading(false);
    }
  };

  const effectiveCount = order.verifiedCount || order.clothesCount || 0;
  const hasCountMismatch = order.declaredCount && order.verifiedCount && order.declaredCount !== order.verifiedCount;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-800">{order.studentName}</h4>
          <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.tokenId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDelete}
            disabled={loading}
            className="text-slate-300 hover:text-red-500 transition-colors p-1" 
            title="Remove entry"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
          <StatusBadge status={order.status} />
        </div>
      </div>
      
      <div className="flex gap-4 text-sm mt-3 text-slate-600">
        <div>
          <span className="block text-xs text-slate-400">Room</span>
          <span className="font-medium">{order.studentRoom}</span>
        </div>
        {effectiveCount > 0 && (
          <div>
            <span className="block text-xs text-slate-400">Items</span>
            <span className="font-medium">{effectiveCount}</span>
          </div>
        )}
        {order.declaredCount > 0 && order.verifiedCount && order.verifiedCount !== order.declaredCount && (
          <div>
            <span className="block text-xs text-slate-400">Declared</span>
            <span className="font-medium text-amber-600 line-through">{order.declaredCount}</span>
          </div>
        )}
        {order.dropOffTime && (
          <div className="flex-1 text-right">
            <span className="block text-xs text-slate-400">Time</span>
            <span className="font-medium">{formatTimeAgo(order.dropOffTime)}</span>
          </div>
        )}
      </div>

      {/* Bundle Photo Thumbnail */}
      {order.bundlePhotoUrl && (
        <div className="mt-3">
          <img
            src={order.bundlePhotoUrl}
            alt="Bundle"
            className="w-full h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(order.bundlePhotoUrl, '_blank')}
            title="Click to view full size"
          />
        </div>
      )}

      {/* Count mismatch indicator */}
      {hasCountMismatch && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-amber-700">
          <span>⚠️</span>
          <span>Count adjusted: {order.declaredCount} → {order.verifiedCount} 
            {order.countDisputeStatus === 'pending' && <span className="font-bold ml-1">(awaiting student response)</span>}
            {order.countDisputeStatus === 'confirmed' && <span className="text-green-600 font-bold ml-1">✓ confirmed</span>}
          </span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100">
        {order.status === 'onTheWay' && (
          <span className="text-sm text-amber-600 font-medium italic flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Waiting for drop-off...
          </span>
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
          <div className="space-y-2">
            {/* Zone 3: Batch Recount */}
            {!showRecount ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRecount(true)}
                  className="flex-1 border border-slate-300 text-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                  Verify Count
                </button>
                <button 
                  onClick={() => onAssignRack(order)}
                  disabled={loading}
                  className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Assign Rack
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-blue-800 flex items-center gap-1">
                    📋 Verify Item Count
                  </h5>
                  <button onClick={() => setShowRecount(false)} className="text-xs text-blue-500 underline">Cancel</button>
                </div>
                {order.declaredCount > 0 && (
                  <p className="text-xs text-blue-600">Student declared: <strong>{order.declaredCount} items</strong></p>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={verifiedCount}
                    onChange={(e) => setVerifiedCount(e.target.value)}
                    className="flex-1 border-2 border-blue-200 rounded-lg p-2 text-center text-xl font-bold font-mono focus:outline-none focus:border-blue-500 text-blue-800 bg-white"
                    placeholder="Count"
                    autoFocus
                  />
                  <button
                    onClick={handleVerifyCount}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 font-bold text-sm transition-colors flex items-center gap-1"
                  >
                    {loading ? '...' : '✓ Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {order.status === 'readyInRack' && (
          <div className="space-y-3">
            <div className="w-full flex items-center justify-between">
              <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                 <span className="text-xs text-green-700 block">Rack No.</span>
                 <span className="font-bold text-green-800">{order.rackNo}</span>
              </div>
              {!showReturnCount ? (
                <button 
                  onClick={handleMarkCollected}
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {loading ? 'Updating...' : 'Mark Collected'}
                </button>
              ) : null}
            </div>

            {/* Return Count Panel */}
            {showReturnCount && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  📦 Return Count
                  <span className="text-xs font-normal text-slate-500">(How many items going back?)</span>
                </h5>
                {effectiveCount > 0 && (
                  <p className="text-xs text-slate-500">
                    Verified items: <strong className="text-gray-800">{effectiveCount}</strong>
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={returnCount}
                    onChange={(e) => setReturnCount(e.target.value)}
                    className="flex-1 border-2 border-slate-300 rounded-lg p-2 text-center text-xl font-bold font-mono focus:outline-none focus:border-slate-500 text-gray-800 bg-white"
                    placeholder="Count"
                    autoFocus
                  />
                  <button
                    onClick={handleMarkCollected}
                    disabled={loading}
                    className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-5 font-bold text-sm transition-colors flex items-center gap-1"
                  >
                    {loading ? '...' : '✓ Confirm'}
                  </button>
                </div>
                <button
                  onClick={() => setShowReturnCount(false)}
                  className="text-xs text-slate-400 underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
