import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register business');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="bg-brand-100 p-3 rounded-full inline-block mb-2">
            <Building2 className="mx-auto h-8 w-8 text-brand-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Register your Business</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Sign in
            </Link>
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 text-sm rounded-md border border-red-200 text-center">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <Input
              label="Business Name"
              name="businessName"
              required
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Acme Corp"
              className="sm:col-span-1"
            />
            <Input
              label="Industry"
              name="industry"
              required
              value={formData.industry}
              onChange={handleChange}
              placeholder="Retail"
              className="sm:col-span-1"
            />
            <div className="sm:col-span-2 border-t border-gray-200 mt-2 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Manager Account Details</h3>
            </div>
            <Input
              label="Full Name"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className="sm:col-span-2"
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@company.com"
              className="sm:col-span-1"
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 890"
              className="sm:col-span-1"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              minLength="8"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="sm:col-span-2"
            />
          </div>

          <Button type="submit" className="w-full mt-8" size="lg" isLoading={loading}>
            Create Business Account
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
