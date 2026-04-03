import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const OnMyWayButton = ({ scheduleId }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alreadyNotified, setAlreadyNotified] = useState(false);
  const [clothesCount, setClothesCount] = useState(5);
  const [bundlePhoto, setBundlePhoto] = useState(null);
  const [bundlePhotoPreview, setBundlePhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const { userData, currentUser } = useAuth();

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

  const MAX_CLOTHES = 30;

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }

    setBundlePhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBundlePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Resize to max 800px wide
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress to JPEG at 60% quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleNotify = async () => {
    if (clothesCount < 1) {
      toast.error('Please select at least 1 item');
      return;
    }
    if (clothesCount > MAX_CLOTHES) {
      toast.error(`Maximum ${MAX_CLOTHES} items allowed per drop-off.`);
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

      // Compress and encode photo if provided
      let bundlePhotoData = null;
      if (bundlePhoto) {
        setUploadingPhoto(true);
        try {
          bundlePhotoData = await compressAndConvertToBase64(bundlePhoto);
        } catch {
          console.warn('Photo compression failed, proceeding without photo');
        }
        setUploadingPhoto(false);
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
        declaredCount: parseInt(clothesCount, 10), // Original student-declared count
        bundlePhotoUrl: bundlePhotoData, // Base64 encoded photo
        verifiedCount: null, // Dhobi fills this in Zone 3
        returnCount: null, // Dhobi fills on collection
        rackNo: null,
        status: 'onTheWay',
        dropOffTime: null,
        rackAssignedTime: null,
        collectedTime: null,
        missingItemReported: false,
        missingItemDesc: '',
        missingCount: 0,
        countDisputeStatus: null, // null | 'pending' | 'confirmed' | 'disputed'
        countDisputeDeadline: null,
        notificationLog: {
          dropOffAlert: false,
          rackReadyAlert: false,
          countUpdateAlert: false
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
      setUploadingPhoto(false);
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

          <div className="p-5 space-y-5">
            {/* Clothes Count Slider */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                How many clothes?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max={MAX_CLOTHES}
                  value={clothesCount}
                  onChange={(e) => setClothesCount(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((clothesCount - 1) / (MAX_CLOTHES - 1)) * 100}%, #e2e8f0 ${((clothesCount - 1) / (MAX_CLOTHES - 1)) * 100}%, #e2e8f0 100%)`
                  }}
                />
                <div className="w-16 h-14 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-amber-700">{clothesCount}</span>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                <span>1</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                📸 Photo of your clothes bundle
              </label>
              <p className="text-xs text-slate-400 mb-3">A quick snap so the Dhobi can verify your items</p>

              {bundlePhotoPreview ? (
                <div className="relative">
                  <img
                    src={bundlePhotoPreview}
                    alt="Bundle preview"
                    className="w-full h-48 object-cover rounded-xl border-2 border-green-300"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      ✓ Ready
                    </span>
                    <button
                      onClick={() => {
                        setBundlePhoto(null);
                        setBundlePhotoPreview(null);
                      }}
                      className="bg-red-500 text-white text-xs font-bold w-7 h-7 rounded-full shadow flex items-center justify-center hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-600 transition-colors bg-slate-50 hover:bg-amber-50"
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="text-sm font-medium">Tap to take a photo</span>
                  <span className="text-[10px]">or choose from gallery</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
              <span className="text-blue-500 shrink-0 mt-0.5">💡</span>
              <p className="text-xs text-blue-700">
                Your photo uploads while you walk to the counter. The Dhobi will see your declaration before you arrive!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setShowForm(false);
                  setBundlePhoto(null);
                  setBundlePhotoPreview(null);
                  setClothesCount(5);
                }}
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
                    <span>{uploadingPhoto ? 'Uploading photo...' : 'Notifying...'}</span>
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
