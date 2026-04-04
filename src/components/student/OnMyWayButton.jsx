import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const OnMyWayButton = ({ scheduleId }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alreadyNotified, setAlreadyNotified] = useState(false);
  // Removed clothesCount and photo state
  const { userData, currentUser } = useAuth();

  useEffect(() => {
    const checkExisting = async () => {
      if (!currentUser?.uid) {
        setChecking(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .eq('student_id', currentUser.uid)
          .eq('status', 'onTheWay');
          
        if (error) throw error;
        if (data && data.length > 0) {
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

  // Removed MAX_CLOTHES

  // Removed handlePhotoCapture

  // Removed compressAndConvertToBase64

  const handleNotify = async () => {
    setLoading(true);
    try {
      // Double-check no duplicate
      const { data: existingData, error: existingError } = await supabase
        .from('orders')
        .select('id')
        .eq('student_id', currentUser.uid)
        .eq('status', 'onTheWay');
        
      if (existingError) throw existingError;
      
      if (existingData && existingData.length > 0) {
        setAlreadyNotified(true);
        toast('Staff was already notified!', { icon: 'ℹ️' });
        setLoading(false);
        return;
      }

      await supabase.from('orders').insert({
        token_id: 'PENDING',
        student_id: currentUser.uid,
        student_name: userData.name,
        student_phone: userData.phone,
        student_room: userData.roomNo,
        student_block: userData.hostelBlock,
        student_unique_id: userData.uniqueId || '',
        dhobi_id: '',
        status: 'onTheWay',
        drop_off_time: null,
        rack_assigned_time: null,
        collected_time: null,
        missing_item_reported: false,
        missing_item_desc: '',
        missing_count: 0,
        count_dispute_status: null, // null | 'pending' | 'confirmed' | 'disputed'
        count_dispute_deadline: null,
        notification_log: {
          drop_off_alert: false,
          rack_ready_alert: false,
          count_update_alert: false
        },
        created_at: new Date()
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              📦 Pre-Drop Declaration
            </h3>
            <p className="text-amber-50 text-xs mt-1">Fill this out before you leave your room</p>
          </div>
          <div className="p-5">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 mb-4">
              <span className="text-blue-500 shrink-0 mt-0.5">💡</span>
              <p className="text-xs text-blue-700">
                Head to the counter to drop off your laundry. No item count or photo required!
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-slate-300 text-slate-600 rounded-xl py-3 font-medium hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleNotify}
                className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl py-3 font-bold flex justify-center items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Notifying...</span>
                  </div>
                ) : (
                  '🚀 Notify & Go!'
                )}
              </button>
            </div>
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
