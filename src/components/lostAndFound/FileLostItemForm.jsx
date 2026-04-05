import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { sendNotification } from '../../utils/sendNotification';
import toast from 'react-hot-toast';

const ITEM_TYPES = [
  'T-Shirt', 'Shirt', 'Jeans', 'Trousers', 'Shorts',
  'Jacket', 'Kurta', 'Towel', 'Socks', 'Other'
];

const ITEM_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Navy', hex: '#1E3A5A' },
];

const FileLostItemForm = ({ onSuccess }) => {
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Step 2 state
  const [itemType, setItemType] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemBrand, setItemBrand] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  // Step 3 state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newComplaintId, setNewComplaintId] = useState('');

  // Fetch recent collected orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('studentId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(o => o.status === 'collected');
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  const isOrder72hOld = (order) => {
    if (!order?.collectedTime) return false;
    const ct = order.collectedTime.toDate ? order.collectedTime.toDate() : new Date(order.collectedTime);
    return (Date.now() - ct.getTime()) > 72 * 60 * 60 * 1000;
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadProgress(0);
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    const storagePath = `lostAndFound/${currentUser.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, photoFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true';
      const collectedTime = selectedOrder.collectedTime;

      const complaintData = {
        studentId: currentUser.uid,
        studentName: userData?.name || '',
        studentPhone: userData?.phone || '',
        studentRoom: userData?.roomNo || '',
        hostelBlock: userData?.hostelBlock || '',
        relatedOrderId: selectedOrder.id,
        relatedTokenId: selectedOrder.tokenId,
        collectionDate: collectedTime || null,
        itemType,
        itemColor,
        itemBrand: itemBrand || 'No brand',
        itemDescription,
        itemPhoto: photoUrl,
        quantity,
        status: 'open',
        priority: 'medium',
        assignedDhobiId: null,
        staffNotes: '',
        foundLocation: '',
        resolvedAt: null,
        resolutionNote: '',
        notificationLog: {
          complaintReceived: true,
          statusUpdated: false,
          itemFound: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'lostAndFound'), complaintData);

      // Add first timeline event
      await addDoc(collection(db, 'lostAndFound', docRef.id, 'timeline'), {
        event: 'Complaint filed by student',
        by: 'student',
        note: `Missing ${itemColor} ${itemType} reported for order ${selectedOrder.tokenId}`,
        timestamp: serverTimestamp()
      });

      // Notification to student
      const studentMsg = `Your lost item complaint has been filed. Complaint ID: ${docRef.id.substring(0, 8).toUpperCase()}. We will review and update you within 24 hours. — SmartDhobi`;
      if (useMock) {
        console.log('[Mock WhatsApp → Student]:', studentMsg);
        toast(studentMsg, { duration: 6000, icon: '📩' });
      } else {
        await sendNotification(currentUser.uid, studentMsg);
      }

      // Notification to staff
      const staffMsg = `New lost item complaint filed by ${userData?.name || 'Student'} Room ${userData?.roomNo || '-'}. Item: ${itemType}, ${itemColor}. Token: ${selectedOrder.tokenId}. Please check.`;
      if (useMock) {
        console.log('[Mock WhatsApp → Staff]:', staffMsg);
        toast(staffMsg, { duration: 6000, icon: '🚨' });
      }
      // Fire-and-forget notification to all staff (via Cloud Function trigger instead)

      setNewComplaintId(docRef.id.substring(0, 8).toUpperCase());
      setSubmitted(true);
    } catch (err) {
      console.error('Submit complaint error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step validation
  const canGoToStep2 = selectedOrder !== null;
  const canGoToStep3 = itemType && itemColor && itemDescription.length >= 20;

  // Success screen
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Complaint Filed Successfully!</h3>
        <p className="text-sm text-slate-500 mb-2">ID: <span className="font-mono font-semibold text-teal-600">{newComplaintId}</span></p>
        <p className="text-xs text-slate-400 mb-6">We will review and update you within 24 hours.</p>
        <button
          onClick={() => onSuccess?.()}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          View My Complaints
        </button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0 mb-6 px-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
              step > s ? 'bg-teal-600 text-white' :
              step === s ? 'bg-teal-600 text-white ring-4 ring-teal-100' :
              'bg-slate-200 text-slate-500'
            }`}>
              {step > s ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-teal-500' : 'bg-slate-200'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 — Link to Order */}
      {step === 1 && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Which laundry order is this about?</h3>
          <p className="text-xs text-slate-500 mb-4">Select the order where a clothing item went missing.</p>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">📭</span>
              <p className="text-sm text-slate-500">No collected orders found.</p>
              <p className="text-xs text-slate-400 mt-1">You can only file complaints for collected orders.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const isOld = isOrder72hOld(order);
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-semibold text-slate-800">{order.tokenId}</span>
                        <span className="text-xs text-slate-500 ml-2 inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Collected
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      {order.clothesCount && ` • ${order.clothesCount} items`}
                    </p>
                    {isOld && isSelected && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                        This order was collected over 72 hours ago. We will still try our best.
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => canGoToStep2 && setStep(2)}
            disabled={!canGoToStep2}
            className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {/* STEP 2 — Describe the Item */}
      {step === 2 && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-1">What item is missing?</h3>
          <p className="text-xs text-slate-500 mb-4">Describe the missing item with as much detail as possible.</p>

          {/* Item Type Grid */}
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Item Type</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ITEM_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setItemType(type)}
                className={`py-2.5 px-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  itemType === type
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Color Swatches */}
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Item Color</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {ITEM_COLORS.map(({ name, hex }) => (
              <button
                key={name}
                onClick={() => setItemColor(name)}
                title={name}
                className={`w-9 h-9 rounded-full border-2 transition-all shrink-0 ${
                  itemColor === name
                    ? 'ring-2 ring-teal-500 ring-offset-2 border-teal-400 scale-110'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: hex }}
              ></button>
            ))}
          </div>
          {itemColor && <p className="text-xs text-slate-500 mb-3 -mt-2">Selected: {itemColor}</p>}

          {/* Quantity Stepper */}
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Quantity</label>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 text-lg font-bold"
            >−</button>
            <span className="text-lg font-bold text-slate-800 w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 text-lg font-bold"
            >+</button>
          </div>

          {/* Brand */}
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Brand (optional)</label>
          <input
            type="text"
            value={itemBrand}
            onChange={(e) => setItemBrand(e.target.value)}
            placeholder="e.g. H&M, Zara, No brand"
            className="border border-slate-200 rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm mb-4"
          />

          {/* Description */}
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Description *</label>
          <textarea
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="e.g. Dark blue slim-fit jeans, size 32, small bleach stain on left knee"
            rows={3}
            className="border border-slate-200 rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none"
          ></textarea>
          <p className={`text-xs mt-1 ${itemDescription.length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {itemDescription.length}/20 characters minimum
          </p>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => canGoToStep3 && setStep(3)}
              disabled={!canGoToStep3}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Photo & Submit */}
      {step === 3 && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Add a photo (optional but recommended)</h3>
          <p className="text-xs text-slate-500 mb-4">A photo helps staff identify your item faster.</p>

          {/* Upload zone */}
          {!photoPreview ? (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p className="text-sm font-medium text-slate-600">Tap to upload a photo of the item</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
              <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload progress */}
          {submitting && photoFile && uploadProgress < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Uploading photo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Summary card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400 text-xs">Token</span>
                <p className="font-mono font-medium text-slate-800">{selectedOrder?.tokenId}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Item</span>
                <p className="font-medium text-slate-800">{itemType}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Color</span>
                <p className="font-medium text-slate-800">{itemColor}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Quantity</span>
                <p className="font-medium text-slate-800">{quantity}</p>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileLostItemForm;
