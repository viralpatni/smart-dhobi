import React, { useState, useEffect } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const OnMyWayButton = ({ scheduleId }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alreadyNotified, setAlreadyNotified] = useState(false);
  const [clothesCount, setClothesCount] = useState('');
  const { userData, currentUser } = useAuth();

  // On mount, check if there's already an active "onTheWay" order for this student
  useEffect(() => {
    const checkExisting = async () => {
      if (!currentUser?.uid) {
        setChecking(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'orders'),
          where('studentId', '==', currentUser.uid),
          where('status', '==', 'onTheWay')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setAlreadyNotified(true);
        }
      } catch (e) {
        console.error('Error checking existing order:', e);
      } finally {
        setChecking(false);
      }
    };
    checkExisting();
  }, [currentUser]);

  const handleNotify = async () => {
    if (!clothesCount || isNaN(clothesCount) || parseInt(clothesCount) < 1) {
      toast.error('Please enter the number of clothes');
      return;
    }

    setLoading(true);
    try {
      // Double-check no duplicate
      const q = query(
        collection(db, 'orders'),
        where('studentId', '==', currentUser.uid),
        where('status', '==', 'onTheWay')
      );
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        setAlreadyNotified(true);
        toast('Staff was already notified!', { icon: 'ℹ️' });
        setLoading(false);
        return;
      }

      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        tokenId: 'PENDING',
        studentId: currentUser.uid,
        studentName: userData.name,
        studentPhone: userData.phone,
        studentRoom: userData.roomNo,
        studentBlock: userData.hostelBlock,
        studentUniqueId: userData.uniqueId || '',
        dhobiId: '',
        clothesCount: parseInt(clothesCount, 10),
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

      setAlreadyNotified(true);
      toast.success("Staff has been notified! Head to the counter.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to notify staff.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-medium py-4 px-4 rounded-xl text-center mb-6 animate-pulse">
        Checking status...
      </div>
    );
  }

  if (alreadyNotified) {
    return (
      <div className="w-full bg-green-50 border border-green-200 text-green-700 font-medium py-4 px-4 rounded-xl text-center mb-6 flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
        Staff has been notified — you're in the queue!
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      {showForm ? (
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm space-y-4">
          <p className="text-gray-800 font-bold text-center">How many clothes are you dropping off?</p>
          
          <input 
            type="number"
            min="1"
            required
            value={clothesCount}
            onChange={(e) => setClothesCount(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-xl p-4 text-center text-3xl font-bold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-amber-700"
            placeholder="e.g. 12"
            autoFocus
          />
          <p className="text-xs text-slate-400 text-center">Enter the total count of clothing items</p>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setShowForm(false)}
              className="flex-1 border border-slate-300 text-slate-600 rounded-lg py-2.5 font-medium hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleNotify}
              className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 font-bold flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20"
              disabled={loading}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : '🚀 Notify & Go!'}
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
        >
          <span className="text-2xl">🚀</span> I'm On My Way!
        </button>
      )}
    </div>
  );
};

export default OnMyWayButton;
