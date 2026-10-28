import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Sparkles, ClipboardList, LayoutDashboard, ShieldCheck, Heart, Menu, X } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  savedCount: number;
  selectedIntent?: 'room' | 'roommate' | 'combined';
  onOpenOnboarding?: () => void;
  onOpenGoogleLogin?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser, 
  savedCount, 
  selectedIntent,
  onOpenOnboarding, 
  onOpenGoogleLogin, 
  onLogout 
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const activeGoal = selectedIntent || currentUser?.selectedIntent || (typeof window !== 'undefined' ? (localStorage.getItem('roombridge_intent') as any) : undefined);

  const navLinks = [
    { to: '/rooms', label: 'Explore Rooms', icon: Home },
    { to: '/roommates', label: 'Find Roommates', icon: Users },
    { to: '/questionnaire', label: 'AR²M Compatibility Engine', icon: Sparkles, highlight: true },
    { to: '/dashboard', label: 'Saved & Matches', icon: LayoutDashboard }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & 40% Milestone Indicator */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-sm group-hover:bg-slate-800 transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Room<span className="text-teal-600">Bridge</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Room &amp; Roommate Recommendation Platform
              </p>
            </div>
          </Link>

          {/* 40% Evaluation Checkpoint Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-semibold" title="Phase 1: Goal Selection -> Google Auth -> Multi-Attribute Preference Calibration -> AR²M Score Generation">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>40% System Milestone • AR²M Model Engine</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  link.highlight
                    ? isActive 
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100/80 border border-teal-200/60'
                    : isActive
                    ? 'bg-slate-100 text-slate-900 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${link.highlight && !isActive ? 'text-teal-600' : ''}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right User Bar */}
        <div className="hidden sm:flex items-center gap-3">
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 transition-colors flex items-center gap-1.5"
              title="Change matching purpose or retake questionnaire"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {activeGoal === 'room'
                  ? 'Goal: Find Room'
                  : activeGoal === 'roommate'
                  ? 'Goal: Find Roommate'
                  : activeGoal === 'combined'
                  ? 'Goal: Room + Mate'
                  : 'Start Questionnaire'}
              </span>
            </button>
          )}

          <Link
            to="/dashboard"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Saved Items"
          >
            <Heart className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-1">
              <div className="relative">
                {currentUser.profileImageUrl ? (
                  <img
                    src={currentUser.profileImageUrl}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {/* Google Multi-Color Indicator Badge */}
                {(currentUser.email?.includes('@gmail.com') || currentUser.profileImageUrl) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center" title="Google Authenticated Account">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.displayName}
                  </p>
                  {currentUser.email?.includes('@gmail.com') && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title="Google Gmail Verified">
                      Google
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium capitalize">
                  {currentUser.role}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-2 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sign out and choose housing goal"
                >
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenGoogleLogin || onOpenOnboarding}
                className="h-9 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all flex items-center gap-2 group cursor-pointer hover:border-slate-400"
                style={{ fontFamily: "'Roboto', 'Plus Jakarta Sans', sans-serif" }}
                title="Sign in securely using Google or Gmail"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {!currentUser && (
            <div className="pb-2 border-b border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenGoogleLogin) onOpenGoogleLogin();
                  else if (onOpenOnboarding) onOpenOnboarding();
                }}
                className="flex-1 py-2 rounded-xl border border-[#dadce0] bg-white text-[#3c4043] font-medium text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <link.icon className="w-4 h-4 text-slate-500" />
              {link.label}
            </Link>
          ))}

          {currentUser && onLogout && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Sign Out ({currentUser.displayName})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

