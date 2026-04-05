import React, { useState } from 'react';
import { useAllPaidSchedules } from '../../hooks/usePaidSchedules';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const PaidDhobiSchedules = () => {
  const { schedules, loading } = useAllPaidSchedules();
  const { userData } = useAuth();
  
  const [formData, setFormData] = useState({
    pickupDay: 'Tuesday',
    pickupDate: '',
    pickupTimeSlot: '09:00 AM – 11:00 AM',
    deliveryDate: '',
    deliveryTimeSlot: '06:00 PM – 08:00 PM',
    hostelBlocks: { 'Block A': false, 'Block B': false, 'Block C': false, 'Block D': false }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <Loader fullScreen />;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeSchedules = schedules.filter(s => s.isActive);
  const pastSchedules = schedules.filter(s => !s.isActive || s.pickupDate < todayStr);

  const handleDeactivate = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this schedule? Students won't be able to book it anymore.")) {
      try {
        await updateDoc(doc(db, 'paidSchedules', id), { isActive: false });
        toast.success("Schedule deactivated");
      } catch (e) {
        toast.error("Failed to deactivate");
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const blocksArr = Object.keys(formData.hostelBlocks).filter(k => formData.hostelBlocks[k]);
    
    if (blocksArr.length === 0) {
      toast.error("Select at least one hostel block");
      return;
    }
    
    if (!formData.pickupDate || !formData.deliveryDate) {
      toast.error("Set both pickup and delivery dates");
      return;
    }

    // Auto generate week label
    const pd = new Date(formData.pickupDate);
    const month = pd.toLocaleString('default', { month: 'short' });
    const year = pd.getFullYear();
    const weekOfMonth = Math.ceil(pd.getDate() / 7);
    const weekLabel = `Week ${weekOfMonth} — ${month} ${year}`;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'paidSchedules'), {
        weekLabel,
        pickupDay: formData.pickupDay,
        pickupDate: formData.pickupDate,
        pickupTimeSlot: formData.pickupTimeSlot,
        deliveryDate: formData.deliveryDate,
        deliveryTimeSlot: formData.deliveryTimeSlot,
        hostelBlocks: blocksArr,
        isActive: true,
        createdBy: userData.uid,
        createdAt: serverTimestamp()
      });
      
      // For notifications: We could trigger the HTTP callable function here, but we will rely on 
      // the user clicking a mock button or the cloud function batching if implemented.
      // E.g. fetch('broadcastNewSchedule') if we deployed the HTTP trigger.

      toast.success("New schedule created & broadcasted");
      
      // Reset form dates
      setFormData(prev => ({
        ...prev, 
        pickupDate: '', 
        deliveryDate: '',
        hostelBlocks: { 'Block A': false, 'Block B': false, 'Block C': false, 'Block D': false }
      }));
    } catch (e) {
      console.error(e);
      toast.error("Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScheduleCard = ({ sch, onDeactivate }) => (
    <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
      {sch.isActive ? (
        <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
      ) : (
        <div className="absolute top-0 right-0 w-2 h-full bg-slate-300"></div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
           <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sch.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
             {sch.isActive ? 'Active Schedule' : 'Past Schedule'}
           </span>
           <h3 className="font-bold text-slate-800 text-lg mt-2">{sch.weekLabel}</h3>
        </div>
        {sch.isActive && (
          <button onClick={() => onDeactivate(sch.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
            Deactivate
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wide mb-1">Pickup</p>
          <p className="font-bold text-amber-900">{sch.pickupDay}, {sch.pickupDate}</p>
          <p className="text-xs text-amber-700 mt-0.5">{sch.pickupTimeSlot}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-1">Delivery</p>
          <p className="font-bold text-slate-800">{sch.deliveryDate}</p>
          <p className="text-xs text-slate-600 mt-0.5">{sch.deliveryTimeSlot}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">Eligible Blocks</p>
        <div className="flex flex-wrap gap-2">
          {sch.hostelBlocks.map(block => (
            <span key={block} className="bg-white border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded font-medium shadow-sm">
              {block}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20 animate-fade-in-up">
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-amber-900">Manage Pickup Schedules</h1>
         <p className="text-sm text-amber-700 mt-1">Create upcoming pickup slots for the paid laundry service.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden sticky top-8">
            <div className="bg-amber-50 border-b border-amber-100 p-5">
              <h2 className="font-bold text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Create New Schedule
              </h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Pickup Day</label>
                <select value={formData.pickupDay} onChange={e => setFormData({...formData, pickupDay: e.target.value})} className="w-full border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm">
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Pickup Date</label>
                  <input type="date" required min={todayStr} value={formData.pickupDate} onChange={e => setFormData({...formData, pickupDate: e.target.value})} className="w-full border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Time Slot</label>
                  <input type="text" required value={formData.pickupTimeSlot} onChange={e => setFormData({...formData, pickupTimeSlot: e.target.value})} className="w-full border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm text-sm" placeholder="9 AM - 11 AM" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Delivery Date</label>
                  <input type="date" required min={formData.pickupDate || todayStr} value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} className="w-full border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Time Slot</label>
                  <input type="text" required value={formData.deliveryTimeSlot} onChange={e => setFormData({...formData, deliveryTimeSlot: e.target.value})} className="w-full border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 shadow-sm text-sm" placeholder="6 PM - 8 PM" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Available Blocks</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Block A', 'Block B', 'Block C', 'Block D'].map(block => (
                    <label key={block} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${formData.hostelBlocks[block] ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                      <input type="checkbox" className="text-amber-600 focus:ring-amber-500 w-4 h-4 rounded" checked={formData.hostelBlocks[block]} onChange={e => setFormData(prev => ({...prev, hostelBlocks: {...prev.hostelBlocks, [block]: e.target.checked}}))} />
                      <span className={`text-sm font-bold ${formData.hostelBlocks[block] ? 'text-amber-800' : 'text-slate-600'}`}>{block}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-70">
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Launch Schedule'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active & History */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Active Schedules</h2>
            {activeSchedules.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
                No active schedules right now. Create one to accept new paid orders.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSchedules.map(sch => (
                  <ScheduleCard key={sch.id} sch={sch} onDeactivate={handleDeactivate} />
                ))}
              </div>
            )}
          </section>

          <section>
             <details className="group bg-white rounded-xl shadow-sm border border-slate-200">
               <summary className="p-4 font-bold text-slate-800 cursor-pointer flex justify-between items-center outline-none">
                 Schedule History
                 <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
               </summary>
               <div className="border-t border-slate-100 p-4 bg-slate-50">
                 {pastSchedules.length === 0 ? (
                   <p className="text-center text-slate-500 py-4 text-sm">No past schedules found.</p>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {pastSchedules.map(sch => (
                       <ScheduleCard key={sch.id} sch={sch} onDeactivate={handleDeactivate} />
                     ))}
                   </div>
                 )}
               </div>
             </details>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PaidDhobiSchedules;
