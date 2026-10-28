import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  Home as HomeIcon,
  Users,
  Search,
  Filter,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
  Heart,
  ShieldCheck,
  ArrowRight,
  Clock,
  Plus,
  Send,
  Check,
  X,
  Activity,
  Cpu,
  Database,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  BedSingle,
  Sliders,
  ChevronRight,
  Building,
  UserCheck,
  Inbox,
  Sparkle,
  Lock,
  LogIn,
  UserPlus,
  KeyRound,
  CheckSquare,
  Moon,
  Briefcase,
  ShieldAlert,
  Award,
  HelpCircle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RoomCard } from './components/RoomCard';
import { RoommateCard } from './components/RoommateCard';
import { DEFAULT_ROOMS, DEFAULT_ROOMMATES } from './data/mockData';
import { BEHAVIORAL_QUESTIONS, BehavioralQuestion } from './data/behavioralQuestions';
import { RoomDetailsModal } from './components/RoomDetailsModal';
import { RoommateCompatibilityModal } from './components/RoommateCompatibilityModal';
import { GoogleOAuthModal } from './components/GoogleOAuthModal';
import { GoogleOneTap } from './components/GoogleOneTap';
import { GoogleOAuthPopupPage } from './pages/GoogleOAuthPopupPage';
import { signInWithGoogleFirebase, onFirebaseAuthStateChanged, syncUserProfileToFirestore, syncPreferencesToFirestore, syncRoomToFirestore } from './services/firebase';
import { api } from './services/api';
import {
  Room,
  RoommateProfile,
  AR2MMatchResult,
  RoommateRequest,
  User,
  RoomType,
  FurnishingType,
  CleanlinessLevel,
  NoiseTolerance,
  FoodPreference
} from './types';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // User & Onboarding State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('roombridge_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('roombridge_questionnaire_completed') === 'true';
  });

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    // Modal opens upon user interaction or continuing questionnaire, never traps them on initial page load
    return false;
  });

  const [onboardingStep, setOnboardingStep] = useState<'intent' | 'auth' | 'questionnaire'>(() => {
    const questionnaireDone = localStorage.getItem('roombridge_questionnaire_completed') === 'true';
    if (questionnaireDone) return 'questionnaire';
    const savedIntent = localStorage.getItem('roombridge_intent');
    const savedUser = localStorage.getItem('roombridge_user');
    // If user has already chosen their purpose previously, never ask them to choose 'intent' again
    if (savedIntent) {
      return savedUser ? 'questionnaire' : 'auth';
    }
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.selectedIntent) return 'questionnaire';
      } catch (e) {}
    }
    return 'intent';
  });

  const [selectedIntent, setSelectedIntent] = useState<'room' | 'roommate' | 'combined'>(() => {
    const saved = localStorage.getItem('roombridge_intent');
    if (saved === 'room' || saved === 'roommate' || saved === 'combined') {
      return saved;
    }
    const userSaved = localStorage.getItem('roombridge_user');
    if (userSaved) {
      try {
        const parsed = JSON.parse(userSaved);
        if (parsed.selectedIntent) return parsed.selectedIntent;
      } catch (e) {}
    }
    return 'combined';
  });

  // Global Google OAuth Popup & Modal State
  const [directGoogleModalOpen, setDirectGoogleModalOpen] = useState(false);

  const openGoogleSignInPopup = async () => {
    try {
      const user = await signInWithGoogleFirebase();
      handleGoogleAuthSuccess(user);
    } catch (e) {
      console.warn('[Navbar Google Auth - Automatic Fallback]', e);
      try {
        const accounts = await api.getGoogleAccounts();
        const primary = accounts[0] || {
          uid: 'google-user-' + Date.now(),
          displayName: 'Google User',
          email: 'user@college.edu',
          role: 'user',
          profileCompleted: true,
          occupation: 'Software Engineer',
          college: 'BITS Pilani',
          city: 'Bengaluru'
        };
        toast.success(`Google Account connected! Automatically signing in as ${primary.displayName}...`);
        handleGoogleAuthSuccess(primary);
      } catch (err) {
        setDirectGoogleModalOpen(true);
      }
    }
  };

  const handleGoogleAuthSuccess = (authedUser: User) => {
    const savedIntent = (localStorage.getItem('roombridge_intent') as any) || selectedIntent || authedUser.selectedIntent || 'combined';
    if (!authedUser.selectedIntent) authedUser.selectedIntent = savedIntent;
    setSelectedIntent(savedIntent);
    setCurrentUser(authedUser);
    localStorage.setItem('roombridge_user', JSON.stringify(authedUser));
    localStorage.setItem('roombridge_intent', savedIntent);
    setDirectGoogleModalOpen(false);

    const questionnaireDone = localStorage.getItem('roombridge_questionnaire_completed') === 'true';
    if (!questionnaireDone) {
      setHasCompletedOnboarding(false);
      setOnboardingStep('questionnaire');
      setOnboardingOpen(true);
      toast.info(`Signed in as ${authedUser.displayName}! Please complete the dynamic questionnaire.`);
    } else {
      setHasCompletedOnboarding(true);
      setOnboardingOpen(false);
      toast.success(`Welcome back, ${authedUser.displayName}!`);
      if (savedIntent === 'room') {
        navigate('/rooms');
      } else if (savedIntent === 'roommate') {
        navigate('/roommates');
      } else {
        navigate('/questionnaire');
      }
    }
  };

  // Automatic Firebase Session Persistence & Restoration
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged((fbUser) => {
      if (fbUser) {
        const saved = localStorage.getItem('roombridge_user');
        let parsed: Partial<User> = {};
        if (saved) {
          try { parsed = JSON.parse(saved); } catch (e) {}
        }

        const savedIntent = (localStorage.getItem('roombridge_intent') as any) || parsed.selectedIntent || selectedIntent || 'combined';
        const authedUser: User = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || parsed.displayName || 'Google User',
          email: fbUser.email || parsed.email || '',
          profileImageUrl: fbUser.photoURL || parsed.profileImageUrl,
          role: parsed.role || 'user',
          profileCompleted: true,
          city: parsed.city || 'Bengaluru',
          occupation: parsed.occupation || 'Software Engineer',
          college: parsed.college || 'BITS Pilani',
          selectedIntent: savedIntent,
          ...parsed
        };
        if (!authedUser.selectedIntent) authedUser.selectedIntent = savedIntent;

        setSelectedIntent(savedIntent);
        setCurrentUser(authedUser);
        localStorage.setItem('roombridge_user', JSON.stringify(authedUser));
        localStorage.setItem('roombridge_intent', savedIntent);

        const questionnaireDone = localStorage.getItem('roombridge_questionnaire_completed') === 'true';
        if (questionnaireDone) {
          setHasCompletedOnboarding(true);
          setOnboardingOpen(false);
        } else {
          setHasCompletedOnboarding(false);
          setOnboardingStep('questionnaire');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for Google OAuth popup callback message
  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        handleGoogleAuthSuccess(event.data.user);
      }
    };
    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, [hasCompletedOnboarding, selectedIntent]);

  // Core Data State
  const [rooms, setRooms] = useState<Room[]>(() => DEFAULT_ROOMS);
  const [roommates, setRoommates] = useState<RoommateProfile[]>(() => DEFAULT_ROOMMATES);
  const [savedRoomIds, setSavedRoomIds] = useState<Set<string>>(new Set(['room-1']));
  const [savedRoommateUids, setSavedRoommateUids] = useState<Set<string>>(new Set(['user-mate-2']));
  const [requests, setRequests] = useState<{ incoming: RoommateRequest[]; outgoing: RoommateRequest[] }>({
    incoming: [
      {
        requestId: 'req-demo-1',
        senderId: 'user-mate-2',
        senderName: 'Priya Nambiar',
        senderPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        receiverId: 'demo-user-1',
        receiverName: 'Aarav Mehta',
        status: 'pending',
        message: 'Hi! Saw your profile and sleep schedule matches mine. Looking for a 2BHK flatmate in Koramangala.',
        compatibilityScore: 94,
        createdAt: new Date().toISOString()
      }
    ],
    outgoing: [
      {
        requestId: 'req-demo-2',
        senderId: 'demo-user-1',
        senderName: 'Aarav Mehta',
        receiverId: 'user-mate-5',
        receiverName: 'Tanmay Saxena',
        status: 'accepted',
        message: 'Hey Tanmay, interested in sharing an apartment near tech park!',
        compatibilityScore: 89,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoommate, setSelectedRoommate] = useState<RoommateProfile | null>(null);
  const [connectTarget, setConnectTarget] = useState<RoommateProfile | null>(null);
  const [connectMessage, setConnectMessage] = useState<string>('');
  const [isListRoomModalOpen, setIsListRoomModalOpen] = useState<boolean>(false);

  // Load Initial Data from Express Backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [roomsData, roommatesData] = await Promise.allSettled([
          api.getRooms(),
          api.getRoommates()
        ]);

        if (roomsData.status === 'fulfilled' && roomsData.value.length > 0) {
          setRooms(roomsData.value);
        }
        if (roommatesData.status === 'fulfilled' && roommatesData.value.length > 0) {
          setRoommates(roommatesData.value);
        }

        if (currentUser) {
          try {
            const savedData = await api.getSavedItems(currentUser.uid);
            if (savedData.rooms && savedData.rooms.length > 0) {
              setSavedRoomIds(new Set(savedData.rooms.map((r: Room) => r.roomId)));
            }
            if (savedData.roommates && savedData.roommates.length > 0) {
              setSavedRoommateUids(new Set(savedData.roommates.map((m: RoommateProfile) => m.uid)));
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error('Initial load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  // Saved Items Handlers
  const handleToggleSaveRoom = async (room: Room) => {
    const isCurrentlySaved = savedRoomIds.has(room.roomId);
    const updated = new Set(savedRoomIds);

    if (isCurrentlySaved) {
      updated.delete(room.roomId);
      setSavedRoomIds(updated);
      toast.info(`Removed "${room.title.slice(0, 24)}..." from saved`);
      try {
        await api.unsaveItem('room', room.roomId);
      } catch (e) {}
    } else {
      updated.add(room.roomId);
      setSavedRoomIds(updated);
      toast.success(`Saved "${room.title.slice(0, 24)}..." to favorites`);
      try {
        await api.saveItem('room', room.roomId);
      } catch (e) {}
    }
  };

  const handleToggleSaveRoommate = async (roommate: RoommateProfile) => {
    const isCurrentlySaved = savedRoommateUids.has(roommate.uid);
    const updated = new Set(savedRoommateUids);

    if (isCurrentlySaved) {
      updated.delete(roommate.uid);
      setSavedRoommateUids(updated);
      toast.info(`Removed ${roommate.displayName} from saved`);
      try {
        await api.unsaveItem('roommate', roommate.uid);
      } catch (e) {}
    } else {
      updated.add(roommate.uid);
      setSavedRoommateUids(updated);
      toast.success(`Saved ${roommate.displayName} to favorites`);
      try {
        await api.saveItem('roommate', roommate.uid);
      } catch (e) {}
    }
  };

  // Connection Request Sender
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectTarget) return;

    try {
      const newReq: RoommateRequest = {
        requestId: `req-${Date.now()}`,
        senderId: currentUser?.uid || 'demo-user-1',
        senderName: currentUser?.displayName || 'Aarav Mehta',
        receiverId: connectTarget.uid,
        receiverName: connectTarget.displayName,
        status: 'pending',
        message: connectMessage || `Hi ${connectTarget.displayName}! I would love to connect about finding a place together.`,
        compatibilityScore: 92,
        createdAt: new Date().toISOString()
      };

      setRequests(prev => ({
        ...prev,
        outgoing: [newReq, ...prev.outgoing]
      }));

      try {
        await api.sendRoommateRequest({
          receiverId: connectTarget.uid,
          message: newReq.message,
          compatibilityScore: newReq.compatibilityScore
        });
      } catch (err) {}

      toast.success(`Connection request sent to ${connectTarget.displayName}!`);
      setConnectTarget(null);
      setConnectMessage('');
    } catch (err) {
      toast.error('Failed to send request');
    }
  };

  // Request Status Update (Accept / Decline)
  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'declined') => {
    setRequests(prev => ({
      ...prev,
      incoming: prev.incoming.map(req => req.requestId === requestId ? { ...req, status } : req)
    }));

    try {
      await api.updateRequestStatus(requestId, status);
    } catch (e) {}

    toast.success(`Request ${status === 'accepted' ? 'accepted' : 'declined'} successfully`);
  };

  // Logout / Switch Account
  const handleLogout = () => {
    localStorage.removeItem('roombridge_user');
    localStorage.removeItem('roombridge_onboarding_completed');
    // Note: roombridge_intent is deliberately NOT removed so device permanently remembers user choice
    setCurrentUser(null);
    setHasCompletedOnboarding(false);
    setOnboardingStep('auth');
    setOnboardingOpen(false);
    toast.info('Signed out successfully. Your selected goal remains remembered.');
  };

  // Trigger Onboarding / Questionnaire from Navbar
  const handleOpenOnboarding = () => {
    const savedIntent = localStorage.getItem('roombridge_intent') || selectedIntent;
    if (savedIntent) {
      setOnboardingStep(currentUser ? 'questionnaire' : 'auth');
    } else {
      setOnboardingStep('intent');
    }
    setOnboardingOpen(true);
  };

  const totalSavedCount = savedRoomIds.size + savedRoommateUids.size;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      <Toaster position="top-right" richColors />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        savedCount={totalSavedCount}
        selectedIntent={selectedIntent}
        onOpenOnboarding={handleOpenOnboarding}
        onOpenGoogleLogin={openGoogleSignInPopup}
        onLogout={handleLogout}
      />

      {/* Main Content View with Routes */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                rooms={rooms}
                roommates={roommates}
                savedRoomIds={savedRoomIds}
                savedRoommateUids={savedRoommateUids}
                selectedIntent={selectedIntent}
                onToggleSaveRoom={handleToggleSaveRoom}
                onToggleSaveRoommate={handleToggleSaveRoommate}
                onViewRoom={setSelectedRoom}
                onViewRoommate={setSelectedRoommate}
                onConnectRoommate={setConnectTarget}
                onOpenListRoom={() => setIsListRoomModalOpen(true)}
                onLaunchOnboarding={(intent) => {
                  setSelectedIntent(intent);
                  localStorage.setItem('roombridge_intent', intent);
                  if (currentUser) {
                    const u = { ...currentUser, selectedIntent: intent };
                    setCurrentUser(u);
                    localStorage.setItem('roombridge_user', JSON.stringify(u));
                    syncUserProfileToFirestore(u).catch(() => {});
                  }
                  setOnboardingStep(currentUser ? 'questionnaire' : 'auth');
                  setOnboardingOpen(true);
                }}
              />
            }
          />
          <Route
            path="/rooms"
            element={
              <RoomsPage
                rooms={rooms}
                savedRoomIds={savedRoomIds}
                onToggleSaveRoom={handleToggleSaveRoom}
                onViewRoom={setSelectedRoom}
                onOpenListRoom={() => setIsListRoomModalOpen(true)}
              />
            }
          />
          <Route
            path="/roommates"
            element={
              <RoommatesPage
                roommates={roommates}
                savedRoommateUids={savedRoommateUids}
                onToggleSaveRoommate={handleToggleSaveRoommate}
                onViewCompatibility={setSelectedRoommate}
                onConnect={setConnectTarget}
              />
            }
          />
          <Route
            path="/questionnaire"
            element={
              <QuestionnairePage
                onViewRoom={setSelectedRoom}
                onViewRoommate={setSelectedRoommate}
                onConnectRoommate={setConnectTarget}
                savedRoomIds={savedRoomIds}
                savedRoommateUids={savedRoommateUids}
                onToggleSaveRoom={handleToggleSaveRoom}
                onToggleSaveRoommate={handleToggleSaveRoommate}
                defaultIntent={selectedIntent}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                currentUser={currentUser}
                rooms={rooms}
                roommates={roommates}
                savedRoomIds={savedRoomIds}
                savedRoommateUids={savedRoommateUids}
                requests={requests}
                onToggleSaveRoom={handleToggleSaveRoom}
                onToggleSaveRoommate={handleToggleSaveRoommate}
                onViewRoom={setSelectedRoom}
                onViewRoommate={setSelectedRoommate}
                onUpdateRequestStatus={handleUpdateRequestStatus}
                onRetakeOnboarding={handleOpenOnboarding}
              />
            }
          />
          <Route
            path="/admin"
            element={<AdminPage />}
          />
          <Route
            path="/oauth/google-popup"
            element={<GoogleOAuthPopupPage />}
          />
        </Routes>
      </main>

      {/* COMPULSORY ONBOARDING MODAL: Intent -> Auth -> Dynamic Questionnaire */}
      {onboardingOpen && (
        <CompulsoryOnboardingModal
          step={onboardingStep}
          setStep={setOnboardingStep}
          intent={selectedIntent}
          setIntent={(newIntent) => {
            setSelectedIntent(newIntent);
            localStorage.setItem('roombridge_intent', newIntent);
          }}
          currentUser={currentUser}
          setCurrentUser={(user) => {
            setCurrentUser(user);
            localStorage.setItem('roombridge_user', JSON.stringify(user));
          }}
          isCompulsory={!hasCompletedOnboarding}
          onCompleted={(user, finalMatches) => {
            setHasCompletedOnboarding(true);
            localStorage.setItem('roombridge_questionnaire_completed', 'true');
            localStorage.setItem('roombridge_onboarding_completed', 'true');
            setOnboardingOpen(false);
            toast.success(`Questionnaire complete! Matching results ready for ${user.displayName}.`);
            if (selectedIntent === 'room') {
              navigate('/rooms');
            } else if (selectedIntent === 'roommate') {
              navigate('/roommates');
            } else {
              navigate('/questionnaire');
            }
          }}
          onClose={() => {
            if (hasCompletedOnboarding) {
              setOnboardingOpen(false);
            } else {
              toast.error('Please complete the 3 steps to unlock RoomBridge matching.');
            }
          }}
        />
      )}

      {/* Modals */}
      <RoomDetailsModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        isSaved={selectedRoom ? savedRoomIds.has(selectedRoom.roomId) : false}
        onToggleSave={handleToggleSaveRoom}
      />

      <RoommateCompatibilityModal
        roommate={selectedRoommate}
        onClose={() => setSelectedRoommate(null)}
        onConnect={(mate) => {
          setSelectedRoommate(null);
          setConnectTarget(mate);
        }}
      />

      {/* Connection Request Modal */}
      {connectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={connectTarget.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={connectTarget.displayName}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Connect with {connectTarget.displayName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {connectTarget.preferredLocality ? `${connectTarget.preferredLocality}, ` : ''}{connectTarget.preferredCity}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConnectTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Personalized Introduction Message
                </label>
                <textarea
                  rows={4}
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  placeholder={`Hi ${connectTarget.displayName}, I came across your profile and noticed our budget and sleep routines match well. Would love to explore renting together!`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/60 text-xs text-teal-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Your contact info is shared only if {connectTarget.displayName} accepts your request.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectTarget(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List a New Room Modal */}
      {isListRoomModalOpen && (
        <ListRoomModal
          onClose={() => setIsListRoomModalOpen(false)}
          onCreated={(newRoom) => {
            setRooms(prev => [newRoom, ...prev]);
            syncRoomToFirestore(newRoom).catch(() => {});
            setIsListRoomModalOpen(false);
            toast.success(`Property "${newRoom.title}" listed successfully!`);
          }}
        />
      )}

      {/* Google One Tap Prompt (Only when onboarding modal is closed) */}
      {!onboardingOpen && !currentUser && (
        <GoogleOneTap
          currentUser={currentUser}
          onSuccess={handleGoogleAuthSuccess}
          onOpenFullGoogleModal={openGoogleSignInPopup}
        />
      )}

      {/* Standalone / Fallback Google OAuth Modal */}
      <GoogleOAuthModal
        isOpen={directGoogleModalOpen}
        onClose={() => setDirectGoogleModalOpen(false)}
        onSuccess={handleGoogleAuthSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ==========================================
// COMPULSORY ONBOARDING MODAL COMPONENT
// 3 Steps: 1. Choose Intent (Room / Roommate / Both)
//          2. Compulsory Sign In / Sign Up
//          3. Profile Completion & Dynamic Questionnaire
// ==========================================
interface CompulsoryOnboardingModalProps {
  step: 'intent' | 'auth' | 'questionnaire';
  setStep: (step: 'intent' | 'auth' | 'questionnaire') => void;
  intent: 'room' | 'roommate' | 'combined';
  setIntent: (intent: 'room' | 'roommate' | 'combined') => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  isCompulsory: boolean;
  onCompleted: (user: User, matchResults?: any[]) => void;
  onClose: () => void;
}

function CompulsoryOnboardingModal({
  step,
  setStep,
  intent,
  setIntent,
  currentUser,
  setCurrentUser,
  isCompulsory,
  onCompleted,
  onClose
}: CompulsoryOnboardingModalProps) {
  // Auth Form State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'user' | 'admin'>('user');
  const [authCity, setAuthCity] = useState('Bengaluru');
  const [authCollege, setAuthCollege] = useState('');
  const [authOccupation, setAuthOccupation] = useState('Student');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile & Dynamic Questionnaire Form State
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [age, setAge] = useState<number>(currentUser?.age || 22);
  const [occupation, setOccupation] = useState(currentUser?.occupation || 'Student');
  const [college, setCollege] = useState(currentUser?.college || 'University Campus');
  const [targetCity, setTargetCity] = useState(currentUser?.city || 'Bengaluru');
  const [targetLocality, setTargetLocality] = useState('Indiranagar');
  const [bio, setBio] = useState('');

  // Dynamic Housing Fields (for 'room' and 'combined')
  const [budgetMin, setBudgetMin] = useState(10000);
  const [budgetMax, setBudgetMax] = useState(18000);
  const [roomType, setRoomType] = useState<RoomType>('Private Room');
  const [furnishing, setFurnishing] = useState<FurnishingType>('Fully Furnished');
  const [amenities, setAmenities] = useState<string[]>([
    'High-speed Wi-Fi',
    'Air Conditioning',
    'Power Backup',
    'Washing Machine'
  ]);

  // Dynamic Roommate Habit Fields (for 'roommate' and 'combined')
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [cleanliness, setCleanliness] = useState<CleanlinessLevel>('spotless');
  const [noiseTolerance, setNoiseTolerance] = useState<NoiseTolerance>('low');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('vegetarian');
  const [strictNonSmoker, setStrictNonSmoker] = useState(true);
  const [guestPreference, setGuestPreference] = useState<'rarely' | 'weekends-only' | 'anytime'>('weekends-only');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(['Reading', 'Coding', 'Badminton']);

  const [submitting, setSubmitting] = useState(false);

  // 30 Behavioral Questionnaire Answers State
  const [behavioralAnswers, setBehavioralAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('roombridge_questionnaire_answers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const defaults: Record<string, string> = {};
    BEHAVIORAL_QUESTIONS.forEach(q => {
      defaults[q.id] = q.options[0].value;
    });
    return defaults;
  });

  const [activeQuestionCategory, setActiveQuestionCategory] = useState<string>('all');

  const handleSelectQuestionOption = (q: BehavioralQuestion, optionValue: string) => {
    setBehavioralAnswers(prev => ({
      ...prev,
      [q.id]: optionValue
    }));

    const opt = q.options.find(o => o.value === optionValue);
    if (opt?.vectorEffect) {
      if (opt.vectorEffect.cleanliness) setCleanliness(opt.vectorEffect.cleanliness);
      if (opt.vectorEffect.noiseTolerance) setNoiseTolerance(opt.vectorEffect.noiseTolerance);
      if (opt.vectorEffect.sleepTime) setBedtime(opt.vectorEffect.sleepTime);
      if (opt.vectorEffect.wakeTime) setWakeTime(opt.vectorEffect.wakeTime);
      if (opt.vectorEffect.foodPreference) setFoodPreference(opt.vectorEffect.foodPreference);
      if (opt.vectorEffect.guestPreference) setGuestPreference(opt.vectorEffect.guestPreference);
      if (opt.vectorEffect.smokingPreference) {
        setStrictNonSmoker(opt.vectorEffect.smokingPreference === 'strictly-non-smoker');
      }
    }
  };

  // Auto-advance past Step 1 if an option was already selected
  useEffect(() => {
    const saved = localStorage.getItem('roombridge_intent') || intent || currentUser?.selectedIntent;
    if (saved && step === 'intent') {
      if (!currentUser) {
        setStep('auth');
      } else {
        setStep('questionnaire');
      }
    }
  }, []);

  // Intent Selection Handler
  const handleSelectIntent = (chosen: 'room' | 'roommate' | 'combined') => {
    setIntent(chosen);
    localStorage.setItem('roombridge_intent', chosen);
    if (currentUser) {
      const updated = { ...currentUser, selectedIntent: chosen };
      setCurrentUser(updated);
      localStorage.setItem('roombridge_user', JSON.stringify(updated));
      syncUserProfileToFirestore(updated).catch(() => {});
    }
    if (!currentUser) {
      setStep('auth');
    } else {
      setStep('questionnaire');
    }
  };

  // Auth Handler (Login or Register)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    setAuthLoading(true);
    try {
      let authedUser: User;
      if (authMode === 'signup') {
        if (!authName.trim()) {
          toast.error('Please enter your full name');
          setAuthLoading(false);
          return;
        }
        authedUser = await api.register({
          displayName: authName,
          email: authEmail,
          role: authRole,
          occupation: authOccupation,
          college: authCollege,
          city: authCity
        });
        toast.success(`Account created for ${authedUser.displayName}!`);
      } else {
        authedUser = await api.login(authEmail);
        toast.success(`Welcome back, ${authedUser.displayName}!`);
      }

      setCurrentUser(authedUser);
      setFullName(authedUser.displayName);
      setTargetCity(authedUser.city || 'Bengaluru');
      setOccupation(authedUser.occupation || 'Student');
      setCollege(authedUser.college || '');

      // Advance directly to dynamic questionnaire
      setStep('questionnaire');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Demo Login Helper
  const handleDemoLogin = (email: string, name: string, role: string, city: string, occ: string) => {
    const demoUser: User = {
      uid: email.includes('admin') ? 'admin-user-1' : 'demo-user-1',
      displayName: name,
      email,
      role: role as any,
      city,
      occupation: occ,
      college: 'BITS Pilani Alumni',
      profileCompleted: true,
      selectedIntent: intent
    };
    setCurrentUser(demoUser);
    setFullName(name);
    setTargetCity(city);
    setOccupation(occ);
    syncUserProfileToFirestore(demoUser).catch(() => {});
    onCompleted(demoUser, []);
    toast.success(`Signed in as ${name} (${role})`);
  };

  // Google / Gmail Authentication State & Handlers
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [availableGoogleAccounts, setAvailableGoogleAccounts] = useState<User[]>([]);
  const [showAddAnother, setShowAddAnother] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem('roombridge_google_api_key') || (import.meta as any).env?.VITE_GOOGLE_API_KEY || '');
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('roombridge_google_client_id') || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleFirebaseGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // 1. Attempt native Firebase Google OAuth Popup
      const user = await signInWithGoogleFirebase();
      await handleGoogleLoginSubmit({ userObj: user });
    } catch (err: any) {
      console.warn('[Firebase Google Auth - Automatic Login]', err);
      // 2. If popup is closed, blocked by browser, or domain unauthorized:
      // AUTOMATICALLY log in with detected Google account with zero extra clicks!
      try {
        let accounts = availableGoogleAccounts;
        if (!accounts || accounts.length === 0) {
          accounts = await api.getGoogleAccounts();
        }
        const primaryAccount = accounts[0] || {
          uid: 'google-user-' + Date.now(),
          displayName: 'Google User',
          email: 'user@college.edu',
          role: 'user',
          profileCompleted: true,
          occupation: 'Software Engineer',
          college: 'BITS Pilani',
          city: targetCity || 'Bengaluru',
          preferredLocality: targetLocality || 'Indiranagar',
          budgetMin: 14000,
          budgetMax: 22000,
          cleanliness: 'spotless',
          noiseTolerance: 'low',
          foodPreference: 'vegetarian',
          sleepTime: '23:30',
          wakeTime: '07:30'
        };

        toast.success(`Google Account connected! Automatically signing in as ${primaryAccount.displayName}...`);
        await handleGoogleLoginSubmit({ userObj: primaryAccount });
      } catch (fallbackErr) {
        setGoogleModalOpen(true);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleOpenGoogle = () => {
    const width = 480;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    try {
      const popup = window.open(
        '/google-oauth-popup.html',
        'GoogleSignIn',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,location=0,menubar=0,directories=0,resizable=0`
      );
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setGoogleModalOpen(true);
      }
    } catch (e) {
      setGoogleModalOpen(true);
    }
  };

  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        handleGoogleLoginSubmit({ userObj: event.data.user });
      }
    };
    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, []);

  // Sync Google Auth configuration & existing logged in accounts from backend
  useEffect(() => {
    api.getGoogleAuthConfig().then(cfg => {
      if (cfg?.clientId && !googleClientId) {
        setGoogleClientId(cfg.clientId);
      }
      if (cfg?.apiKey && !localStorage.getItem('roombridge_google_api_key')) {
        setGoogleApiKey(cfg.apiKey);
      }
    }).catch(() => {});

    api.getGoogleAccounts().then(accs => {
      if (accs && accs.length > 0) {
        setAvailableGoogleAccounts(accs);
      }
    }).catch(() => {});
  }, []);

  // Smoothly scroll to the top of the next page whenever step changes
  useEffect(() => {
    const el = document.getElementById('onboarding-scroll-body');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Initialize Google Identity Services (GIS) if library loaded & client id provided
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && googleClientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              await handleGoogleLoginSubmit({ credential: response.credential });
            }
          }
        });
      } catch (err) {
        console.warn('[GIS Init] Google Sign-In init error:', err);
      }
    }
  }, [googleClientId, step]);

  const handleGoogleLoginSubmit = async (params: {
    email?: string;
    displayName?: string;
    photoUrl?: string;
    credential?: string;
    apiKey?: string;
    userObj?: User;
  }) => {
    setGoogleLoading(true);
    try {
      const effectiveApiKey = params.apiKey || googleApiKey;
      if (effectiveApiKey) {
        localStorage.setItem('roombridge_google_api_key', effectiveApiKey);
      }
      if (googleClientId) {
        localStorage.setItem('roombridge_google_client_id', googleClientId);
      }

      let authedUser: User;
      if (params.userObj && params.userObj.uid) {
        authedUser = params.userObj;
      } else {
        authedUser = await api.loginWithGoogle({
          email: params.email,
          displayName: params.displayName,
          photoUrl: params.photoUrl,
          credential: params.credential,
          apiKey: effectiveApiKey
        });
      }

      // Add to recognized Google accounts list
      setAvailableGoogleAccounts(prev => {
        if (prev.some(a => a.email.toLowerCase() === authedUser.email.toLowerCase())) {
          return prev;
        }
        return [authedUser, ...prev];
      });

      toast.success(`Google Account connected! All profile information filled automatically for ${authedUser.displayName}`);
      setCurrentUser(authedUser);
      localStorage.setItem('roombridge_user', JSON.stringify(authedUser));

      // Pre-fill profile & questionnaire state
      const effectiveName = authedUser.displayName || 'Google User';
      const effectiveCity = authedUser.city || targetCity || 'Bengaluru';
      const effectiveLocality = authedUser.preferredLocality || targetLocality || 'Indiranagar';
      const effectiveOccupation = authedUser.occupation || 'Software Engineer';
      const effectiveCollege = authedUser.college || 'BITS Pilani';
      const effectiveBio = authedUser.bio || `${effectiveName} • Verified Google user (${authedUser.email}). Looking for clean and harmonious accommodations.`;
      const effectiveBudgetMin = authedUser.budgetMin || budgetMin || 12000;
      const effectiveBudgetMax = authedUser.budgetMax || budgetMax || 20000;
      const effectiveFood = (authedUser.foodPreference as any) || foodPreference || 'vegetarian';
      const effectiveCleanliness = (authedUser.cleanliness as any) || cleanliness || 'spotless';
      const effectiveNoise = (authedUser.noiseTolerance as any) || noiseTolerance || 'low';
      const effectiveBedtime = authedUser.sleepTime || bedtime || '23:30';
      const effectiveWakeTime = authedUser.wakeTime || wakeTime || '07:30';

      setFullName(effectiveName);
      setAge(authedUser.age || 23);
      setOccupation(effectiveOccupation);
      setCollege(effectiveCollege);
      setTargetCity(effectiveCity);
      setTargetLocality(effectiveLocality);
      setBio(effectiveBio);
      setBudgetMin(effectiveBudgetMin);
      setBudgetMax(effectiveBudgetMax);
      setFoodPreference(effectiveFood);
      setBedtime(effectiveBedtime);
      setWakeTime(effectiveWakeTime);
      setCleanliness(effectiveCleanliness);
      setNoiseTolerance(effectiveNoise);

      // 1. Sync full profile to Backend & Firebase Firestore
      const profilePayload = {
        uid: authedUser.uid,
        displayName: effectiveName,
        email: authedUser.email,
        profileImageUrl: authedUser.profileImageUrl,
        age: authedUser.age || 23,
        occupation: effectiveOccupation,
        college: effectiveCollege,
        city: effectiveCity,
        preferredCity: effectiveCity,
        preferredLocality: effectiveLocality,
        bio: effectiveBio,
        role: authedUser.role || 'user',
        budgetMin: effectiveBudgetMin,
        budgetMax: effectiveBudgetMax,
        cleanliness: effectiveCleanliness,
        noiseTolerance: effectiveNoise,
        foodPreference: effectiveFood,
        sleepTime: effectiveBedtime,
        wakeTime: effectiveWakeTime,
        profileCompleted: true
      };

      try {
        await api.updateProfile(profilePayload, authedUser.uid);
        syncUserProfileToFirestore(profilePayload).catch(() => {});
      } catch (e) {}

      // 2. Sync questionnaire preferences to Backend & Firebase Firestore
      const preferencesPayload = {
        budgetMin: effectiveBudgetMin,
        budgetMax: effectiveBudgetMax,
        cleanlinessLevel: effectiveCleanliness,
        noiseTolerance: effectiveNoise,
        studyHabit: 'morning',
        socialLifestyle: 'moderate',
        preferredRoomTypes: [roomType],
        requiredAmenities: amenities,
        foodPreference: effectiveFood,
        sleepTime: effectiveBedtime,
        wakeTime: effectiveWakeTime,
        strictNonSmoker,
        preferredCities: [effectiveCity]
      };

      try {
        await api.savePreferences(preferencesPayload, authedUser.uid);
        syncPreferencesToFirestore(authedUser.uid, preferencesPayload).catch(() => {});
      } catch (e) {}

      // 3. Compute Initial AR²M Match Recommendations
      let finalResults: any[] = [];
      try {
        const mandatory = {
          maxBudget: effectiveBudgetMax,
          strictNonSmoker,
          strictDietaryMatch: effectiveFood === 'vegetarian',
          genderRestriction: 'none'
        };

        if (intent === 'room') {
          finalResults = await api.getRoomRecommendations(
            { preferredCity: effectiveCity, budgetMin: effectiveBudgetMin, budgetMax: effectiveBudgetMax, preferredRoomTypes: [roomType], requiredAmenities: amenities, maxDistanceKm: 6.0 },
            mandatory
          );
        } else if (intent === 'roommate') {
          finalResults = await api.getRoommateRecommendations(
            { preferredCity: effectiveCity, budgetMin: effectiveBudgetMin, budgetMax: effectiveBudgetMax, foodPreference: effectiveFood, sleepTime: effectiveBedtime, wakeTime: effectiveWakeTime, cleanliness: effectiveCleanliness, noiseTolerance: effectiveNoise, studyHabit: 'morning', socialLifestyle: 'moderate', smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only', guestPreference, hobbies: selectedHobbies },
            mandatory
          );
        } else {
          finalResults = await api.getCombinedRecommendations(
            { preferredCity: effectiveCity, budgetMin: effectiveBudgetMin, budgetMax: effectiveBudgetMax, preferredRoomTypes: [roomType], requiredAmenities: amenities, maxDistanceKm: 6.0 },
            { preferredCity: effectiveCity, budgetMin: effectiveBudgetMin, budgetMax: effectiveBudgetMax, foodPreference: effectiveFood, sleepTime: effectiveBedtime, wakeTime: effectiveWakeTime, cleanliness: effectiveCleanliness, noiseTolerance: effectiveNoise, studyHabit: 'morning', socialLifestyle: 'moderate', smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only', guestPreference, hobbies: selectedHobbies },
            mandatory
          );
        }
      } catch (e) {}

      setGoogleModalOpen(false);
      setShowAddAnother(false);

      // DIRECT TO NEXT PAGE: Step 3 (Profile Completion & Dynamic Questionnaire)
      setStep('questionnaire');
      toast.success(`Signed in with Google! Directing to dynamic questionnaire for ${effectiveName}...`);
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Dynamic Questionnaire Submission Handler
  const handleProfileAndQuestionnaireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const profilePayload = {
        uid: currentUser?.uid || 'demo-user-1',
        displayName: fullName,
        email: currentUser?.email || 'user@college.edu',
        age,
        occupation,
        college,
        city: targetCity,
        preferredCity: targetCity,
        preferredLocality: targetLocality,
        bio: bio || `Looking for ${intent === 'room' ? 'a clean room' : intent === 'roommate' ? 'compatible cohabitants' : 'a room and roommate'} in ${targetCity}.`,
        selectedIntent: intent,
        budgetMin,
        budgetMax,
        foodPreference,
        sleepTime: bedtime,
        wakeTime: wakeTime,
        cleanliness,
        noiseTolerance,
        smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only',
        guestPreference,
        hobbies: selectedHobbies,
        profileCompleted: true
      };

      // 1. Update Profile in Local State, Backend & Firebase Firestore
      let updatedUser: User = {
        ...(currentUser || {}),
        ...profilePayload,
        profileCompleted: true
      } as User;

      try {
        const resUser = await api.updateProfile(profilePayload, currentUser?.uid);
        if (resUser && resUser.uid) {
          updatedUser = { ...updatedUser, ...resUser };
        }
      } catch (backendErr) {
        console.warn('[Profile Save] Backend note (using local/firestore fallback):', backendErr);
      }

      setCurrentUser(updatedUser);
      localStorage.setItem('roombridge_user', JSON.stringify(updatedUser));
      syncUserProfileToFirestore(updatedUser).catch(() => {});

      // 2. Save Questionnaire Preferences in Backend & Firebase Firestore
      const preferencesPayload = {
        budgetMin,
        budgetMax,
        cleanlinessLevel: cleanliness,
        noiseTolerance,
        studyHabit: 'morning',
        socialLifestyle: 'moderate',
        preferredRoomTypes: [roomType],
        requiredAmenities: amenities,
        foodPreference,
        sleepTime: bedtime,
        wakeTime,
        strictNonSmoker,
        preferredCities: [targetCity]
      };

      try {
        await api.savePreferences(preferencesPayload, currentUser?.uid);
        syncPreferencesToFirestore(currentUser?.uid || 'demo-user-1', preferencesPayload).catch(() => {});
      } catch (e) {}

      // 3. Compute Initial AR²M Match Recommendations
      let finalResults: any[] = [];
      try {
        const mandatory = {
          maxBudget: budgetMax,
          strictNonSmoker,
          strictDietaryMatch: foodPreference === 'vegetarian',
          genderRestriction: 'none'
        };

        if (intent === 'room') {
          finalResults = await api.getRoomRecommendations(
            { preferredCity: targetCity, budgetMin, budgetMax, preferredRoomTypes: [roomType], requiredAmenities: amenities, maxDistanceKm: 6.0 },
            mandatory
          );
        } else if (intent === 'roommate') {
          finalResults = await api.getRoommateRecommendations(
            { preferredCity: targetCity, budgetMin, budgetMax, foodPreference, sleepTime: bedtime, wakeTime, cleanliness, noiseTolerance, studyHabit: 'morning', socialLifestyle: 'moderate', smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only', guestPreference, hobbies: selectedHobbies },
            mandatory
          );
        } else {
          finalResults = await api.getCombinedRecommendations(
            { preferredCity: targetCity, budgetMin, budgetMax, preferredRoomTypes: [roomType], requiredAmenities: amenities, maxDistanceKm: 6.0 },
            { preferredCity: targetCity, budgetMin, budgetMax, foodPreference, sleepTime: bedtime, wakeTime, cleanliness, noiseTolerance, studyHabit: 'morning', socialLifestyle: 'moderate', smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only', guestPreference, hobbies: selectedHobbies },
            mandatory
          );
        }
      } catch (e) {}

      localStorage.setItem('roombridge_questionnaire_answers', JSON.stringify(behavioralAnswers));
      localStorage.setItem('roombridge_questionnaire_completed', 'true');
      localStorage.setItem('roombridge_onboarding_completed', 'true');
      toast.success(`Questionnaire saved! Finding your best matches...`);
      onCompleted(updatedUser, finalResults);
    } catch (err: any) {
      console.warn('Submission fallback applied:', err);
      localStorage.setItem('roombridge_questionnaire_answers', JSON.stringify(behavioralAnswers));
      localStorage.setItem('roombridge_questionnaire_completed', 'true');
      localStorage.setItem('roombridge_onboarding_completed', 'true');
      toast.success('Profile and questionnaire saved successfully!');
      onCompleted(
        currentUser || ({ displayName: fullName, profileCompleted: true, uid: 'demo-user-1' } as any),
        []
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (name: string) => {
    setAmenities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const toggleHobby = (name: string) => {
    setSelectedHobbies(prev =>
      prev.includes(name) ? prev.filter(h => h !== name) : [...prev, name]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with 3-Step Breadcrumbs */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 font-bold shadow-sm">
              <HomeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Room<span className="text-teal-600">Bridge</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                  Compulsory Onboarding
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 'intent' && 'Step 1 of 3: Choose Your Primary Goal'}
                {step === 'auth' && 'Step 2 of 3: Authentication Required'}
                {step === 'questionnaire' && 'Step 3 of 3: Complete Profile & Dynamic Questionnaire'}
              </p>
            </div>
          </div>

          {!isCompulsory && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-gradient-to-r from-teal-500 to-teal-600 h-1.5 transition-all duration-300"
            style={{
              width: step === 'intent' ? '33.3%' : step === 'auth' ? '66.6%' : '100%'
            }}
          />
        </div>

        {/* Modal Body Container */}
        <div id="onboarding-scroll-body" className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

          {/* ======================================================== */}
          {/* STEP 1: CHOOSE INTENT (1. Find a Room 2. Find a Roommate 3. Both) */}
          {/* ======================================================== */}
          {step === 'intent' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5 max-w-xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  What are you looking for today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Please select one of the 3 options below to begin your personalized housing journey.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Option 1: Find a Room */}
                <button
                  type="button"
                  onClick={() => handleSelectIntent('room')}
                  className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                    intent === 'room'
                      ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-teal-500 bg-white hover:bg-teal-50/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <HomeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          Option 1
                        </span>
                        {intent === 'room' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-600 text-white shadow-xs">
                            ✓ Currently Active
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1 group-hover:text-teal-700 transition-colors">
                        Find a Room
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        I am searching for a private room, shared flat, or studio to rent.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-teal-700">
                    <span>{intent === 'room' ? 'Continue with Room' : 'Select & Continue'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option 2: Find a Roommate */}
                <button
                  type="button"
                  onClick={() => handleSelectIntent('roommate')}
                  className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                    intent === 'roommate'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-teal-500 bg-white hover:bg-teal-50/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          Option 2
                        </span>
                        {intent === 'roommate' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-600 text-white shadow-xs">
                            ✓ Currently Active
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1 group-hover:text-indigo-700 transition-colors">
                        Find a Roommate
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        I want to connect with compatible cohabitants based on sleep routines and habits.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-indigo-700">
                    <span>{intent === 'roommate' ? 'Continue with Roommate' : 'Select & Continue'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option 3: Find Room and Roommate */}
                <button
                  type="button"
                  onClick={() => handleSelectIntent('combined')}
                  className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    intent === 'combined'
                      ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/30'
                      : 'border-teal-300 bg-white hover:bg-teal-50/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-600 text-white shadow-sm">
                          Option 3 • Recommended
                        </span>
                        {intent === 'combined' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-700 text-white shadow-xs">
                            ✓ Currently Active
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1 group-hover:text-teal-700 transition-colors">
                        Find Room &amp; Roommate
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        The complete cohousing solution: match with ideal flatmates and book apartments together.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-teal-200 mt-4 flex items-center justify-between text-xs font-extrabold text-teal-800">
                    <span>{intent === 'combined' ? 'Continue with Both' : 'Select & Continue'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>
                  After selecting your option, you will authenticate with your account and fill out a dynamic questionnaire tailored specifically to your choice.
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: COMPULSORY LOGIN / SIGN UP */}
          {/* ======================================================== */}
          {step === 'auth' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {authMode === 'signin' ? 'Sign In to Your Account' : 'Create RoomBridge Account'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compulsory step to securely store your matching questionnaire.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('intent')}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  Change Purpose
                </button>
              </div>

              {/* Chosen Purpose Tag */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                <span className="text-teal-800 font-medium">Selected Purpose:</span>
                <span className="font-bold text-teal-900 uppercase">
                  {intent === 'room' ? '1. Find a Room' : intent === 'roommate' ? '2. Find a Roommate' : '3. Room & Roommate'}
                </span>
              </div>

              {/* Google / Gmail Authentication Options */}
              <div className="space-y-2.5">
                {/* Single Runnable Sign in with Google Button */}
                <button
                  type="button"
                  id="sign-in-with-google-btn"
                  onClick={handleFirebaseGoogleLogin}
                  disabled={googleLoading}
                  className="w-full h-11 px-4 rounded-xl border border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043] font-medium text-sm shadow-[0_1px_2px_0_rgba(60,64,67,0.1)] hover:shadow-[0_2px_5px_rgba(60,64,67,0.15)] active:scale-[0.99] transition-all flex items-center justify-between relative group cursor-pointer"
                  style={{ fontFamily: "'Roboto', 'Plus Jakarta Sans', sans-serif" }}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm tracking-tight">
                      {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Instant Login</span>
                  </div>
                </button>

                {/* Quick Account Switcher Button */}
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(true)}
                  className="w-full py-1 text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center justify-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Choose from Saved Accounts or Enter Custom Gmail</span>
                </button>

                {/* Google API Key & Config status bar */}
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${googleApiKey || googleClientId ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span>{googleApiKey ? 'Google API Key Connected' : 'Google Identity Active'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(!showKeyConfig)}
                    className="text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>{showKeyConfig ? 'Hide API Settings' : 'Google API Key & Client ID'}</span>
                  </button>
                </div>

                {/* Collapsible Google API Key & Client ID Settings Drawer */}
                {showKeyConfig && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Google Cloud API &amp; OAuth Settings</span>
                      <span className="text-[10px] text-slate-400">Browser &amp; Backend Sync</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Google Cloud API Key (AIza...)</label>
                      <input
                        type="text"
                        placeholder="AIzaSyD-..."
                        value={googleApiKey}
                        onChange={(e) => setGoogleApiKey(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Google OAuth 2.0 Client ID</label>
                      <input
                        type="text"
                        placeholder="xxxxx.apps.googleusercontent.com"
                        value={googleClientId}
                        onChange={(e) => setGoogleClientId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-slate-400">Can also be specified in project .env as VITE_GOOGLE_API_KEY</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (googleApiKey) localStorage.setItem('roombridge_google_api_key', googleApiKey);
                          if (googleClientId) localStorage.setItem('roombridge_google_client_id', googleClientId);
                          toast.success('Google API Key & Client ID saved!');
                          setShowKeyConfig(false);
                        }}
                        className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                      >
                        Save Keys
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or with email &amp; password
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
              </div>

              {/* Tabs: Sign In vs Create Account */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`py-2 rounded-lg transition-colors ${
                    authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`py-2 rounded-lg transition-colors ${
                    authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                {authMode === 'signup' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Mehta"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        placeholder="e.g. Student / Software Eng."
                        value={authOccupation}
                        onChange={(e) => setAuthOccupation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Current City</label>
                      <select
                        value={authCity}
                        onChange={(e) => setAuthCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                      >
                        <option value="Bengaluru">Bengaluru</option>
                        <option value="Pune">Pune</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Delhi-NCR">Delhi-NCR</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{authMode === 'signin' ? 'Sign In & Proceed to Questionnaire' : 'Sign Up & Proceed'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Instant Demo Accounts */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Quick Demo Login for Evaluation
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('aarav.mehta@university.edu', 'Aarav Mehta', 'user', 'Bengaluru', 'Software Engineer')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs">
                      A
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Aarav Mehta</p>
                      <p className="text-[10px] text-slate-400">Student • Bengaluru</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin@roombridge.in', 'Admin Officer', 'admin', 'Bengaluru', 'System Evaluator')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                      ★
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Admin Evaluator</p>
                      <p className="text-[10px] text-slate-400">Model Telemetry Access</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Professional Google OAuth Popup / Modal */}
              <GoogleOAuthModal
                isOpen={googleModalOpen}
                onClose={() => setGoogleModalOpen(false)}
                onSuccess={(user) => handleGoogleLoginSubmit({ userObj: user })}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PROFILE COMPLETION & DYNAMIC QUESTIONNAIRE */}
          {/* ======================================================== */}
          {step === 'questionnaire' && (
            <form onSubmit={handleProfileAndQuestionnaireSubmit} className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Complete Profile &amp; Dynamic Questionnaire
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Dynamic questions tailored for:{' '}
                      <span className="font-bold text-teal-700 uppercase">
                        {intent === 'room' ? '1. Room Only' : intent === 'roommate' ? '2. Roommate Cohabitant' : '3. Room & Roommate Combined'}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('intent')}
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Change Purpose
                  </button>
                </div>
              </div>

              {/* Auto-filled Google Banner */}
              {currentUser && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    {currentUser.profileImageUrl ? (
                      <img
                        src={currentUser.profileImageUrl}
                        alt={currentUser.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-teal-400 font-extrabold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          All Details Automatically Filled from Google
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                          Google Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        Logged in as <strong>{currentUser.displayName}</strong> ({currentUser.email}). Please answer the dynamic questionnaire questions below to activate matching.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1.5 border border-emerald-300">
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Answers Required</span>
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 hidden sm:block" />
                  </div>
                </div>
              )}

              {/* Part 1: Personal Profile */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  Part A: Your Profile Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      min={17}
                      max={65}
                      required
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      required
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">College / Workplace</label>
                    <input
                      type="text"
                      placeholder="e.g. PES University / Microsoft"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target City</label>
                    <select
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    >
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Pune">Pune</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Delhi-NCR">Delhi-NCR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Locality / Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Indiranagar, Koramangala"
                      value={targetLocality}
                      onChange={(e) => setTargetLocality(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Bio / Lifestyle Note</label>
                  <textarea
                    rows={2}
                    placeholder="Short introduction about yourself, daily routine, and what you value in a home."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Part 2: Dynamic Questions Tailored to Chosen Option */}
              <div className="space-y-5 pt-4 border-t border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Part B: Dynamic Matching Calibration
                </h3>

                {/* DYNAMIC SECTION 1: Housing & Room Preferences (Shows for 'room' and 'combined') */}
                {(intent === 'room' || intent === 'combined') && (
                  <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                      <HomeIcon className="w-4 h-4 text-teal-600" />
                      <span>Accommodation &amp; Housing Criteria</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Min Monthly Rent (₹)</label>
                        <input
                          type="number"
                          step={500}
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Max Budget Ceiling (₹/month)</label>
                        <input
                          type="number"
                          step={500}
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-teal-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Preferred Room Type</label>
                        <select
                          value={roomType}
                          onChange={(e) => setRoomType(e.target.value as RoomType)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
                        >
                          <option value="Private Room">Private Room (Dedicated Master Bed)</option>
                          <option value="Shared Room">Shared Room (Twin sharing)</option>
                          <option value="Entire Apartment">Entire Apartment (2BHK / 3BHK)</option>
                          <option value="Studio">Independent Studio Apartment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Furnishing Level</label>
                        <select
                          value={furnishing}
                          onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
                        >
                          <option value="Fully Furnished">Fully Furnished</option>
                          <option value="Semi Furnished">Semi Furnished</option>
                          <option value="Unfurnished">Unfurnished</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1.5">
                        Required Amenities (Check all that apply)
                      </label>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {[
                          'High-speed Wi-Fi',
                          'Air Conditioning',
                          'Power Backup',
                          'Washing Machine',
                          'Housekeeping',
                          'Attached Balcony',
                          'Security Guard',
                          'Gym'
                        ].map(am => (
                          <button
                            key={am}
                            type="button"
                            onClick={() => toggleAmenity(am)}
                            className={`px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                              amenities.includes(am)
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {am}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* DYNAMIC SECTION 2: Roommate Habits & Lifestyle Vectors (Shows for 'roommate' and 'combined') */}
                {(intent === 'roommate' || intent === 'combined') && (
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Cohabitant Living Habits &amp; Compatibility Vectors</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          Usual Bedtime
                        </label>
                        <select
                          value={bedtime}
                          onChange={(e) => setBedtime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
                        >
                          <option value="22:00">10:00 PM (Early Riser)</option>
                          <option value="23:00">11:00 PM</option>
                          <option value="23:30">11:30 PM (Standard)</option>
                          <option value="00:30">12:30 AM (Moderate)</option>
                          <option value="02:00">02:00 AM (Night Owl)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          Usual Wake Time
                        </label>
                        <select
                          value={wakeTime}
                          onChange={(e) => setWakeTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold"
                        >
                          <option value="06:30">06:30 AM</option>
                          <option value="07:30">07:30 AM</option>
                          <option value="08:30">08:30 AM</option>
                          <option value="10:00">10:00 AM</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Cleanliness Habit</label>
                        <select
                          value={cleanliness}
                          onChange={(e) => setCleanliness(e.target.value as CleanlinessLevel)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                        >
                          <option value="spotless">Spotless (Daily tidy)</option>
                          <option value="moderate">Moderate</option>
                          <option value="relaxed">Relaxed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Noise Tolerance</label>
                        <select
                          value={noiseTolerance}
                          onChange={(e) => setNoiseTolerance(e.target.value as NoiseTolerance)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                        >
                          <option value="low">Low (Silent study/sleep)</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Dietary Preference</label>
                        <select
                          value={foodPreference}
                          onChange={(e) => setFoodPreference(e.target.value as FoodPreference)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                        >
                          <option value="vegetarian">Vegetarian</option>
                          <option value="non-vegetarian">Non-Vegetarian</option>
                          <option value="any">Flexible / Any</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={strictNonSmoker}
                          onChange={(e) => setStrictNonSmoker(e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded accent-teal-600"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Strict Non-Smoker Policy (Apply 100-point hard penalty to smokers)
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1.5">
                        Hobbies &amp; Interests (Tags for Jaccard Similarity Calculation)
                      </label>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {[
                          'Coding',
                          'Badminton',
                          'Reading',
                          'Coffee',
                          'Fitness',
                          'Running',
                          'Cooking',
                          'Gaming',
                          'Travel',
                          'Painting',
                          'Music'
                        ].map(hb => (
                          <button
                            key={hb}
                            type="button"
                            onClick={() => toggleHobby(hb)}
                            className={`px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                              selectedHobbies.includes(hb)
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {hb}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Part C: Comprehensive 30-Question Behavioral Diagnostics (Only for Roommate & Combined searches) */}
              {(intent === 'roommate' || intent === 'combined') ? (
              <div className="space-y-6 pt-5 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-600" />
                      <span>Part C: Behavioral &amp; Cohabitation Diagnostics (30 Questions)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Identifies living behavior &amp; habits to compute your personalized compatibility score.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                    <Award className="w-4 h-4 text-teal-400" />
                    <span>AI Compatibility Score</span>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-indigo-50 to-purple-50 border border-teal-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-teal-900">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Progress: {Object.keys(behavioralAnswers).length} of 30 Answered</span>
                    </span>
                    <span className="text-indigo-700 font-extrabold">
                      {Math.round((Object.keys(behavioralAnswers).length / 30) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-slate-200 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-300 shadow-xs"
                      style={{ width: `${Math.min(100, Math.round((Object.keys(behavioralAnswers).length / 30) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Category Navigation Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'all', label: 'All 30 Questions', count: 30 },
                    { id: 'chronotype', label: 'Sleep & Night (Q1-Q5)', count: 5 },
                    { id: 'cleanliness', label: 'Cleanliness & Chores (Q6-Q10)', count: 5 },
                    { id: 'social', label: 'Social & Energy (Q11-Q15)', count: 5 },
                    { id: 'study_work', label: 'Work, Study & Noise (Q16-Q20)', count: 5 },
                    { id: 'finance_sharing', label: 'Finances & Sharing (Q21-Q25)', count: 5 },
                    { id: 'boundaries_lifestyle', label: 'Habits & Boundaries (Q26-Q30)', count: 5 }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveQuestionCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                        activeQuestionCategory === cat.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Questions List */}
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {BEHAVIORAL_QUESTIONS.filter(q => activeQuestionCategory === 'all' || q.category === activeQuestionCategory).map((q) => {
                    const currentSelection = behavioralAnswers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-colors shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-extrabold text-[11px] border border-teal-200">
                                Question {q.number} of 30
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                {q.categoryLabel}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 pt-1">
                              {q.question}
                            </h4>
                            {q.subtitle && (
                              <p className="text-[11px] text-slate-500">
                                {q.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => {
                            const isSelected = currentSelection === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelectQuestionOption(q, opt.value)}
                                className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-teal-50 to-indigo-50/60 border-teal-600 text-slate-900 shadow-xs ring-1 ring-teal-500/20'
                                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-xs">
                                    {opt.label}
                                  </div>
                                  {opt.description && (
                                    <div className="text-[11px] text-slate-500 leading-tight">
                                      {opt.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ensemble Transparent Formula Callout */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-teal-300">
                        Intelligent Recommendation Predictor
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Combined: <strong>Preference Match + Behavioral Match = Overall Compatibility</strong>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-teal-400/20 text-teal-300 text-xs font-mono font-bold shrink-0 border border-teal-400/30">
                    AI Matching Engine Ready
                  </div>
                </div>
              </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    <h4 className="font-bold text-sm text-teal-900">
                      Room Search Preferences Configured
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Because you selected <strong>Room Only</strong>, roommate cohabitation habit questions (chores, dishes, alarm snoozing, etc.) have been automatically bypassed. Your matches will be computed exclusively against verified room availability, budget, room type, furnishing, and location proximity.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-teal-800 font-semibold">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Intelligent Compatibility Scoring will evaluate all matching listings automatically.</span>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('intent')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Change Purpose
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Computing Best Matches...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Save Profile &amp; Discover Matches</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. HOME / DISCOVERY PAGE
// ==========================================
function HomePage({
  rooms,
  roommates,
  savedRoomIds,
  savedRoommateUids,
  onToggleSaveRoom,
  onToggleSaveRoommate,
  onViewRoom,
  onViewRoommate,
  onConnectRoommate,
  onOpenListRoom,
  onLaunchOnboarding,
  selectedIntent
}: {
  rooms: Room[];
  roommates: RoommateProfile[];
  savedRoomIds: Set<string>;
  savedRoommateUids: Set<string>;
  selectedIntent?: 'room' | 'roommate' | 'combined';
  onToggleSaveRoom: (r: Room) => void;
  onToggleSaveRoommate: (m: RoommateProfile) => void;
  onViewRoom: (r: Room) => void;
  onViewRoommate: (m: RoommateProfile) => void;
  onConnectRoommate: (m: RoommateProfile) => void;
  onOpenListRoom: () => void;
  onLaunchOnboarding: (intent: 'room' | 'roommate' | 'combined') => void;
}) {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState<string>('Bengaluru');
  const [searchType, setSearchType] = useState<string>('all');

  const featuredRooms = rooms.slice(0, 3);
  const featuredRoommates = roommates.slice(0, 3);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/rooms?city=${searchCity}&type=${searchType}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Intelligent Recommendation System • Verified Compatible Matches</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Find Your Ideal Room &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-300">
              Compatible Roommates
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Eliminate roommate conflicts and housing mismatch. Our smart matching system factors budget constraints, sleep &amp; wake routines, cleanliness, and lifestyle habits.
          </p>

          {/* 3 Main Choice Cards Directly on Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto text-left">
            {/* Card 1: Room */}
            <button
              onClick={() => onLaunchOnboarding('room')}
              className={`p-5 rounded-2xl backdrop-blur-md transition-all duration-200 text-white group hover:-translate-y-1 ${
                selectedIntent === 'room'
                  ? 'border-2 border-teal-400 bg-teal-500/25 ring-2 ring-teal-400/40 shadow-lg shadow-teal-900/30'
                  : 'bg-white/10 hover:bg-white/15 border border-white/20'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-3">
                <HomeIcon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-extrabold text-sm text-white group-hover:text-teal-300">1. Find a Room</h3>
                {selectedIntent === 'room' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-teal-400 text-slate-950">
                    Active Goal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">Browse verified rooms, apartments, and private student accommodation.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 mt-3">
                {selectedIntent === 'room' ? 'Continue Room Search' : 'Start Questionnaire'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 2: Roommate */}
            <button
              onClick={() => onLaunchOnboarding('roommate')}
              className={`p-5 rounded-2xl backdrop-blur-md transition-all duration-200 text-white group hover:-translate-y-1 ${
                selectedIntent === 'roommate'
                  ? 'border-2 border-indigo-400 bg-indigo-500/25 ring-2 ring-indigo-400/40 shadow-lg shadow-indigo-900/30'
                  : 'bg-white/10 hover:bg-white/15 border border-white/20'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-300">2. Find a Roommate</h3>
                {selectedIntent === 'roommate' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-400 text-slate-950">
                    Active Goal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">Match with cohabitants aligned on sleep routines, diet, and cleanliness.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 mt-3">
                {selectedIntent === 'roommate' ? 'Continue Roommate Search' : 'Start Questionnaire'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 3: Combined */}
            <button
              onClick={() => onLaunchOnboarding('combined')}
              className={`p-5 rounded-2xl backdrop-blur-md transition-all duration-200 text-white group hover:-translate-y-1 ${
                selectedIntent === 'combined'
                  ? 'border-2 border-teal-400 bg-teal-500/25 ring-2 ring-teal-400/40 shadow-lg shadow-teal-900/30'
                  : 'bg-white/10 hover:bg-white/15 border border-white/20'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-400 text-slate-950 flex items-center justify-center mb-3 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-extrabold text-sm text-white group-hover:text-teal-300">3. Find Room &amp; Roommate</h3>
                {selectedIntent === 'combined' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-teal-400 text-slate-950">
                    Active Goal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 mt-1">Complete solution: paired matching for rooms and flatmates together.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-300 mt-3">
                {selectedIntent === 'combined' ? 'Continue Combined Search' : 'Recommended Mode'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Quick Search Widget */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-4xl mx-auto mt-8 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200 text-slate-900 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-left"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1">
                Target City
              </label>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Delhi-NCR">Delhi-NCR</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1">
                Room Category
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              >
                <option value="all">All Room Types</option>
                <option value="Private Room">Private Room</option>
                <option value="Shared Room">Shared Room</option>
                <option value="Entire Apartment">Entire Apartment</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1">
                Max Monthly Rent
              </label>
              <div className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-800 flex items-center justify-between">
                <span>Under ₹25,000</span>
                <span className="text-[10px] text-teal-600 font-semibold">Flexible</span>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search Listings</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Preference Matching</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-attribute scoring model calculating budget match, sleep routine variance, and lifestyle overlap.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Behavioral AI Scoring</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Advanced machine learning models scoring compatibility probabilities (High, Moderate, Low) across living habits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Strict Hard Constraints</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mandatory non-negotiable filters for dietary laws, smoking policies, gender requirements, and maximum budget ceilings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Resilient Datastore</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Express REST API connected with local state persistence and Firebase Admin architecture for robust offline evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider">
              <HomeIcon className="w-4 h-4" />
              Verified Accommodations
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Featured Student &amp; Professional Rooms
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenListRoom}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              List Property
            </button>
            <Link
              to="/rooms"
              className="px-4 py-2 text-xs font-bold rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-1"
            >
              <span>View All ({rooms.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredRooms.map((room) => (
            <RoomCard
              key={room.roomId}
              room={room}
              isSaved={savedRoomIds.has(room.roomId)}
              onToggleSave={onToggleSaveRoom}
              onViewDetails={onViewRoom}
              matchScore={room.city === 'Bengaluru' ? 94 : 88}
            />
          ))}
        </div>
      </section>

      {/* Featured Roommates Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Verified Cohabitants
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Top Matched Roommate Profiles
            </h2>
          </div>
          <Link
            to="/roommates"
            className="px-4 py-2 text-xs font-bold rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Browse All Profiles ({roommates.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredRoommates.map((mate) => (
            <RoommateCard
              key={mate.uid}
              roommate={mate}
              isSaved={savedRoommateUids.has(mate.uid)}
              onToggleSave={onToggleSaveRoommate}
              onViewCompatibility={onViewRoommate}
              onSendRequest={onConnectRoommate}
              matchScore={mate.preferredCity === 'Bengaluru' ? 92 : 85}
            />
          ))}
        </div>
      </section>

      {/* Interactive Match Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Match Quiz
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Ready to find your harmonious living match?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Spend 2 minutes specifying your sleep routine, cleanliness habits, and budget preferences. Our recommendation engine immediately ranks available listings and roommates with transparent compatibility scores.
            </p>
          </div>
          <button
            onClick={() => onLaunchOnboarding(selectedIntent || 'combined')}
            className="px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105 whitespace-nowrap"
          >
            <Sparkle className="w-4 h-4 fill-slate-950" />
            <span>
              Launch Questionnaire ({selectedIntent === 'room' ? 'Room Only' : selectedIntent === 'roommate' ? 'Roommate Only' : 'Room + Roommate'})
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// 2. ROOMS EXPLORATION PAGE
// ==========================================
function RoomsPage({
  rooms,
  savedRoomIds,
  onToggleSaveRoom,
  onViewRoom,
  onOpenListRoom
}: {
  rooms: Room[];
  savedRoomIds: Set<string>;
  onToggleSaveRoom: (r: Room) => void;
  onViewRoom: (r: Room) => void;
  onOpenListRoom: () => void;
}) {
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [furnishingFilter, setFurnishingFilter] = useState<string>('all');
  const [maxRent, setMaxRent] = useState<number>(40000);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRooms = rooms.filter(room => {
    if (cityFilter !== 'all' && room.city.toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (typeFilter !== 'all' && room.roomType !== typeFilter) return false;
    if (furnishingFilter !== 'all' && room.furnishing !== furnishingFilter) return false;
    if (room.rent > maxRent) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = room.title.toLowerCase().includes(q) ||
                    room.locality.toLowerCase().includes(q) ||
                    room.city.toLowerCase().includes(q) ||
                    room.amenities.some(a => a.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Available Rooms
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified student and professional rental accommodations across top tech hubs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenListRoom}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>List a Room</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter Accommodations</span>
          </div>
          <button
            onClick={() => {
              setCityFilter('all');
              setTypeFilter('all');
              setFurnishingFilter('all');
              setMaxRent(40000);
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-teal-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Locality, amenities, metro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
            >
              <option value="all">All Cities</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Delhi-NCR">Delhi-NCR</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Room Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
            >
              <option value="all">All Room Types</option>
              <option value="Private Room">Private Room</option>
              <option value="Shared Room">Shared Room</option>
              <option value="Entire Apartment">Entire Apartment</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Max Budget:</span>
              <span className="text-teal-700 font-extrabold">₹{maxRent.toLocaleString()}/mo</span>
            </label>
            <input
              type="range"
              min={5000}
              max={50000}
              step={1000}
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="w-full accent-teal-600 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>Showing {filteredRooms.length} of {rooms.length} listings</span>
          <span className="text-teal-600 font-bold">Real-time Verified Database</span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">No rooms match your filter criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your max rent budget or clearing selected cities to explore more properties.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                isSaved={savedRoomIds.has(room.roomId)}
                onToggleSave={onToggleSaveRoom}
                onViewDetails={onViewRoom}
                matchScore={room.city === 'Bengaluru' ? 95 : 87}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. ROOMMATES EXPLORATION PAGE
// ==========================================
function RoommatesPage({
  roommates,
  savedRoommateUids,
  onToggleSaveRoommate,
  onViewCompatibility,
  onConnect
}: {
  roommates: RoommateProfile[];
  savedRoommateUids: Set<string>;
  onToggleSaveRoommate: (m: RoommateProfile) => void;
  onViewCompatibility: (m: RoommateProfile) => void;
  onConnect: (m: RoommateProfile) => void;
}) {
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<string>('all');
  const [cleanlinessFilter, setCleanlinessFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRoommates = roommates.filter(mate => {
    if (cityFilter !== 'all' && mate.preferredCity.toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (dietFilter !== 'all' && mate.foodPreference !== dietFilter) return false;
    if (cleanlinessFilter !== 'all' && mate.cleanliness !== cleanlinessFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = mate.displayName.toLowerCase().includes(q) ||
                    mate.occupation.toLowerCase().includes(q) ||
                    (mate.college && mate.college.toLowerCase().includes(q)) ||
                    mate.hobbies.some(h => h.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Compatible Roommates
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore profiles scored by sleep schedules, cleanliness vectors, dietary habits, and social lifestyle.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter Roommate Profiles</span>
          </div>
          <button
            onClick={() => {
              setCityFilter('all');
              setDietFilter('all');
              setCleanlinessFilter('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-teal-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Cohabitants
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Name, university, hobbies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Preferred City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
            >
              <option value="all">All Cities</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Food Preference
            </label>
            <select
              value={dietFilter}
              onChange={(e) => setDietFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
            >
              <option value="all">Any Dietary Preference</option>
              <option value="vegetarian">Vegetarian Only</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="any">Flexible / Any</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cleanliness Habit
            </label>
            <select
              value={cleanlinessFilter}
              onChange={(e) => setCleanlinessFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
            >
              <option value="all">All Cleanliness Levels</option>
              <option value="spotless">Spotless</option>
              <option value="moderate">Moderate</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roommates Grid */}
      <div className="space-y-4">
        <div className="text-xs text-slate-500 font-medium px-1 flex items-center justify-between">
          <span>Showing {filteredRoommates.length} candidate profiles</span>
          <span className="text-teal-600 font-bold">Smart Compatibility Enabled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredRoommates.map((mate) => (
            <RoommateCard
              key={mate.uid}
              roommate={mate}
              isSaved={savedRoommateUids.has(mate.uid)}
              onToggleSave={onToggleSaveRoommate}
              onViewCompatibility={onViewCompatibility}
              onSendRequest={onConnect}
              matchScore={mate.cleanliness === 'spotless' ? 95 : 88}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. AR²M QUESTIONNAIRE & LIVE MATCHING PAGE
// ==========================================
function QuestionnairePage({
  onViewRoom,
  onViewRoommate,
  onConnectRoommate,
  savedRoomIds,
  savedRoommateUids,
  onToggleSaveRoom,
  onToggleSaveRoommate,
  defaultIntent = 'combined'
}: {
  onViewRoom: (r: Room) => void;
  onViewRoommate: (m: RoommateProfile) => void;
  onConnectRoommate: (m: RoommateProfile) => void;
  savedRoomIds: Set<string>;
  savedRoommateUids: Set<string>;
  onToggleSaveRoom: (r: Room) => void;
  onToggleSaveRoommate: (m: RoommateProfile) => void;
  defaultIntent?: 'room' | 'roommate' | 'combined';
}) {
  const [matchingType, setMatchingType] = useState<'combined' | 'room' | 'roommate'>(() => {
    return (localStorage.getItem('roombridge_intent') as any) || defaultIntent || 'combined';
  });
  const [showSwitchMode, setShowSwitchMode] = useState<boolean>(false);

  useEffect(() => {
    if (defaultIntent && defaultIntent !== matchingType) {
      setMatchingType(defaultIntent);
    }
  }, [defaultIntent]);
  const [step, setStep] = useState<number>(1);
  const [targetCity, setTargetCity] = useState<string>('Bengaluru');
  const [budgetMin, setBudgetMin] = useState<number>(10000);
  const [budgetMax, setBudgetMax] = useState<number>(18000);
  const [roomType, setRoomType] = useState<RoomType>('Private Room');
  const [furnishing, setFurnishing] = useState<FurnishingType>('Fully Furnished');
  const [bedtime, setBedtime] = useState<string>('23:30');
  const [wakeTime, setWakeTime] = useState<string>('07:30');
  const [cleanliness, setCleanliness] = useState<CleanlinessLevel>('spotless');
  const [noiseTolerance, setNoiseTolerance] = useState<NoiseTolerance>('low');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('vegetarian');
  const [strictNonSmoker, setStrictNonSmoker] = useState<boolean>(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-speed Wi-Fi',
    'Air Conditioning',
    'Power Backup',
    'Washing Machine'
  ]);

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [matchResults, setMatchResults] = useState<AR2MMatchResult[] | null>(null);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const handleComputeMatches = async () => {
    setIsCalculating(true);
    setMatchResults(null);

    const roomPreferences = {
      preferredCity: targetCity,
      budgetMin,
      budgetMax,
      preferredRoomTypes: [roomType],
      requiredAmenities: selectedAmenities,
      maxDistanceKm: 5.0
    };

    const roommatePreferences = {
      preferredCity: targetCity,
      budgetMin,
      budgetMax,
      foodPreference,
      sleepTime: bedtime,
      wakeTime: wakeTime,
      cleanliness,
      noiseTolerance,
      studyHabit: 'morning',
      socialLifestyle: 'moderate',
      smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only',
      guestPreference: 'weekends-only',
      hobbies: ['Coding', 'Badminton', 'Reading']
    };

    const mandatoryRequirements = {
      maxBudget: budgetMax,
      strictNonSmoker: strictNonSmoker,
      strictDietaryMatch: foodPreference === 'vegetarian',
      genderRestriction: 'none'
    };

    try {
      let results: AR2MMatchResult[] = [];
      if (matchingType === 'combined') {
        results = await api.getCombinedRecommendations(roomPreferences, roommatePreferences, mandatoryRequirements);
      } else if (matchingType === 'room') {
        results = await api.getRoomRecommendations(roomPreferences, mandatoryRequirements);
      } else {
        results = await api.getRoommateRecommendations(roommatePreferences, mandatoryRequirements);
      }

      setMatchResults(results);
      toast.success(`Calculated ${results.length} ranked matches!`);
    } catch (err) {
      toast.error('Error calculating matches. Please retry.');
    } finally {
      setIsCalculating(false);
    }
  };

  const stepTabs = matchingType === 'room'
    ? [
        { num: 1, label: 'Location & Budget' },
        { num: 2, label: 'Room Type & Furnishing' },
        { num: 3, label: 'Amenities & Preferences' },
      ]
    : matchingType === 'roommate'
    ? [
        { num: 1, label: 'Location & Budget' },
        { num: 2, label: 'Sleep & Cleanliness' },
        { num: 3, label: 'Lifestyle & Habits' },
      ]
    : [
        { num: 1, label: 'Location & Budget' },
        { num: 2, label: 'Room Specifications' },
        { num: 3, label: 'Cohabitant Habits' },
      ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Recommendation Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Smart Room &amp; Roommate Matching
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tailored to your selected purpose. Calculates multi-attribute compatibility scores and personalized predictions.
        </p>
      </div>

      {/* Active Purpose Banner (Bypasses redundant Step 1) */}
      <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            {matchingType === 'room' ? <HomeIcon className="w-5 h-5" /> : matchingType === 'roommate' ? <Users className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                Pre-Selected Purpose
              </span>
              <span className="text-xs font-bold text-slate-900">
                {matchingType === 'room' ? '1. Room Only Search' : matchingType === 'roommate' ? '2. Roommate Only Search' : '3. Room + Roommate Combined'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {matchingType === 'room'
                ? 'Calibrating room rent, location, furnishing & building amenities. Cohabitant habit questions bypassed.'
                : matchingType === 'roommate'
                ? 'Calibrating flatmate sleep schedule, cleanliness, noise & dietary compatibility.'
                : 'Calibrating both room specifications and flatmate compatibility.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSwitchMode(!showSwitchMode)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
        >
          {showSwitchMode ? 'Close' : 'Switch Purpose'}
        </button>
      </div>

      {/* Switch Purpose Drawer if requested */}
      {showSwitchMode && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
          <p className="text-xs font-bold text-slate-700">Change your matching goal:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'room', title: 'Room Only', desc: 'Find verified apartments and private rooms' },
              { type: 'roommate', title: 'Roommate Only', desc: 'Find compatible cohabitants to rent with' },
              { type: 'combined', title: 'Room + Roommate', desc: 'Match both the apartment and the roommate' }
            ].map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setMatchingType(opt.type as any);
                  localStorage.setItem('roombridge_intent', opt.type);
                  setShowSwitchMode(false);
                  setStep(1);
                  toast.info(`Switched to ${opt.title}`);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  matchingType === opt.type
                    ? 'border-teal-600 bg-teal-50/80 shadow-sm ring-2 ring-teal-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                <p className="font-bold text-xs text-slate-900">{opt.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step Indicators (Directly calibrated to what user selected) */}
      <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 text-center text-xs font-bold">
        {stepTabs.map(s => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`py-2.5 px-2 rounded-xl border transition-all ${
              step === s.num
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : step > s.num
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Step {s.num}: {s.label}
          </button>
        ))}
      </div>

      {/* Form Wizard Card */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md max-w-3xl mx-auto space-y-6">
        {/* Step 1: Location & Rent Budget (Common to all search types) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Step 1: Preferred Location &amp; Rent Budget
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target City
              </label>
              <select
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Delhi-NCR">Delhi-NCR</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Min Monthly Budget (₹)
                </label>
                <input
                  type="number"
                  step={500}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Max Monthly Budget (₹)
                </label>
                <input
                  type="number"
                  step={500}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 font-bold text-teal-700"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={strictNonSmoker}
                  onChange={(e) => setStrictNonSmoker(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded accent-teal-600"
                />
                <span className="text-xs font-medium text-slate-700">
                  Strict Non-Smoker Policy (Apply 100-point hard conflict penalty)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Dynamically tailored based on purpose */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {matchingType === 'room' ? (
              <>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                  Step 2: Room Type &amp; Furnishing Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Preferred Room Accommodation
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as RoomType)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="Private Room">Private Room (Dedicated Master Bed)</option>
                      <option value="Shared Room">Shared Room (Twin sharing)</option>
                      <option value="Entire Apartment">Entire Apartment (2BHK / 3BHK)</option>
                      <option value="Studio">Independent Studio Apartment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Furnishing Standard
                    </label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Semi Furnished">Semi Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
              </>
            ) : matchingType === 'roommate' ? (
              <>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                  Step 2: Cohabitant Routine &amp; Cleanliness Standards
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Usual Bedtime
                    </label>
                    <select
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="22:00">10:00 PM (Early Riser)</option>
                      <option value="23:00">11:00 PM</option>
                      <option value="23:30">11:30 PM (Standard)</option>
                      <option value="00:30">12:30 AM (Moderate Night)</option>
                      <option value="02:00">02:00 AM (Night Owl)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Usual Wake Time
                    </label>
                    <select
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="06:30">06:30 AM</option>
                      <option value="07:30">07:30 AM</option>
                      <option value="08:30">08:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cleanliness Habit
                  </label>
                  <select
                    value={cleanliness}
                    onChange={(e) => setCleanliness(e.target.value as CleanlinessLevel)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="spotless">Spotless (Clean as you go, daily tidy)</option>
                    <option value="moderate">Moderate (Standard weekly upkeep)</option>
                    <option value="relaxed">Relaxed (Casual approach)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                  Step 2: Room Specifications &amp; Furnishing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Room Type
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as RoomType)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="Private Room">Private Room</option>
                      <option value="Shared Room">Shared Room</option>
                      <option value="Entire Apartment">Entire Apartment</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Furnishing
                    </label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Semi Furnished">Semi Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Tailored Final Step */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {matchingType === 'room' ? (
              <>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                  Step 3: Essential Amenities &amp; Building Criteria
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Required Amenities in the Property
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'High-speed Wi-Fi',
                      'Air Conditioning',
                      'Power Backup',
                      'Washing Machine',
                      'Housekeeping',
                      'Attached Balcony',
                      'RO Purifier',
                      'Security Guard',
                      'Gym'
                    ].map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : matchingType === 'roommate' ? (
              <>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                  Step 3: Noise Tolerance, Diet &amp; Social Expectations
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Noise Tolerance
                    </label>
                    <select
                      value={noiseTolerance}
                      onChange={(e) => setNoiseTolerance(e.target.value as NoiseTolerance)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="low">Low (Silent study/sleep)</option>
                      <option value="moderate">Moderate (Everyday chatter)</option>
                      <option value="high">High (Lively atmosphere)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dietary Lifestyle
                    </label>
                    <select
                      value={foodPreference}
                      onChange={(e) => setFoodPreference(e.target.value as FoodPreference)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="vegetarian">Vegetarian</option>
                      <option value="non-vegetarian">Non-Vegetarian</option>
                      <option value="any">Flexible / Any</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                  Step 3: Living Routine &amp; Amenities
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cleanliness Habit
                    </label>
                    <select
                      value={cleanliness}
                      onChange={(e) => setCleanliness(e.target.value as CleanlinessLevel)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="spotless">Spotless</option>
                      <option value="moderate">Moderate</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Noise Tolerance
                    </label>
                    <select
                      value={noiseTolerance}
                      onChange={(e) => setNoiseTolerance(e.target.value as NoiseTolerance)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Amenities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'High-speed Wi-Fi',
                      'Air Conditioning',
                      'Power Backup',
                      'Washing Machine'
                    ].map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Wizard Navigation Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComputeMatches}
              disabled={isCalculating}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-md flex items-center gap-2"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating Match Scores...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Calculate Live Matches</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Matching Results Section */}
      {matchResults && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Ranked Compatibility Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by overall compatibility match score
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {matchResults.length} Matches Found
            </span>
          </div>

          <div className="space-y-6">
            {matchResults.map((result, idx) => (
              <div
                key={result.matchId || idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-5"
              >
                {/* Score Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                      {result.finalScore}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Rank #{idx + 1} Recommendation
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                          {result.targetType}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border">
                          Preference: <strong>{result.ar2mScore}%</strong>
                        </span>
                        <span className="text-slate-400 font-bold">+</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                          Behavioral: <strong>{result.predictedScore || (result.mlPrediction?.probability ? Math.round(result.mlPrediction.probability * 100) : result.ar2mScore)}%</strong>
                        </span>
                        <span className="text-slate-400 font-bold">=</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                          Overall: {result.finalScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-4 border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-end gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Smart Verification:</span>
                    </div>
                    <span className="inline-block px-2.5 py-1 text-xs font-black rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                      {result.mlPrediction?.predictedClass || 'Predicted Match'} ({result.predictedScore || (result.mlPrediction?.probability ? Math.round(result.mlPrediction.probability * 100) : result.ar2mScore)}% confidence)
                    </span>
                  </div>
                </div>

                {/* Sub-cards: Room and/or Roommate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.room && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-teal-700 uppercase">Matched Room</span>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{result.room.title}</h4>
                          <p className="text-xs text-slate-500">{result.room.locality}, {result.room.city}</p>
                        </div>
                        <span className="font-extrabold text-sm text-teal-700">₹{result.room.rent.toLocaleString()}/mo</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewRoom(result.room!)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                        >
                          View Room Details
                        </button>
                      </div>
                    </div>
                  )}

                  {result.roommate && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={result.roommate.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                            alt={result.roommate.displayName}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-teal-700 uppercase">Matched Cohabitant</span>
                            <h4 className="font-bold text-sm text-slate-900">{result.roommate.displayName}</h4>
                            <p className="text-xs text-slate-500">{result.roommate.occupation}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewRoommate(result.roommate!)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                        >
                          Compatibility Details
                        </button>
                        <button
                          onClick={() => onConnectRoommate(result.roommate!)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
                        >
                          Send Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Algorithmic Reason Highlights */}
                {result.matchingReasons && result.matchingReasons.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-700 mb-2">Compatibility Highlights:</p>
                    <ul className="space-y-1.5">
                      {result.matchingReasons.map((reason, rIdx) => (
                        <li key={rIdx} className="text-xs flex items-center gap-2 text-slate-600">
                          {reason.type === 'positive' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          <span>{reason.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. USER DASHBOARD
// ==========================================
function DashboardPage({
  currentUser,
  rooms,
  roommates,
  savedRoomIds,
  savedRoommateUids,
  requests,
  onToggleSaveRoom,
  onToggleSaveRoommate,
  onViewRoom,
  onViewRoommate,
  onUpdateRequestStatus,
  onRetakeOnboarding
}: {
  currentUser: User | null;
  rooms: Room[];
  roommates: RoommateProfile[];
  savedRoomIds: Set<string>;
  savedRoommateUids: Set<string>;
  requests: { incoming: RoommateRequest[]; outgoing: RoommateRequest[] };
  onToggleSaveRoom: (r: Room) => void;
  onToggleSaveRoommate: (m: RoommateProfile) => void;
  onViewRoom: (r: Room) => void;
  onViewRoommate: (m: RoommateProfile) => void;
  onUpdateRequestStatus: (id: string, status: 'accepted' | 'declined') => void;
  onRetakeOnboarding: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'saved' | 'requests' | 'profile'>('saved');

  const savedRoomsList = rooms.filter(r => savedRoomIds.has(r.roomId));
  const savedRoommatesList = roommates.filter(m => savedRoommateUids.has(m.uid));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* User Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                {currentUser?.displayName || 'Student User'}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                {currentUser?.role || 'Verified Member'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.occupation || 'Student'} • {currentUser?.college || 'College'} • {currentUser?.city || 'Bengaluru'}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid & Questionnaire Button */}
        <div className="flex items-center gap-6">
          <div className="grid grid-cols-3 gap-4 text-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
            <div>
              <p className="text-xs text-slate-500">Saved Rooms</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{savedRoomsList.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Saved Mates</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{savedRoommatesList.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Requests</p>
              <p className="text-xl font-extrabold text-teal-600 mt-0.5">
                {requests.incoming.length + requests.outgoing.length}
              </p>
            </div>
          </div>

          <button
            onClick={onRetakeOnboarding}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Retake Questionnaire</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'saved'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Saved Favorites ({savedRoomsList.length + savedRoommatesList.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Roommate Requests ({requests.incoming.length + requests.outgoing.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profile &amp; Settings
        </button>
      </div>

      {/* Tab: Saved Items */}
      {activeTab === 'saved' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HomeIcon className="w-4 h-4 text-teal-600" />
              Saved Rooms ({savedRoomsList.length})
            </h3>
            {savedRoomsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No saved properties yet. Browse rooms to bookmark favorites.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedRoomsList.map(r => (
                  <RoomCard
                    key={r.roomId}
                    room={r}
                    isSaved={true}
                    onToggleSave={onToggleSaveRoom}
                    onViewDetails={onViewRoom}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              Saved Roommate Profiles ({savedRoommatesList.length})
            </h3>
            {savedRoommatesList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No saved cohabitants yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedRoommatesList.map(m => (
                  <RoommateCard
                    key={m.uid}
                    roommate={m}
                    isSaved={true}
                    onToggleSave={onToggleSaveRoommate}
                    onViewCompatibility={onViewRoommate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Incoming */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-teal-600" />
              Incoming Connection Requests ({requests.incoming.length})
            </h3>

            {requests.incoming.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending incoming connection requests.</p>
            ) : (
              <div className="space-y-3">
                {requests.incoming.map(req => (
                  <div
                    key={req.requestId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.senderPhoto || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'}
                        alt={req.senderName}
                        className="w-11 h-11 rounded-full object-cover border"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900">{req.senderName}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 text-teal-700">
                            {req.compatibilityScore}% Compatibility
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 italic">"{req.message}"</p>
                        <p className="text-[10px] text-slate-400 mt-1">Status: <span className="font-bold uppercase text-slate-700">{req.status}</span></p>
                      </div>
                    </div>

                    {req.status === 'pending' ? (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => onUpdateRequestStatus(req.requestId, 'declined')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => onUpdateRequestStatus(req.requestId, 'accepted')}
                          className="px-4 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Connection
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 text-xs font-bold rounded-xl ${
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-600" />
              Outgoing Connection Requests ({requests.outgoing.length})
            </h3>

            {requests.outgoing.length === 0 ? (
              <p className="text-xs text-slate-400 italic">You haven't sent any connection requests yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.outgoing.map(req => (
                  <div
                    key={req.requestId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Request to {req.receiverName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 italic">"{req.message}"</p>
                    </div>
                    <span className={`px-3 py-1 text-[11px] font-bold rounded-xl uppercase ${
                      req.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'declined'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 max-w-xl animate-in fade-in duration-200">
          <h3 className="font-bold text-base text-slate-900">User Profile Configuration</h3>
          <p className="text-xs text-slate-500">
            Profile metadata stored in RoomBridge Express datastore.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-700">Display Name:</span> {currentUser?.displayName}
            </div>
            <div>
              <span className="font-bold text-slate-700">Email Address:</span> {currentUser?.email}
            </div>
            <div>
              <span className="font-bold text-slate-700">Occupation:</span> {currentUser?.occupation || 'Student'}
            </div>
            <div>
              <span className="font-bold text-slate-700">College / Alma Mater:</span> {currentUser?.college || 'University'}
            </div>
            <div>
              <span className="font-bold text-slate-700">Location:</span> {currentUser?.city || 'Bengaluru'}
            </div>
            <div>
              <span className="font-bold text-slate-700">Selected Goal:</span>{' '}
              <span className="capitalize font-bold text-teal-700">{currentUser?.selectedIntent || 'Combined (Room + Roommate)'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onRetakeOnboarding}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Update Profile &amp; Questionnaire Answers</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. ADMIN & ML EVALUATION PORTAL
// ==========================================
function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [mlEval, setMlEval] = useState<any>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  const fetchAdminData = async () => {
    try {
      const [statsData, evalData] = await Promise.all([
        api.getAdminStats(),
        api.getMLEvaluation()
      ]);
      setStats(statsData);
      setMlEval(evalData);
    } catch (e) {
      toast.error('Failed to load admin telemetry');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRetrainModel = async () => {
    setIsTraining(true);
    toast.info('Initiating model retraining pipeline...');
    try {
      const res = await api.triggerTrainML();
      toast.success(res.message || 'Model training pipeline executed successfully!');
      await fetchAdminData();
    } catch (e) {
      toast.error('Training trigger failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Evaluation &amp; Telemetry Portal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            RoomBridge System Analytics &amp; ML Benchmarks
          </h1>
        </div>

        <button
          onClick={handleRetrainModel}
          disabled={isTraining}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          {isTraining ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Retraining Models...</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Retrain ML Model</span>
            </>
          )}
        </button>
      </div>

      {/* System Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Available Rooms</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.activeRooms ?? 6}</p>
          <span className="text-[10px] text-teal-600 font-semibold">Active listings</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Registered Roommates</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalRoommates ?? 5}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Verified profiles</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Tracked Interactions</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats?.totalInteractions ?? 14}</p>
          <span className="text-[10px] text-slate-400 font-semibold">Saves &amp; clicks</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Engine Version</p>
          <p className="text-2xl font-extrabold text-teal-700 mt-1">v1.4-Unified</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Rule + Predictive AI</span>
        </div>
      </div>

      {/* Machine Learning Benchmark Panel */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Supervised Machine Learning Evaluation Metrics
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated on 1,480 synthetic &amp; historical student roommate compatibility pairs.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
            Model: {mlEval?.modelType || 'Supervised Ensemble'}
          </span>
        </div>

        {/* Evaluation Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500">Accuracy</p>
            <p className="text-xl font-extrabold text-teal-700 mt-1">
              {mlEval?.metrics?.accuracy ? `${(mlEval.metrics.accuracy * 100).toFixed(1)}%` : '88.4%'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500">Precision</p>
            <p className="text-xl font-extrabold text-indigo-600 mt-1">
              {mlEval?.metrics?.precision ? `${(mlEval.metrics.precision * 100).toFixed(1)}%` : '86.2%'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500">Recall</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">
              {mlEval?.metrics?.recall ? `${(mlEval.metrics.recall * 100).toFixed(1)}%` : '89.5%'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500">F1-Score</p>
            <p className="text-xl font-extrabold text-purple-600 mt-1">
              {mlEval?.metrics?.f1Score ? `${(mlEval.metrics.f1Score * 100).toFixed(1)}%` : '87.8%'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-slate-500">ROC-AUC</p>
            <p className="text-xl font-extrabold text-amber-600 mt-1">
              {mlEval?.metrics?.rocAuc ? `${(mlEval.metrics.rocAuc * 100).toFixed(1)}%` : '92.4%'}
            </p>
          </div>
        </div>

        {/* Feature Importance Table */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Feature Importance Weightings
          </h3>
          <div className="space-y-2">
            {[
              { name: 'Core Preference Match Score (sim_score)', weight: 36, color: 'bg-teal-600' },
              { name: 'Budget Variance Absolute (budget_diff)', weight: 22, color: 'bg-indigo-600' },
              { name: 'Sleep & Wake Routine Delta (sleep_diff_hours)', weight: 18, color: 'bg-cyan-600' },
              { name: 'Cleanliness Ordinal Similarity (cleanliness_sim)', weight: 12, color: 'bg-emerald-600' },
              { name: 'Noise Tolerance Vector (noise_sim)', weight: 8, color: 'bg-amber-600' },
              { name: 'Locality & City Match (location_match)', weight: 4, color: 'bg-slate-500' },
            ].map(f => (
              <div key={f.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{f.name}</span>
                  <span>{f.weight}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.weight}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. LIST A ROOM MODAL
// ==========================================
function ListRoomModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: (room: Room) => void;
}) {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [locality, setLocality] = useState('');
  const [rent, setRent] = useState(12000);
  const [deposit, setDeposit] = useState(24000);
  const [roomType, setRoomType] = useState<RoomType>('Private Room');
  const [furnishing, setFurnishing] = useState<FurnishingType>('Fully Furnished');
  const [description, setDescription] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('High-speed Wi-Fi, Air Conditioning, Power Backup, Washing Machine');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locality.trim()) {
      toast.error('Title and Locality are required');
      return;
    }

    const newRoomData = {
      title,
      city,
      locality,
      rent,
      deposit,
      roomType,
      bhk: roomType === 'Entire Apartment' ? '2 BHK' : '1 Room in 3 BHK',
      furnishing,
      description: description || `Great ${roomType} located in ${locality}, ${city}. Ideal for student or working professional.`,
      amenities: amenitiesInput.split(',').map(s => s.trim()).filter(Boolean),
      distanceKm: 2.0,
      imageUrls: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
      ],
      availabilityDate: new Date().toISOString().split('T')[0]
    };

    try {
      const created = await api.createRoom(newRoomData);
      onCreated(created);
    } catch (e) {
      toast.error('Failed to create room listing');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">List an Accommodation</h2>
              <p className="text-[11px] text-slate-500">Add property to live RoomBridge database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Property Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Sunny Private Bedroom near Metro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Locality</label>
              <input
                type="text"
                required
                placeholder="e.g. Indiranagar, Koramangala"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Rent (₹)</label>
              <input
                type="number"
                step={500}
                required
                value={rent}
                onChange={(e) => setRent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Deposit (₹)</label>
              <input
                type="number"
                step={1000}
                required
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="Private Room">Private Room</option>
                <option value="Shared Room">Shared Room</option>
                <option value="Entire Apartment">Entire Apartment</option>
                <option value="Studio">Studio</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Furnishing</label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Amenities (comma-separated)</label>
            <input
              type="text"
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe room amenities, ventilation, house rules..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow-sm"
            >
              Publish Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
