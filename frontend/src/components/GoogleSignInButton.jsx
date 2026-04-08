import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

const GoogleSignInButton = ({ onSuccess, onError }) => {
  const handleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await api.post('/auth/google', { token: credential });
      onSuccess(res.data);
    } catch (err) {
      onError(err.response?.data?.error || 'Google login failed');
    }
  };

  return (
    <div className="w-full flex justify-center mt-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError('Login Failed')}
        useOneTap
        shape="rectangular"
        size="large"
      />
    </div>
  );
};

export default GoogleSignInButton;
