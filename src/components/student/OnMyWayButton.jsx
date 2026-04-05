import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const OnMyWayButton = ({ scheduleId }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alreadyNotified, setAlreadyNotified] = useState(false);
  const [numberOfClothes, setNumberOfClothes] = useState('');
  const [photos, setPhotos] = useState([]);
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
        const querySnapshot = await getDocs(q);
          
        if (!querySnapshot.empty) {
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
    if (!numberOfClothes || isNaN(numberOfClothes) || parseInt(numberOfClothes) <= 0) {
      toast.error("Please enter a valid number of clothes.");
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
      const querySnapshot = await getDocs(q);
        
      if (!querySnapshot.empty) {
        setAlreadyNotified(true);
        toast('Staff was already notified!', { icon: 'ℹ️' });
        setLoading(false);
        return;
      }

      const orderRef = await addDoc(collection(db, 'orders'), {
        tokenId: 'PENDING',
        studentId: currentUser.uid,
        studentName: userData.name,
        studentPhone: userData.phone,
        studentRoom: userData.roomNo,
        studentBlock: userData.hostelBlock,
        studentUniqueId: userData.uniqueId || '',
        dhobiId: '',
        status: 'onTheWay',
        expectedCount: parseInt(numberOfClothes),
        dropOffTime: null,
        rackAssignedTime: null,
        collectedTime: null,
        missingItemReported: false,
        missingItemDesc: '',
        missingCount: 0,
        countDisputeStatus: null, // null | 'pending' | 'confirmed' | 'disputed'
        countDisputeDeadline: null,
        studentPhotos: [],
        notificationLog: {
          dropOffAlert: false,
          rackReadyAlert: false,
          countUpdateAlert: false
        },
        createdAt: serverTimestamp()
      });

      // Now handle photo uploads if there are any
      if (photos.length > 0) {
        toast.loading("Uploading photos...", { id: "photo-upload" });
        try {
          const uploadPromises = photos.map(async (photo) => {
            // Create a reference for the file
            const fileExtension = photo.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
            const photoRef = ref(storage, `laundry_photos/${orderRef.id}/${fileName}`);
            
            // Upload the file
            await uploadBytes(photoRef, photo);
            
            // Get the download URL
            return await getDownloadURL(photoRef);
          });
          
          const uploadedPhotoUrls = await Promise.all(uploadPromises);
          
          // Update the order with photo URLs
          await updateDoc(doc(db, 'orders', orderRef.id), {
            studentPhotos: uploadedPhotoUrls
          });
          
          toast.success("Photos uploaded successfully!", { id: "photo-upload" });
        } catch (uploadError) {
          console.error("Error uploading photos:", uploadError);
          toast.error("Order created, but failed to upload some photos.", { id: "photo-upload" });
        }
      }

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
                Please enter the approximate number of clothes and upload photos of them below.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Number of Clothes <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                min="1"
                required
                value={numberOfClothes}
                onChange={(e) => setNumberOfClothes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="e.g. 15"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Upload Photos (Optional)
              </label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => setPhotos(Array.from(e.target.files))}
                className="w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-amber-50 file:text-amber-700
                  hover:file:bg-amber-100
                  cursor-pointer bg-slate-50 border border-slate-200 rounded-xl p-1"
              />
              {photos.length > 0 && (
                <div className="mt-2 text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-md inline-block">
                  ✓ {photos.length} photo{photos.length > 1 ? 's' : ''} selected
                </div>
              )}
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
