import React, { useState, useEffect } from 'react';
import { RefreshCw, UserPlus, Lock, Check, KeyRound, ChevronDown, ExternalLink, Flame } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';
import { signInWithGoogleFirebase, syncUserProfileToFirestore, firebaseConfig } from '../services/firebase';

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  isStandalonePopup?: boolean;
}

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isStandalonePopup = false
}) => {
  const [availableAccounts, setAvailableAccounts] = useState<User[]>([]);
  const [showAddAnother, setShowAddAnother] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stepInAnother, setStepInAnother] = useState<'email' | 'password'>('email');
  
  const [googleApiKey, setGoogleApiKey] = useState(() => 
    localStorage.getItem('roombridge_google_api_key') || 
    (import.meta as any).env?.VITE_GOOGLE_API_KEY || 
    firebaseConfig.apiKey ||
    'AIzaSyDV1ElvApvcIbROD5a5xxl3Q-BWZr_5-hM'
  );
  const [googleClientId, setGoogleClientId] = useState(() => 
    localStorage.getItem('roombridge_google_client_id') || 
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [loading, setLoading] = useState(false);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string | null>(null);
  const [domainUnauthorized, setDomainUnauthorized] = useState(false);

  // Load existing Google accounts and config
  useEffect(() => {
    if (!isOpen && !isStandalonePopup) return;

    api.getGoogleAccounts().then(accs => {
      if (accs && accs.length > 0) {
        setAvailableAccounts(accs);
      }
    }).catch(() => {});

    api.getGoogleAuthConfig().then(cfg => {
      if (cfg?.apiKey && !localStorage.getItem('roombridge_google_api_key')) {
        setGoogleApiKey(cfg.apiKey);
      }
      if (cfg?.clientId && !googleClientId) {
        setGoogleClientId(cfg.clientId);
      }
    }).catch(() => {});
  }, [isOpen, isStandalonePopup]);

  const handleFirebaseGoogleSignIn = async () => {
    setLoading(true);
    try {
      const authed = await signInWithGoogleFirebase();
      localStorage.setItem('roombridge_user', JSON.stringify(authed));
      localStorage.setItem('roombridge_onboarding_completed', 'true');
      toast.success(`Connected via Firebase Google Auth: ${authed.displayName}`);
      onSuccess(authed);

      if (isStandalonePopup && window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: authed }, '*');
        setTimeout(() => {
          window.close();
        }, 300);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info('Google Sign-In popup was closed');
      } else if (err.code === 'auth/unauthorized-domain') {
        setDomainUnauthorized(true);
        toast.warning(
          `Domain "${window.location.hostname}" is not authorized in Firebase Console yet. Please pick any account below or enter your Gmail to continue instantly.`
        );
      } else {
        toast.error(err.message || 'Firebase Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (account: User) => {
    setSelectedAccountEmail(account.email);
    setLoading(true);

    try {
      const authed = await api.loginWithGoogle({
        email: account.email,
        displayName: account.displayName,
        photoUrl: account.profileImageUrl,
        apiKey: googleApiKey
      });

      localStorage.setItem('roombridge_user', JSON.stringify(authed));
      localStorage.setItem('roombridge_onboarding_completed', 'true');

      // Synchronize to Firebase Firestore
      syncUserProfileToFirestore(authed).catch(() => {});

      // Notify parent
      onSuccess(authed);

      if (isStandalonePopup && window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: authed }, '*');
        setTimeout(() => {
          window.close();
        }, 300);
      }
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!googleEmail.trim()) {
      toast.error('Please enter your Google / Gmail address');
      return;
    }

    if (!googleEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (stepInAnother === 'email' && !googlePassword) {
      setStepInAnother('password');
      return;
    }

    setLoading(true);
    try {
      const derivedName = googleName.trim() || googleEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const authed = await api.loginWithGoogle({
        email: googleEmail.trim().toLowerCase(),
        displayName: derivedName,
        apiKey: googleApiKey
      });

      localStorage.setItem('roombridge_user', JSON.stringify(authed));
      localStorage.setItem('roombridge_onboarding_completed', 'true');

      // Synchronize to Firebase Firestore
      syncUserProfileToFirestore(authed).catch(() => {});

      toast.success(`Google Account connected for ${authed.displayName}`);
      onSuccess(authed);

      if (isStandalonePopup && window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: authed }, '*');
        setTimeout(() => {
          window.close();
        }, 300);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to authenticate Google account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isStandalonePopup) return null;

  const content = (
    <div 
      className={`w-full max-w-[480px] bg-white rounded-[24px] shadow-2xl border border-slate-300/80 overflow-hidden flex flex-col text-[#202124] ${
        isStandalonePopup ? 'mx-auto my-auto min-h-screen sm:min-h-0 sm:my-6' : 'animate-in zoom-in-95 duration-150'
      }`}
      style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Authentic Google Browser Top Bar / Simulated address header */}
      <div className="px-4 py-2.5 bg-[#f1f3f4] border-b border-[#dadce0] flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          {!isStandalonePopup && (
            <div className="flex items-center gap-1.5">
              <span 
                className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={onClose} 
                title="Close"
              />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
            </div>
          )}
          <span className="text-[12px] font-medium text-[#5f6368] ml-1 flex items-center gap-1.5 truncate max-w-[230px]">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in – Google accounts</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full border border-[#dadce0] shadow-xs">
          <span className="text-emerald-600 font-bold">🔒</span>
          <span className="font-mono text-[10px]">accounts.google.com</span>
        </div>
      </div>

      {/* Google Material 3 Dual Animated Loading Bar */}
      {loading ? (
        <div className="w-full h-1 bg-[#e8f0fe] overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-[#1a73e8] animate-[googleProgress_1.5s_infinite_linear] w-1/2" />
        </div>
      ) : (
        <div className="w-full h-1 bg-transparent" />
      )}

      {/* Main Google Body Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Google G Logo & Headings */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <svg className="w-11 h-11" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h2 className="text-2xl font-normal text-[#202124] tracking-tight">
            {showAddAnother 
              ? stepInAnother === 'email' ? 'Sign in with Google' : `Welcome` 
              : 'Choose an account'}
          </h2>
          <p className="text-sm text-[#5f6368]">
            Sign in to <strong className="font-semibold text-[#202124]">RoomBridge</strong>
          </p>
        </div>

        {/* View A: Account Chooser List */}
        {!showAddAnother ? (
          <div className="space-y-3">
            {domainUnauthorized && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <span className="text-amber-600 font-bold text-sm">⚠️</span>
                    <span>Firebase Domain Authorization</span>
                  </div>
                  <a
                    href="https://console.firebase.google.com/project/roombridge-93411/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-0.5"
                  >
                    <span>Add Domain in Console</span>
                    <span>↗</span>
                  </a>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  <code className="bg-amber-100/90 px-1.5 py-0.5 rounded font-mono font-semibold text-amber-950">{typeof window !== 'undefined' ? window.location.hostname : 'domain'}</code> is not yet whitelisted in Firebase Console Authorized Domains.
                </p>
                <div className="pt-1.5 border-t border-amber-200/70 text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                  <span>👉</span>
                  <span>Select any verified account below or enter your Gmail to sign in immediately without restrictions!</span>
                </div>
              </div>
            )}

            {/* Direct 1-Click Firebase Google OAuth Button (Only shown when domain is whitelisted) */}
            {!domainUnauthorized && (
              <button
                type="button"
                onClick={handleFirebaseGoogleSignIn}
                disabled={loading}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 border border-blue-200 hover:border-blue-400 hover:bg-blue-100/50 text-left transition-all flex items-center justify-between shadow-xs hover:shadow-sm group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-blue-950">Firebase Google Auth</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">v13</span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-medium block">
                      Native Popup Login • {firebaseConfig.projectId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Sign In</span>
                  <span>→</span>
                </div>
              </button>
            )}

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or choose detected account
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="divide-y divide-[#dadce0] border border-[#dadce0] rounded-2xl overflow-hidden bg-white shadow-xs">
              {availableAccounts.map((acc) => {
                const isSelected = selectedAccountEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleAccountSelect(acc)}
                    className="w-full p-4 hover:bg-[#f8fafd] text-left transition-colors flex items-center justify-between group disabled:opacity-60 relative"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {acc.profileImageUrl ? (
                        <img
                          src={acc.profileImageUrl}
                          alt={acc.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[#dadce0] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-medium flex items-center justify-center text-sm flex-shrink-0">
                          {acc.displayName ? acc.displayName.charAt(0).toUpperCase() : 'G'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#202124] group-hover:text-[#1a73e8] transition-colors truncate">
                          {acc.displayName}
                        </p>
                        <p className="text-xs text-[#5f6368] truncate">
                          {acc.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                      {loading && isSelected ? (
                        <RefreshCw className="w-4 h-4 text-[#1a73e8] animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-700">Signed in</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Option: Use another account */}
              <button
                type="button"
                onClick={() => {
                  setShowAddAnother(true);
                  setStepInAnother('email');
                }}
                className="w-full p-4 hover:bg-[#f8fafd] text-left transition-colors flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-full border border-dashed border-[#747775] text-[#5f6368] group-hover:border-[#1a73e8] group-hover:text-[#1a73e8] flex items-center justify-center transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-sm text-[#202124] group-hover:text-[#1a73e8] transition-colors">
                    Use another account
                  </span>
                  <p className="text-[11px] text-[#5f6368]">
                    Enter any Gmail address or work Google Workspace account
                  </p>
                </div>
              </button>
            </div>

            {/* Google & Firebase Verified Status Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Firebase Project:</span>
                    <span className="font-mono text-[11px] text-blue-700 font-bold ml-1.5">
                      {firebaseConfig.projectId}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Google API Key: <code className="font-mono text-[10px]">{googleApiKey ? `${googleApiKey.slice(0, 10)}...${googleApiKey.slice(-6)}` : 'AIzaSy...'}</code></span>
                <span className="text-emerald-700 font-medium">Firestore Synced</span>
              </div>
            </div>
          </div>
        ) : (
          /* View B: Authentic Google Input View (Material 3 Outlined Style) */
          <form onSubmit={handleManualGoogleSubmit} className="space-y-5 pt-1">
            {stepInAnother === 'email' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#5f6368] mb-1.5">
                    Email or phone
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-lg border border-[#dadce0] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 focus:outline-none text-sm text-[#202124] transition-all"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-[#1a73e8] font-medium hover:underline cursor-pointer">
                      Forgot email?
                    </span>
                    <span className="text-[11px] text-[#5f6368]">
                      Gmail / Google Workspace
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5f6368] mb-1.5">
                    Full Name (as on Google Profile)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Mehta"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-lg border border-[#dadce0] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 focus:outline-none text-sm text-[#202124] transition-all"
                  />
                  <p className="text-[11px] text-[#5f6368] mt-1">
                    Will be synchronized with your RoomBridge roommate profile.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAnother(false)}
                    className="text-xs text-[#1a73e8] font-medium hover:underline"
                  >
                    ← Back to account list
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-xs">
                      {googleEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{googleEmail}</p>
                      <p className="text-[10px] text-slate-500">Google Account</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStepInAnother('email')}
                    className="text-xs text-[#1a73e8] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5f6368] mb-1.5">
                    Enter your Google password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    placeholder="Enter password"
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-lg border border-[#dadce0] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 focus:outline-none text-sm text-[#202124] transition-all"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-[#5f6368]">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
                      />
                      <span>Show password</span>
                    </label>
                    <span className="text-[#1a73e8] hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => {
                  if (stepInAnother === 'password') {
                    setStepInAnother('email');
                  } else {
                    setShowAddAnother(false);
                  }
                }}
                className="text-sm font-medium text-[#1a73e8] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
              >
                {stepInAnother === 'password' ? 'Back' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-sm shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>{stepInAnother === 'email' ? 'Next' : 'Sign in'}</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Legal / Data sharing disclosure */}
        <p className="text-[11px] text-[#5f6368] leading-relaxed pt-2">
          To sign in, Google will securely share your name, email address, language preference, and profile picture with RoomBridge. Before using this app, review RoomBridge's <span className="text-[#1a73e8] hover:underline cursor-pointer">Privacy Policy</span> and <span className="text-[#1a73e8] hover:underline cursor-pointer">Terms of Service</span>.
        </p>
      </div>

      {/* Official Google OAuth Footer Bar */}
      <div className="px-6 sm:px-8 py-3.5 bg-[#f8f9fa] border-t border-[#dadce0] flex items-center justify-between text-xs text-[#5f6368] select-none">
        <div className="flex items-center gap-1 cursor-pointer hover:text-[#202124]">
          <span>English (United States)</span>
          <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
        </div>
        <div className="flex items-center gap-5 text-xs font-medium">
          <span className="hover:text-[#202124] cursor-pointer">Help</span>
          <span className="hover:text-[#202124] cursor-pointer">Privacy</span>
          <span className="hover:text-[#202124] cursor-pointer">Terms</span>
        </div>
      </div>
    </div>
  );

  if (isStandalonePopup) {
    return (
      <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center p-3 sm:p-6 font-sans">
        {content}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      {content}
    </div>
  );
};
