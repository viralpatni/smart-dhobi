import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { sendNotification } from '../../utils/sendNotification';
import toast from 'react-hot-toast';

const isRoomInRange = (roomNo, rangeStr) => {
  if (!roomNo || !rangeStr || rangeStr.trim() === '') return false;
  const parts = rangeStr.split('-').map(p => p.trim());
  const studentRoomNum = parseInt(String(roomNo).replace(/\D/g, ''), 10);
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    if (!isNaN(studentRoomNum) && !isNaN(min) && !isNaN(max)) {
      return studentRoomNum >= min && studentRoomNum <= max;
    }
  }
  return false;
};

const CallNextBatchModal = ({ isOpen, onClose, activeOrders }) => {
  const [totalCapacity, setTotalCapacity] = useState('100');
  const [occupiedCapacity, setOccupiedCapacity] = useState('70');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  if (!isOpen) return null;

  const availableSlots = Math.max(0, parseInt(totalCapacity || 0) - parseInt(occupiedCapacity || 0));

  const handleCallNextBatch = async () => {
    if (availableSlots <= 0) {
      toast.error('No available slots right now.');
      return;
    }

    setLoading(true);
    setResultMessage('');

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const todayDate = now.getDate();

      // 1. Fetch all monthlySchedules for the current month to find today's active rules
      const schedulesSnap = await getDocs(
        query(collection(db, 'monthlySchedules'), where('year', '==', currentYear), where('month', '==', currentMonth))
      );

      const activeBlocksAndRanges = [];
      schedulesSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const scheduleMap = data.scheduleMap || {};
        const todayRange = scheduleMap[String(todayDate)];
        if (todayRange && todayRange.trim() !== '') {
          activeBlocksAndRanges.push({
            hostelBlock: data.hostelBlock,
            roomRange: todayRange.trim()
          });
        }
      });

      if (activeBlocksAndRanges.length === 0) {
        toast.error('There are no students scheduled for today.');
        setLoading(false);
        return;
      }

      // Collect eligible IDs who have ALREADY dropped off today (or have active orders) to ignore them
      const alreadyWashingSet = new Set();
      // Use activeOrders prop (from KanbanBoard/Dashboard which grabs all active 'onTheWay', 'washing', 'droppedOff' etc)
      activeOrders.forEach(order => {
        alreadyWashingSet.add(order.studentId);
      });
      
      // Also potentially look for collected orders from today
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const ordersQ = query(collection(db, 'orders'), where('createdAt', '>=', todayStart));
      const ordersSnap = await getDocs(ordersQ);
      ordersSnap.docs.forEach(docSnap => {
          const oData = docSnap.data();
          alreadyWashingSet.add(oData.studentId);
      });

      // 2. Fetch all students (since querying multiple hostelBlocks natively is tricky if there are many, we grab all or do IN query)
      const blocks = activeBlocksAndRanges.map(b => b.hostelBlock);
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'), where('hostelBlock', 'in', blocks));
      const studentsSnap = await getDocs(studentsQ);

      // 3. Filter by room range & dropped off
      let eligibleStudents = [];
      
      studentsSnap.docs.forEach((docSnap) => {
        const sData = docSnap.data();
        if (alreadyWashingSet.has(sData.uid)) return; // Skip those who already brought laundry

        // Verify if room is in today's range for their block
        const blockRule = activeBlocksAndRanges.find(b => b.hostelBlock === sData.hostelBlock);
        if (blockRule && isRoomInRange(sData.roomNo, blockRule.roomRange)) {
            eligibleStudents.push({
                ...sData,
                numericRoom: parseInt(String(sData.roomNo).replace(/\D/g, ''), 10) || 0
            });
        }
      });

      // 4. Sort numerically by room number to go sequentially through the block
      eligibleStudents.sort((a, b) => a.numericRoom - b.numericRoom);

      // 5. Select the next N students based on availableSlots
      const studentsToCall = eligibleStudents.slice(0, availableSlots);

      if (studentsToCall.length === 0) {
        toast.error('All students scheduled for today have already submitted laundry!');
        setLoading(false);
        return;
      }

      // 6. Send push notifications
      let successCount = 0;
      for (const student of studentsToCall) {
         try {
             await sendNotification(student.uid, `🔔 Washington Machines Available! Please bring your laundry to the counter now.`);
             successCount++;
         } catch (e) {
             console.error('Failed to notify student:', student.uid);
         }
      }

      toast.success(`Successfully notified ${successCount} students.`);
      setResultMessage(`Alert sent to ${successCount} students (up to room ${studentsToCall[studentsToCall.length - 1].roomNo}).`);
      
      setTimeout(() => {
          onClose();
          setResultMessage('');
      }, 3500);

    } catch (error) {
      console.error(error);
      toast.error('Error invoking batch call algorithm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="text-xl">📢</span> Call Next Batch
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
             <p className="text-xs text-teal-700 font-semibold mb-3 tracking-wide uppercase">Capacity Calculator</p>
             <div className="flex gap-4">
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-500 mb-1">Total Machines</label>
                   <input type="number" value={totalCapacity} onChange={(e)=>setTotalCapacity(e.target.value)} className="w-full text-lg border border-slate-200 rounded-lg p-2 text-center focus:outline-none focus:border-teal-500 font-mono" />
                </div>
                <div className="flex items-center justify-center mt-6 text-slate-400 font-bold">-</div>
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-500 mb-1">Occupied</label>
                   <input type="number" value={occupiedCapacity} onChange={(e)=>setOccupiedCapacity(e.target.value)} className="w-full text-lg border border-slate-200 rounded-lg p-2 text-center focus:outline-none focus:border-teal-500 font-mono" />
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
             <p className="text-sm font-bold text-slate-500 uppercase">Available Slots</p>
             <p className="text-5xl font-black text-slate-800 tracking-tighter mt-1">{availableSlots}</p>
          </div>

          {resultMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center font-medium">
               {resultMessage}
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleCallNextBatch}
              disabled={loading || availableSlots <= 0}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/30 font-bold text-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <><span>🔔</span> Notify {availableSlots} Students</>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
              This will calculate the next <strong>{availableSlots}</strong> scheduled students mathematically by room number who haven't washed today, and ping their phones.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CallNextBatchModal;
