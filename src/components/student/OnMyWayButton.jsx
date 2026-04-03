import React, { useState } from 'react';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';

const OnMyWayButton = ({ scheduleId }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notified, setNotified] = useState(false);
  const { userData, currentUser } = useAuth();

  const handleNotify = async () => {
    setLoading(true);
    try {
      // 1. Create a dummy order doc with "onTheWay" status since they haven't dropped off yet,
      // or update an existing one. We will create a fresh Incoming order.
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        tokenId: 'PENDING',
        studentId: currentUser.uid,
        studentName: userData.name,
        studentPhone: userData.phone,
        studentRoom: userData.roomNo,
        dhobiId: '', // To be filled when dhobi accepts
        clothesCount: 0,
        rackNo: null,
        status: 'onTheWay',
        dropOffTime: null,
        rackAssignedTime: null,
        collectedTime: null,
        missingItemReported: false,
        missingItemDesc: '',
        notificationLog: {
          dropOffAlert: false,
          rackReadyAlert: false
        },
        createdAt: new Date()
      });

      setNotified(true);
      toast.success("Staff has been notified!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to notify staff.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (notified) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 text-slate-500 font-medium py-4 px-4 rounded-xl text-center mb-6">
        Staff has been notified ✓
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      {showConfirm ? (
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm animate-fade-in">
          <p className="text-gray-800 font-medium mb-4 text-center">Notify the laundry staff that you're coming?</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfirm(false)}
              className="flex-1 border border-slate-300 text-slate-600 rounded-lg py-2.5 font-medium hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleNotify}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 font-medium flex justify-center items-center"
              disabled={loading}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Confirm'}
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowConfirm(true)}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
        >
          <span className="text-2xl">🚀</span> I'm On My Way!
        </button>
      )}
    </div>
  );
};

export default OnMyWayButton;
