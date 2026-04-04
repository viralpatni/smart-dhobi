import React, { useState } from 'react';
import { supabase } from '../supabase';
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
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('unique_id', id)
      .eq('role', currentRole);
    return !data || data.length === 0; // True if it doesn't exist yet
  };

  const handleSignup = async (e) => {
    e.preventDefault();

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

      const seamlessEmail = `${formData.uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '')}@smartdhobi.com`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: seamlessEmail,
        password: formData.password,
      });

      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error('Signup failed - no user returned');

      const profileData = {
        id: user.id,
        name: formData.name,
        email: seamlessEmail,
        phone: `+91${formData.mobile}`,
        role: role,
        unique_id: formData.uniqueId,
        hostel_block: role === 'student' ? formData.hostelBlock : '',
        room_no: role === 'student' ? formData.roomNo : '',
      };

      const { error: profileError } = await supabase.from('profiles').insert(profileData);
      if (profileError) throw profileError;

      toast.success('Registration successful!');
      
      // Auto-route to respective dashboard
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'staff') navigate('/dhobi/dashboard');

    } catch (error) {
      console.error('Signup Full Error:', error);
      const msg = error.message || '';
      
      // If we created the auth user but profile failed, it's usually RLS or a duplicate.
      // In a real app, you'd want to clean up the auth user or use a Postgres function (RPC) to do both together.
      
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')) {
        toast.error('This ID is already tied to an existing account. Try logging in instead.');
      } else if (msg.includes('unexpected') || msg.includes('Database error')) {
        toast.error('Server error during profile creation. Please contact support.');
      } else {
        toast.error(`Signup failed: ${msg || 'Please check your connection and try again.'}`);
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
