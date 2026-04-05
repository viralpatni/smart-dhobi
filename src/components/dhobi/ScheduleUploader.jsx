import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

const ScheduleUploader = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    year: currentYear,
    month: currentMonth,
    hostelBlock: 'Block A',
  });

  const [daysData, setDaysData] = useState([]);

  // Generate the right number of days in the month
  useEffect(() => {
    const totalDays = new Date(formData.year, formData.month, 0).getDate();
    // Preserve existing data if month length changes, otherwise create empty ones
    setDaysData(prev => {
      const newArr = [];
      for (let i = 1; i <= totalDays; i++) {
        newArr.push({
          date: i,
          range: prev[i - 1]?.range || ''
        });
      }
      return newArr;
    });
  }, [formData.year, formData.month]);

  if (!isOpen) return null;

  const handleMetaChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRangeChange = (index, value) => {
    const updated = [...daysData];
    updated[index].range = value;
    setDaysData(updated);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docId = `${formData.year}_${formData.month}_${formData.hostelBlock.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      const scheduleMap = {};
      daysData.forEach(d => {
        scheduleMap[d.date] = d.range.trim(); // "101-319" or ""
      });

      await setDoc(doc(db, 'monthlySchedules', docId), {
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        hostelBlock: formData.hostelBlock,
        scheduleMap: scheduleMap,
        updatedAt: new Date()
      });

      toast.success(`${formData.hostelBlock} schedule saved for ${formData.month}/${formData.year}!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save monthly schedule.');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span>📅</span> Advanced Monthly Schedule Configurator
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-md border border-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-100/50">
          <form id="scheduleForm" onSubmit={handleUpload} className="space-y-6">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hostel Block</label>
                 <select 
                    name="hostelBlock" 
                    value={formData.hostelBlock} 
                    onChange={handleMetaChange}
                    className="w-full border border-slate-200 bg-slate-50 py-2 px-3 rounded text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                 >
                   <option value="Block A">Block A</option>
                   <option value="Block B">Block B</option>
                   <option value="Block C">Block C</option>
                   <option value="D2 Block">D2 Block</option>
                   <option value="Girls Hostel">Girls Hostel</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Month</label>
                 <select 
                    name="month" 
                    value={formData.month} 
                    onChange={handleMetaChange}
                    className="w-full border border-slate-200 bg-slate-50 py-2 px-3 rounded text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                 >
                   {monthNames.map((m, idx) => (
                     <option key={idx+1} value={idx+1}>{m}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
                 <select 
                    name="year" 
                    value={formData.year} 
                    onChange={handleMetaChange}
                    className="w-full border border-slate-200 bg-slate-50 py-2 px-3 rounded text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                 >
                   <option value={currentYear}>{currentYear}</option>
                   <option value={currentYear + 1}>{currentYear + 1}</option>
                 </select>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-800 text-white text-xs uppercase tracking-wider font-bold grid grid-cols-[80px_1fr] border-b border-slate-700">
                    <div className="py-3 px-4 text-center border-r border-slate-700">Date</div>
                    <div className="py-3 px-4">Room No Range (e.g. 101-319)</div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                   {daysData.map((day, idx) => (
                       <div key={day.date} className="grid grid-cols-[80px_1fr] hover:bg-slate-50 transition-colors">
                           <div className="py-2 px-4 text-center border-r border-slate-100 font-bold justify-center items-center flex text-slate-400">
                               {day.date}
                           </div>
                           <div className="py-1 px-4">
                               <input 
                                  type="text"
                                  value={day.range}
                                  onChange={(e) => handleRangeChange(idx, e.target.value)}
                                  placeholder="Leave empty for holiday"
                                  className={`w-full bg-transparent p-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 rounded border border-transparent transition-all text-sm font-medium ${day.range ? 'text-teal-700' : 'text-slate-400'}`}
                               />
                           </div>
                       </div>
                   ))}
                </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-500 w-[60%] leading-relaxed">
              <strong>Tip:</strong> The automated assistant will read this spreadsheet every night at 8 PM, extract tomorrow's row, and text students inside those exact room bounds.
            </p>
            <button 
              type="submit" 
              form="scheduleForm"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow shadow-teal-600/20 transition-transform active:scale-[0.98] flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Save Month Schedule'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ScheduleUploader;
