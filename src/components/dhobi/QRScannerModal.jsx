import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, collection, setDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { sendNotification } from '../../utils/sendNotification';
import { generateToken } from '../../utils/generateToken';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const QRScannerModal = ({ isOpen, onClose }) => {
  const [scannedUid, setScannedUid] = useState(null);
  const [studentRecord, setStudentRecord] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successToken, setSuccessToken] = useState(null);
  const [returnCount, setReturnCount] = useState('');
  
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && !scannedUid && !successToken) {
      let scanner = null;

      // Timeout prevents React StrictMode from initializing the camera twice rapidly,
      // avoiding the 'NotReadableError: Device in use' error.
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner("reader", {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        });

        scanner.render(onScanSuccess, onScanError);
      }, 300);

      function onScanSuccess(decodedText) {
        setScannedUid(decodedText);
        if (scanner) {
          scanner.clear().catch(error => console.error("Failed to clear scanner", error));
          scanner = null;
        }
      }

      function onScanError(error) {
        // Ignored
      }

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(error => console.error("Failed to clear scanner", error));
          scanner = null;
        }
      };
    }
  }, [isOpen, scannedUid, successToken]);

  useEffect(() => {
    if (scannedUid) {
      fetchStudentAndOrder(scannedUid);
    }
  }, [scannedUid]);

  const fetchStudentAndOrder = async (uid) => {
    setLoading(true);
    try {
      // 1. Fetch student record
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().role === 'student') {
        setStudentRecord(docSnap.data());
      } else {
        toast.error('Invalid QR or student not found.');
        resetScanner();
        return;
      }

      // 2. Fetch the student's active order
      const q = query(collection(db, 'orders'), where('studentId', '==', uid));
      const orderSnap = await getDocs(q);
      const active = orderSnap.docs.find(d => ['onTheWay', 'readyInRack'].includes(d.data().status));
      
      if (active) {
        setActiveOrder({ id: active.id, ...active.data() });
      } else {
        setActiveOrder(null);
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
    setActiveOrder(null);
    setSuccessToken(null);
    setReturnCount('');
  };

  const handleMarkCollected = async () => {
    const returnNum = parseInt(returnCount, 10);
    if (isNaN(returnNum) || returnNum < 0) {
      toast.error('Enter a valid return count');
      return;
    }

    const verifiedNum = activeOrder.verifiedCount || activeOrder.clothesCount || 0;
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', activeOrder.id);
      const updatePayload = {
        status: 'collected',
        collectedTime: new Date(),
        returnCount: returnNum,
      };

      if (returnNum < verifiedNum) {
        const missingNum = verifiedNum - returnNum;
        updatePayload.missingItemReported = true;
        updatePayload.missingCount = missingNum;
        updatePayload.missingItemDesc = `Auto-detected: ${missingNum} item(s) missing. Checked by scanner.`;
        
        await updateDoc(orderRef, updatePayload);

        const today = new Date().toISOString().split('T')[0];
        const analyticsRef = doc(db, 'analytics', today);
        const analyticsSnap = await getDoc(analyticsRef);
        if (analyticsSnap.exists()) {
          await updateDoc(analyticsRef, { totalMissingReports: increment(1) });
        }
        await sendNotification(studentRecord.uid, `⚠️ Missing Items Alert: ${missingNum} item(s) are missing from your laundry. Contact counter.`);
        toast.error(`⚠️ ${missingNum} item(s) missing — report auto-filed!`);
      } else {
        updatePayload.missingItemReported = false;
        updatePayload.missingCount = 0;
        await updateDoc(orderRef, updatePayload);
        toast.success('Order collected — all items accounted for ✓');
      }

      setSuccessToken('COLLECTED');
      setTimeout(() => {
        onClose();
        resetScanner();
      }, 2500);
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark collected');
    } finally {
      setLoading(false);
    }
  };

  // Zone 2: One-tap Accept & Generate Token
  const handleAcceptAndGenerate = async () => {
    setLoading(true);
    try {
      const autoToken = generateToken();
      const clothesCount = activeOrder?.clothesCount || 0;

      if (activeOrder) {
        // Update the existing "onTheWay" order to "droppedOff"
        const orderRef = doc(db, 'orders', activeOrder.id);
        await updateDoc(orderRef, {
          tokenId: autoToken,
          dhobiId: currentUser.uid,
          status: 'droppedOff',
          dropOffTime: new Date(),
        });
      } else {
        // No prior order — walk-in without app notification
        const orderRef = doc(collection(db, 'orders'));
        await setDoc(orderRef, {
          tokenId: autoToken,
          studentId: studentRecord.uid,
          studentName: studentRecord.name,
          studentPhone: studentRecord.phone,
          studentRoom: studentRecord.roomNo,
          studentBlock: studentRecord.hostelBlock,
          studentUniqueId: studentRecord.uniqueId || '',
          dhobiId: currentUser.uid,
          clothesCount: 0,
          declaredCount: 0,
          bundlePhotoUrl: null,
          verifiedCount: null,
          returnCount: null,
          rackNo: null,
          status: 'droppedOff',
          dropOffTime: new Date(),
          rackAssignedTime: null,
          collectedTime: null,
          missingItemReported: false,
          missingItemDesc: '',
          missingCount: 0,
          countDisputeStatus: null,
          countDisputeDeadline: null,
          notificationLog: {
            dropOffAlert: true,
            rackReadyAlert: false,
            countUpdateAlert: false
          },
          createdAt: new Date()
        });
      }

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
        await setDoc(analyticsRef, {
           date: today,
           totalDropOffs: 1,
           totalCollected: 0,
           totalMissingReports: 0,
           hourlyDropOffs: { [hour]: 1 }
        });
      }

      // Send Notification
      await sendNotification(
        studentRecord.uid, 
        `✅ Your laundry has been received! Token: ${autoToken}. Track status in the SmartDhobi app.`
      );

      setSuccessToken(autoToken);
      toast.success(`Token ${autoToken} assigned!`);
      
      setTimeout(() => {
        onClose();
        resetScanner();
      }, 2500);

    } catch (error) {
      console.error(error);
      toast.error('Failed to process drop-off');
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
            <span className="text-xl">📷</span> Scan Student QR
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {successToken ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-2">
                {successToken === 'COLLECTED' ? 'Ready for Collection!' : 'Drop-Off Confirmed!'}
              </h4>
              <div className="bg-slate-100 py-3 px-6 rounded-lg inline-block">
                <span className="font-mono text-3xl font-bold text-teal-600 tracking-wider">
                  {successToken === 'COLLECTED' ? 'DONE' : successToken}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                {successToken === 'COLLECTED' ? 'Student notified' : 'Auto-generated token • Student notified'}
              </p>
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
              {/* Student Info Card */}
              <div className="bg-teal-50 p-5 rounded-xl mb-5 border border-teal-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-teal-200 flex items-center justify-center text-teal-800 font-bold text-2xl shrink-0">
                    {studentRecord.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-800">{studentRecord.name}</h4>
                    {studentRecord.uniqueId && (
                      <p className="text-sm text-teal-700 font-mono font-semibold">{studentRecord.uniqueId}</p>
                    )}
                  </div>
                  <button onClick={resetScanner} className="text-xs text-teal-600 underline shrink-0">Rescan</button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-teal-100">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Room</p>
                    <p className="font-bold text-gray-800 text-lg">{studentRecord.roomNo}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-teal-100">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Block</p>
                    <p className="font-bold text-gray-800 text-lg">{studentRecord.hostelBlock}</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center border ${activeOrder?.clothesCount ? 'bg-amber-50 border-amber-200' : 'bg-white border-teal-100'}`}>
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Declared</p>
                    <p className={`font-bold text-lg ${activeOrder?.clothesCount ? 'text-amber-700' : 'text-slate-400'}`}>
                      {activeOrder?.clothesCount || '—'}
                    </p>
                  </div>
                </div>

                {studentRecord.phone && (
                  <p className="text-xs text-slate-500 mt-3 text-center">{studentRecord.phone}</p>
                )}
              </div>

              {/* Bundle Photo Preview (Zone 2 — Dhobi sees declared photo) */}
              {activeOrder?.bundlePhotoUrl && activeOrder.status !== 'readyInRack' && (
                <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                    <span className="text-sm">📸</span>
                    <span className="text-xs font-medium text-slate-600">Student's Bundle Photo</span>
                  </div>
                  <img
                    src={activeOrder.bundlePhotoUrl}
                    alt="Clothes bundle"
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              {/* Status indicator */}
              {activeOrder?.status === 'readyInRack' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-sm text-blue-700">
                  <div className="font-bold flex items-center gap-2 mb-2">
                    <span className="text-lg">📦</span> Laundry Ready for Collection
                  </div>
                  <p>Rack No: <strong>{activeOrder.rackNo}</strong> • Target Items: <strong>{activeOrder.verifiedCount || activeOrder.clothesCount}</strong></p>
                </div>
              ) : activeOrder ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5 flex items-center gap-2 text-sm text-green-700 font-medium">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  Student notified via app — {activeOrder.clothesCount} items declared
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 flex items-center gap-2 text-sm text-amber-700 font-medium">
                  <span>⚠️</span> Walk-in — student did not notify via app
                </div>
              )}

              {/* Actions */}
              {activeOrder?.status === 'readyInRack' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={returnCount}
                      onChange={(e) => setReturnCount(e.target.value)}
                      className="flex-[2] border-2 border-slate-300 rounded-xl p-3 text-center text-xl font-bold font-mono focus:outline-none focus:border-slate-500 text-gray-800 bg-white"
                      placeholder="Return items"
                    />
                    <button
                      onClick={handleMarkCollected}
                      disabled={loading}
                      className="flex-[3] bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                    >
                      {loading ? '...' : '✅ Mark Collected'}
                    </button>
                  </div>
                  <button onClick={handleClose} className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors">Cancel</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3.5 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptAndGenerate}
                    disabled={loading}
                    className="flex-[2] py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold flex justify-center items-center shadow-lg shadow-teal-600/30 transition-all active:scale-[0.98] text-base gap-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>✅</span> Accept & Generate Token
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
