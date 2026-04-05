import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if(e) e.preventDefault();
    
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key') {
      toast.error('Firebase is not connected! Please add your keys.');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      const formattedEmail = email.includes('@') 
        ? email 
        : `${email.toLowerCase().replace(/[^a-z0-9]/g, '')}@smartdhobi.com`;

      try {
        userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
      } catch (authErr) {
        // Auto-create for demo accounts if not found
        const isDemoAccount = ['student@smartdhobi.com', 'dhobi@smartdhobi.com', 'admin@smartdhobi.com', 'paidstaff@smartdhobi.com'].includes(formattedEmail);
        if (isDemoAccount && authErr.code === 'auth/user-not-found') {
          userCredential = await createUserWithEmailAndPassword(auth, formattedEmail, password);
        } else {
          throw authErr;
        }
      }

      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let uRole = role;

      if (userDoc.exists()) {
        uRole = userDoc.data().role;
      } else {
        if (formattedEmail.includes('student')) uRole = 'student';
        else if (formattedEmail.includes('dhobi')) uRole = 'staff';
        else if (formattedEmail.includes('admin')) uRole = 'admin';
        else if (formattedEmail.includes('paidstaff')) uRole = 'paidStaff';

        await setDoc(userDocRef, {
          uid: user.uid,
          name: formattedEmail.split('@')[0].toUpperCase(),
          email: formattedEmail,
          phone: '+919876543210',
          role: uRole,
          hostelBlock: 'Block A',
          roomNo: '101',
          qrCodeData: user.uid,
          fcmToken: '',
          createdAt: new Date()
        });
      }

      if (uRole === 'student') navigate('/student/dashboard');
      else if (uRole === 'staff') navigate('/dhobi/dashboard');
      else if (uRole === 'admin') navigate('/admin/dashboard');
      else if (uRole === 'paidStaff') navigate('/paid-dhobi/dashboard');
      
      toast.success('Login successful!');

    } catch (error) {
      console.error('Login error:', error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast.error('No account found with this ID or wrong password.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please wait a moment.');
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole) => {
    let demoEmail = '';
    let demoPass = '';
    
    if (demoRole === 'student') {
      demoEmail = import.meta.env.VITE_DEMO_STUDENT_EMAIL || 'student@smartdhobi.com';
      demoPass = import.meta.env.VITE_DEMO_STUDENT_PASSWORD || 'demo1234';
      setRole('student');
    } else if (demoRole === 'staff') {
      demoEmail = import.meta.env.VITE_DEMO_DHOBI_EMAIL || 'dhobi@smartdhobi.com';
      demoPass = import.meta.env.VITE_DEMO_DHOBI_PASSWORD || 'demo1234';
      setRole('staff');
    } else if (demoRole === 'admin') {
      demoEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@smartdhobi.com';
      demoPass = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo1234';
    } else if (demoRole === 'paidStaff') {
      demoEmail = import.meta.env.VITE_DEMO_PAID_DHOBI_EMAIL || 'paidstaff@smartdhobi.com';
      demoPass = import.meta.env.VITE_DEMO_PAID_DHOBI_PASSWORD || 'demo1234';
      setRole('paidStaff');
    }
    
    setEmail(demoEmail);
    setPassword(demoPass);
    setTimeout(() => {
        handleLogin();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center animate-fade-in-down">
        <div className="w-20 h-20 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-600/30">
          <span className="text-4xl">🧺</span>
        </div>
        <h1 className="text-3xl font-bold text-teal-700 tracking-tight">SmartDhobi</h1>
        <p className="text-slate-500 mt-2 font-medium">Campus Laundry Made Simple</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs sm:text-sm">
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'student' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('student')}>Student</button>
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'staff' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('staff')}>Dhobi</button>
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'admin' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('admin')}>Admin</button>
          <button className={`flex-1 px-2 py-4 font-bold transition-colors whitespace-nowrap ${role === 'paidStaff' ? 'text-amber-500 border-b-2 border-amber-500 bg-white' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setRole('paidStaff')}>Premium</button>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input type="text" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full border-b-2 border-slate-300 bg-transparent py-2 px-1 text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-0 placeholder-transparent" placeholder="ID" />
              <label htmlFor="email" className="absolute left-1 -top-3.5 text-sm text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-teal-600 font-medium">Registration ID / Staff ID / Email</label>
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="peer w-full border-b-2 border-slate-300 bg-transparent py-2 px-1 pr-10 text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-0 placeholder-transparent" placeholder="Password" />
              <label htmlFor="password" className="absolute left-1 -top-3.5 text-sm text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-teal-600 font-medium">Password</label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-slate-400 hover:text-teal-600">{showPassword ? '👁️' : '🕶️'}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-600/30 transition-transform active:scale-[0.98] flex justify-center items-center text-lg mt-8">{loading ? '...' : 'Log in'}</button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">New to SmartDhobi? <Link to="/signup" className="text-teal-600 font-bold hover:underline">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
