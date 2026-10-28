import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthModal } from '../components/GoogleOAuthModal';
import { User } from '../types';

export const GoogleOAuthPopupPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (user: User) => {
    localStorage.setItem('roombridge_user', JSON.stringify(user));

    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user }, '*');
      } catch (e) {
        console.error('postMessage error:', e);
      }
      setTimeout(() => {
        window.close();
      }, 400);
    } else {
      // If user opened this URL directly in regular tab
      navigate('/questionnaire');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex flex-col justify-center items-center p-3 sm:p-6">
      <GoogleOAuthModal
        isOpen={true}
        onClose={() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/');
          }
        }}
        onSuccess={handleSuccess}
        isStandalonePopup={true}
      />
    </div>
  );
};
