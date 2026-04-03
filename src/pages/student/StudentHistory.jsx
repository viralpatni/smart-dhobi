import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import StatusBadge from '../../components/common/StatusBadge';
import { formatStandardDate } from '../../utils/formatDate';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import MissingItemModal from '../../components/student/MissingItemModal';

const StudentHistory = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('studentId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(fetched);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentUser]);

  const isWithin24Hours = (timestamp) => {
    if (!timestamp) return false;
    const collectedTime = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const diffHours = Math.abs(new Date() - collectedTime) / 36e5;
    return diffHours <= 24;
  };

  return (
    <div className="bg-surface min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[420px] bg-white min-h-screen shadow-lg relative pb-20">
        
        {/* Header */}
        <div className="pt-8 pb-4 px-6 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Link to="/student/dashboard" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Order History</h1>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <Loader />
          ) : orders.length === 0 ? (
            <div className="text-center py-10 mt-10 text-slate-500">
              <span className="text-4xl block mb-3">📭</span>
              No previous laundry orders found.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const canReportMissing = order.status === 'collected' && !order.missingItemReported && isWithin24Hours(order.collectedTime);
                
                return (
                  <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    {/* Left border accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'collected' ? 'bg-green-400' : 'bg-teal-400'}`}></div>
                    
                    <div className="flex justify-between items-start mb-3 pl-2">
                       <div>
                         <span className="text-xs text-slate-500 block mb-1">{formatStandardDate(order.createdAt)}</span>
                         <span className="font-mono text-sm font-semibold bg-slate-100 px-2 py-0.5 rounded">{order.tokenId}</span>
                       </div>
                       <StatusBadge status={order.status} />
                    </div>
                    
                    <div className="pl-2 flex gap-4 text-sm mt-3 border-t border-slate-100 pt-3">
                       <div className="flex-1">
                         <span className="text-slate-500 block text-xs">Items</span>
                         <span className="font-semibold text-slate-700">{order.clothesCount || '-'}</span>
                       </div>
                       {order.rackNo && (
                         <div className="flex-1">
                           <span className="text-slate-500 block text-xs">Rack</span>
                           <span className="font-semibold text-slate-700">{order.rackNo}</span>
                         </div>
                       )}
                    </div>

                    {order.missingItemReported && (
                      <div className="mt-3 ml-2 flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 p-2 rounded">
                        <span>⚠ Missing item reported</span>
                      </div>
                    )}

                    {canReportMissing && (
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="mt-3 ml-2 w-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 py-2 rounded-lg transition-colors border-dashed"
                      >
                        Report Missing Item
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-[420px] bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-20 pb-safe">
          <Link to="/student/dashboard" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
             <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>
          <Link to="/student/qr" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <div className="bg-teal-500 rounded-full p-3 -mt-8 shadow-lg shadow-teal-500/30 text-white border-4 border-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
             </div>
             <span className="text-[10px] font-medium mt-1">QR Code</span>
          </Link>
          <Link to="/student/history" className="flex flex-col items-center text-teal-600">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
             <span className="text-[10px] font-medium mt-1">History</span>
          </Link>
        </div>
      </div>

      <MissingItemModal 
        isOpen={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
      />
    </div>
  );
};

export default StudentHistory;
