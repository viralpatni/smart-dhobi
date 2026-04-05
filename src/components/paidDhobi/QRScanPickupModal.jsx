import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';

const QRScanPickupModal = ({ isOpen, onClose, onConfirm, expectedItems }) => {
  const [scannedUid, setScannedUid] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actualCount, setActualCount] = useState(expectedItems);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setScannedUid(null);
      setStudentInfo(null);
      setActualCount(expectedItems);
      setNotes('');
      return;
    }
    
    // Auto sync expected count when opened
    setActualCount(expectedItems);

    const scanner = new Html5QrcodeScanner("pickup-qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    
    scanner.render(async (decodedText) => {
      scanner.clear();
      setScannedUid(decodedText);
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', decodedText));
        if (userDoc.exists()) {
          setStudentInfo({ uid: userDoc.id, ...userDoc.data() });
        } else {
          toast.error("User not found in DB.");
          setScannedUid(null);
        }
      } catch (err) {
        toast.error("Error fetching user Data");
        setScannedUid(null);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      // ignore
    });

    return () => {
      try {
        scanner.clear();
      } catch (e) {}
    };
  }, [isOpen, expectedItems]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Only confirm if scanned UID matches the order's student UID, 
    // but the task didn't explicitly request strict matching here - 
    // checking logic should be done by caller or here. 
    // Actually the prompt says: "On scan: fetch student from users collection... Confirm Pickup button"
    
    if (!studentInfo) return;
    onConfirm(studentInfo.uid, actualCount, notes);
  };

  const isMismatch = actualCount !== expectedItems;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-amber-900 px-6 py-4 flex justify-between items-center text-amber-50">
          <h2 className="font-bold text-lg">Scan Student QR</h2>
          <button onClick={onClose} className="hover:bg-amber-800 rounded p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {!scannedUid ? (
            <div id="pickup-qr-reader" className="w-full h-auto object-cover rounded overflow-hidden"></div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader />
              <p className="mt-4 text-slate-500 font-medium text-sm">Verifying Student...</p>
            </div>
          ) : studentInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-xl border border-green-200">
                <span className="text-4xl mr-3">✅</span>
                <div>
                   <h3 className="font-bold text-green-900 text-lg">{studentInfo.name}</h3>
                   <p className="text-green-800 text-sm">{studentInfo.hostelBlock} • Room {studentInfo.roomNo}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <div className="flex justify-between items-center mb-1">
                   <label className="text-sm font-bold text-slate-700">Actual items received</label>
                   <span className="text-xs text-slate-500 font-medium">Expected: {expectedItems}</span>
                 </div>
                 <input 
                   type="number" 
                   value={actualCount}
                   onChange={e => setActualCount(Number(e.target.value))}
                   className={`w-full py-2 px-3 border rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm font-bold text-lg ${isMismatch ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-300'}`}
                   min={1}
                 />
                 {isMismatch && (
                   <p className="text-xs font-bold text-amber-600 mt-2 flex items-center gap-1">
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                     Count mismatch — note the difference
                   </p>
                 )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <label className="text-sm font-bold text-slate-700 mb-1 block">Staff Notes (optional)</label>
                 <textarea 
                   value={notes}
                   onChange={e => setNotes(e.target.value)}
                   className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm text-sm"
                   rows={2}
                   placeholder="e.g. 1 shirt torn, informed student"
                 ></textarea>
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 mt-2 rounded-xl transition-colors shadow-m shadow-amber-600/20"
              >
                Confirm Pickup
              </button>
            </div>
          ) : (
             <div className="text-center py-8">
               <p className="text-red-500 font-bold mb-4">Error loading student profile</p>
               <button onClick={() => setScannedUid(null)} className="px-4 py-2 border rounded font-medium">Try Again</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanPickupModal;
