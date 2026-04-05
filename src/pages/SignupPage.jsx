import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    uniqueId: '',
    mobile: '',
    password: '',
    hostelBlock: 'Block A',
    roomNo: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const seamlessEmail = `${formData.uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '')}@smartdhobi.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, seamlessEmail, formData.password);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        name: formData.name,
        email: seamlessEmail,
        phone: `+91${formData.mobile}`,
        role: role,
        uniqueId: formData.uniqueId,
        createdAt: serverTimestamp()
      };

      if (role === 'student') {
        userData.hostelBlock = formData.hostelBlock;
        userData.roomNo = formData.roomNo;
        userData.qrCodeData = user.uid;
      }

      await setDoc(doc(db, 'users', user.uid), userData);

      toast.success('Registration complete!');
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'paidStaff') navigate('/paid-dhobi/dashboard');
      else navigate('/dhobi/dashboard');

    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('An account already exists with this ID.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. (Min 6 characters).');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Check your connection or disable ad-blockers.');
      } else {
        toast.error(`Registration failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center animate-fade-in-down">
        <h1 className="text-3xl font-bold text-teal-700 tracking-tight">Join SmartDhobi</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs sm:text-sm">
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'student' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('student')}>Student</button>
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'staff' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('staff')}>Dhobi</button>
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'admin' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('admin')}>Admin</button>
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'paidStaff' ? 'text-amber-500 border-b-2 border-amber-500 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('paidStaff')}>Premium</button>
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
                className="w-full border border-slate-300 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="hare ram"
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
                className="w-full border border-slate-300 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 uppercase"
                placeholder={role === 'student' ? '2024CS006' : 'e.g., DHB-042'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                  +91
                </span>
                <input 
                  type="tel" 
                  name="mobile"
                  required
                  maxLength="10"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="flex-1 w-full border border-slate-300 py-2.5 px-3 rounded-none rounded-r-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
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
                      className="w-full border border-slate-300 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 appearance-none bg-white"
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
                     className="w-full border border-slate-300 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                     placeholder="A-823"
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
                className="w-full border border-slate-300 py-2.5 px-3 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="•••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#119584] hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-[0.98] flex justify-center items-center text-base mt-6"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 relative pb-2">
            Already have an account? <Link to="/login" className="text-[#119584] font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );};

export default SignupPage;
