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
      toast.error('Firebase is not connected! Please add your Database keys to the .env file.');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      // Convert Registration ID / Staff ID to the seamless email format
      // Must match exactly what SignupPage generates
      const formattedEmail = email.includes('@') 
        ? email 
        : `${email.toLowerCase().replace(/[^a-z0-9]/g, '')}@smartdhobi.com`;

      try {
        userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
      } catch (authErr) {
        // Only auto-create for the 3 built-in demo accounts
        const isDemoAccount = ['student@smartdhobi.com', 'dhobi@smartdhobi.com', 'admin@smartdhobi.com'].includes(formattedEmail);
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
        // Provision the Firestore document for newly created demo users
        if (formattedEmail.includes('student')) uRole = 'student';
        else if (formattedEmail.includes('dhobi')) uRole = 'staff';
        else if (formattedEmail.includes('admin')) uRole = 'admin';

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

    } catch (error) {
      console.error('Login error:', error.code, error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast.error('No account found with this ID. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Wrong password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please wait a moment and try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid ID format. Please check and try again.');
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
    }
    
    setEmail(demoEmail);
    setPassword(demoPass);
    // Auto submit
    setTimeout(() => {
      document.getElementById("loginForm").requestSubmit();
    }, 100);
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
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${role === 'student' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${role === 'staff' ? 'text-teal-600 border-b-2 border-teal-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole('staff')}
          >
            Dhobi Staff
          </button>
        </div>

        <div className="p-8">
          <form id="loginForm" onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input 
                type="text" 
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full border-b-2 border-slate-300 bg-transparent py-2 px-1 text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-0 placeholder-transparent"
                placeholder="Email or DB ID"
              />
              <label 
                htmlFor="email" 
                className="absolute left-1 -top-3.5 text-sm text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-teal-600 font-medium"
              >
                Registration ID / Staff ID / Email
              </label>
            </div>

            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full border-b-2 border-slate-300 bg-transparent py-2 px-1 pr-10 text-gray-900 focus:outline-none focus:border-teal-600 focus:ring-0 placeholder-transparent"
                placeholder="Password"
              />
              <label 
                htmlFor="password" 
                className="absolute left-1 -top-3.5 text-sm text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-teal-600 font-medium"
              >
                Password
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-slate-400 hover:text-teal-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-600/30 transition-transform active:scale-[0.98] flex justify-center items-center text-lg mt-8"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Log in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New to SmartDhobi? <Link to="/signup" className="text-teal-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      <div className="mt-10 bg-white/50 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-md text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">1-Click Demo Login</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => handleDemoLogin('student')} className="text-xs bg-white hover:bg-slate-50 border border-slate-200 py-2 rounded-lg font-medium text-slate-700 shadow-sm transition-colors">
            🙋‍♂️ Student
          </button>
          <button onClick={() => handleDemoLogin('staff')} className="text-xs bg-white hover:bg-slate-50 border border-slate-200 py-2 rounded-lg font-medium text-teal-700 shadow-sm transition-colors">
            👔 Staff
          </button>
          <button onClick={() => handleDemoLogin('admin')} className="text-xs bg-white hover:bg-slate-50 border border-indigo-200 py-2 rounded-lg font-medium text-indigo-700 shadow-sm transition-colors">
            👑 Admin
          </button>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
