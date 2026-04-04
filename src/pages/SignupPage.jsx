import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    uniqueId: '', // Represents Registration ID or Staff ID
    mobile: '',
    password: '',
    hostelBlock: 'Block A',
    roomNo: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateStudentId = (id) => {
    const idRegex = /^[0-9]{2}[a-zA-Z]{3}[0-9]{4}$/;
    return idRegex.test(id);
  };

  const checkUniqueId = async (id, currentRole) => {
    const q = query(collection(db, 'users'), where('uniqueId', '==', id), where('role', '==', currentRole));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // True if it doesn't exist yet
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key') {
      toast.error('Firebase is not connected! Please add your Database keys to the .env file.');
      return;
    }

    if (!validateMobile(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (role === 'student' && !validateStudentId(formData.uniqueId)) {
      toast.error('Registration ID must be in the format e.g. 22BCE1789');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Check for Unique ID usage before creating Auth account
      const isUnique = await checkUniqueId(formData.uniqueId, role);
      if (!isUnique) {
        toast.error(`This ${role === 'student' ? 'Registration ID' : 'Staff ID'} is already registered.`);
        setLoading(false);
        return;
      }

      // Automatically generate a dummy email based on ID and role 
      // since Firebase Auth requires an email, and the prompt implies Mobile-centric login
      // but we previously built the app using Email/Password auth.
      // Easiest seamless solution: Construct email behind the scenes mapping Mobile/ID -> Email
      const seamlessEmail = `${formData.uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '')}@smartdhobi.com`;

      const userCredential = await createUserWithEmailAndPassword(auth, seamlessEmail, formData.password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      
      const provisionedData = {
        uid: user.uid,
        name: formData.name,
        email: seamlessEmail, // Keep for backward compatibility with db structure
        phone: `+91${formData.mobile}`,
        role: role,
        uniqueId: formData.uniqueId, // Registration ID / Staff ID
        fcmToken: '',
        createdAt: new Date()
      };

      // Add student specific fields
      if (role === 'student') {
        provisionedData.hostelBlock = formData.hostelBlock;
        provisionedData.roomNo = formData.roomNo;
        provisionedData.qrCodeData = user.uid; // Generated for counter scanning
      }

      await setDoc(userDocRef, provisionedData);

      toast.success('Registration successful!');
      
      // Auto-route to respective dashboard
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'staff') navigate('/dhobi/dashboard');

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This ID is already tied to an existing account.');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center p-4 py-10">
      
      <div className="mb-8 text-center animate-fade-in-down">
        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-600/30">
          <span className="text-3xl">🧺</span>
        </div>
        <h1 className="text-3xl font-bold text-teal-700 tracking-tight">Join SmartDhobi</h1>
        <p className="text-slate-500 mt-2 font-medium">Create your campus active account</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${role === 'student' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole('student')}
          >
            Student Account
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${role === 'staff' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole('staff')}
          >
            Dhobi Staff Account
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-slate-300 bg-slate-50 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {role === 'student' ? 'Registration ID *' : 'Staff ID *'}
              </label>
              <input 
                type="text" 
                name="uniqueId"
                required
                value={formData.uniqueId}
                onChange={handleChange}
                className="w-full border border-slate-300 bg-slate-50 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 uppercase"
                placeholder={role === 'student' ? 'e.g., 22BCE1789' : 'e.g., DHB-042'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 sm:text-sm">
                  +91
                </span>
                <input 
                  type="tel" 
                  name="mobile"
                  required
                  maxLength="10"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="flex-1 w-full border border-slate-300 bg-slate-50 py-2.5 px-3 rounded-none rounded-r-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  placeholder="9876543210"
                />
              </div>
            </div>

            {role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Hostel Block *</label>
                   <select 
                      name="hostelBlock" 
                      value={formData.hostelBlock} 
                      onChange={handleChange}
                      className="w-full border border-slate-300 bg-slate-50 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                   >
                     <option value="Block A">Block A</option>
                     <option value="Block B">Block B</option>
                     <option value="Block C">Block C</option>
                     <option value="Girls Hostel">Girls Hostel</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Room No. *</label>
                   <input 
                     type="text" 
                     name="roomNo"
                     required
                     value={formData.roomNo}
                     onChange={handleChange}
                     className="w-full border border-slate-300 bg-slate-50 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                     placeholder="e.g. A-101"
                   />
                 </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Create Password *</label>
              <input 
                type="password" 
                name="password"
                required
                minLength="6"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-slate-300 bg-slate-50 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="Minimum 6 characters"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-600/30 transition-transform active:scale-[0.98] flex justify-center items-center text-base mt-8"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-teal-600 font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
