import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, collection, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateToken } from '../../utils/generateToken';
import { sendNotification } from '../../utils/sendNotification';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const QRScannerModal = ({ isOpen, onClose }) => {
  const [scannedUid, setScannedUid] = useState(null);
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clothesCount, setClothesCount] = useState('');
  const [notes, setNotes] = useState('');
  const [successToken, setSuccessToken] = useState(null);
  
  const { userData, currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && !scannedUid && !successToken) {
      // Initialize scanner
      const scanner = new Html5QrcodeScanner("reader", {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      });

      scanner.render(onScanSuccess, onScanError);

      function onScanSuccess(decodedText) {
        setScannedUid(decodedText);
        scanner.clear();
      }

      function onScanError(error) {
        // Ignored, happens constantly during scanning
      }

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      };
    }
  }, [isOpen, scannedUid, successToken]);

  useEffect(() => {
    if (scannedUid) {
      fetchStudent(scannedUid);
    }
  }, [scannedUid]);

  const fetchStudent = async (uid) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().role === 'student') {
        setStudentRecord(docSnap.data());
      } else {
        toast.error('Invalid QR or student not found.');
        resetScanner();
      }
    } catch (error) {
      toast.error('Error fetching student');
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedUid(null);
    setStudentRecord(null);
    setClothesCount('');
    setNotes('');
    setSuccessToken(null);
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!clothesCount || isNaN(clothesCount)) {
      toast.error('Please enter a valid clothes count');
      return;
    }

    setLoading(true);
    try {
      const tokenId = generateToken();
      const orderRef = doc(collection(db, 'orders'));
      
      await setDoc(orderRef, {
        tokenId,
        studentId: studentRecord.uid,
        studentName: studentRecord.name,
        studentPhone: studentRecord.phone,
        studentRoom: studentRecord.roomNo,
        dhobiId: currentUser.uid,
        clothesCount: parseInt(clothesCount, 10),
        notes: notes,
        rackNo: null,
        status: 'droppedOff',
        dropOffTime: new Date(),
        rackAssignedTime: null,
        collectedTime: null,
        missingItemReported: false,
        missingItemDesc: '',
        notificationLog: {
          dropOffAlert: true,
          rackReadyAlert: false
        },
        createdAt: new Date()
      });

      // Update Analytics
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours().toString().padStart(2, '0');
      const analyticsRef = doc(db, 'analytics', today);
      const analyticsSnap = await getDoc(analyticsRef);
      
      if (analyticsSnap.exists()) {
        await updateDoc(analyticsRef, {
          totalDropOffs: increment(1),
          [`hourlyDropOffs.${hour}`]: increment(1)
        });
      } else {
        // Initializer covered by hooks/seed, but just in case
        await setDoc(analyticsRef, {
           date: today,
           totalDropOffs: 1,
           totalCollected: 0,
           totalMissingReports: 0,
           hourlyDropOffs: { "08": 0, "09": 0, "10": 0, "11": 0, "12": 0, "13": 0, "14": 0, "15": 0, "16": 0, "17": 0, "18": 0, [hour]: 1 }
        });
      }

      // Send WhatsApp Notification
      await sendNotification(
        studentRecord.phone, 
        `✅ Your laundry has been received! Token: ${tokenId}. Track status in the SmartDhobi app.`
      );

      setSuccessToken(tokenId);
      toast.success(`Token ${tokenId} generated!`);
      
      setTimeout(() => {
        onClose();
        resetScanner();
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error('Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="text-xl">📷</span> Scan QR
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {successToken ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-2">Token Generated!</h4>
              <div className="bg-slate-100 py-3 px-6 rounded-lg inline-block">
                <span className="font-mono text-3xl font-bold text-teal-600 tracking-wider">{successToken}</span>
              </div>
            </div>
          ) : !scannedUid ? (
            <>
               <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-slate-200"></div>
               <p className="text-center text-slate-500 mt-4 text-sm">Align the student's QR code within the frame.</p>
            </>
          ) : loading && !studentRecord ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          ) : studentRecord ? (
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 bg-teal-50 p-4 rounded-xl mb-6 border border-teal-100">
                <div className="w-16 h-16 rounded-full bg-teal-200 flex items-center justify-center text-teal-800 font-bold text-2xl">
                  {studentRecord.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{studentRecord.name}</h4>
                  <p className="text-slate-600">Room: <span className="font-semibold">{studentRecord.roomNo}</span></p>
                  <p className="text-slate-500 text-sm">{studentRecord.phone}</p>
                </div>
                <button onClick={resetScanner} className="ml-auto text-xs text-teal-600 underline">Rescan</button>
              </div>

              <form onSubmit={handleGenerateToken}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Clothes *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={clothesCount}
                      onChange={e => setClothesCount(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-teal-500 focus:border-teal-500 text-lg"
                      placeholder="e.g., 12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                    <input 
                      type="text" 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-teal-500 focus:border-teal-500 text-sm"
                      placeholder="e.g., handle with care, delicate wash..."
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium flex justify-center items-center shadow-lg shadow-teal-600/30 transition-colors text-lg"
                  >
                    {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Generate Token'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
