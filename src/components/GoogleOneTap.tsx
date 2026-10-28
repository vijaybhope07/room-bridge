import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

interface GoogleOneTapProps {
  currentUser: User | null;
  onSuccess: (user: User) => void;
  onOpenFullGoogleModal: () => void;
}

export const GoogleOneTap: React.FC<GoogleOneTapProps> = ({
  currentUser,
  onSuccess,
  onOpenFullGoogleModal
}) => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('roombridge_onetap_dismissed') === 'true';
  });
  const [primaryAccount, setPrimaryAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser || dismissed) return;

    // Fetch detected Google account on system
    api.getGoogleAccounts().then(accs => {
      if (accs && accs.length > 0) {
        setPrimaryAccount(accs[0]);
      }
    }).catch(() => {});
  }, [currentUser, dismissed]);

  if (currentUser || dismissed || !primaryAccount) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('roombridge_onetap_dismissed', 'true');
  };

  const handleOneTapSignIn = async () => {
    setLoading(true);
    try {
      const apiKey = localStorage.getItem('roombridge_google_api_key') || 
        (import.meta as any).env?.VITE_FIREBASE_API_KEY ||
        (import.meta as any).env?.VITE_GOOGLE_API_KEY || 
        'AIzaSyDV1ElvApvcIbROD5a5xxl3Q-BWZr_5-hM';

      const authed = await api.loginWithGoogle({
        email: primaryAccount.email,
        displayName: primaryAccount.displayName,
        photoUrl: primaryAccount.profileImageUrl,
        apiKey
      });

      toast.success(`Signed in with Google One Tap! Profile details filled automatically for ${authed.displayName}`);
      onSuccess(authed);
    } catch (err: any) {
      toast.error('Google One Tap sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const firstName = primaryAccount.displayName?.split(' ')[0] || 'User';

  return (
    <div 
      className="fixed top-4 right-4 z-[9999] w-[370px] max-w-[calc(100vw-32px)] bg-white rounded-2xl border border-[#dadce0] shadow-[0_4px_24px_rgba(60,64,67,0.22)] overflow-hidden animate-in slide-in-from-top-4 duration-300 text-[#202124]"
      style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Google Header */}
      <div className="px-4 py-3 border-b border-[#dadce0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span className="font-medium text-xs text-[#202124]">
            Sign in to RoomBridge with Google
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-slate-100 transition-colors"
          title="Close Google One Tap"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Account Info & 1-Click Action */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-center gap-3">
          {primaryAccount.profileImageUrl ? (
            <img
              src={primaryAccount.profileImageUrl}
              alt={primaryAccount.displayName}
              className="w-10 h-10 rounded-full object-cover border border-[#dadce0] flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-medium flex items-center justify-center text-sm flex-shrink-0">
              {primaryAccount.displayName ? primaryAccount.displayName.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-[#202124] leading-tight truncate">
              {primaryAccount.displayName}
            </p>
            <p className="text-xs text-[#5f6368] truncate mt-0.5">
              {primaryAccount.email}
            </p>
          </div>
        </div>

        {/* Big Blue Continue Button */}
        <button
          onClick={handleOneTapSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <span>Continue as {firstName}</span>
          )}
        </button>

        {/* Secondary Switch Link */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <button
            onClick={() => {
              handleDismiss();
              onOpenFullGoogleModal();
            }}
            className="text-[#1a73e8] hover:underline font-medium"
          >
            Use another account
          </button>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            Auto-fill profile
          </span>
        </div>

        {/* Google Terms Note */}
        <p className="text-[10px] text-[#5f6368] leading-tight border-t border-[#dadce0] pt-2.5">
          To continue, Google will share your name, email address, language preference, and profile picture with RoomBridge.
        </p>
      </div>
    </div>
  );
};
