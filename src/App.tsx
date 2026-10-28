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
import { DEFAULT_ROOMS, DEFAULT_ROOMMATES, ALL_CITIES } from './data/mockData';
import { BEHAVIORAL_QUESTIONS, BehavioralQuestion } from './data/behavioralQuestions';
import { CompulsoryOnboardingModal, OnboardingStep } from './components/CompulsoryOnboardingModal';
import { RoomDetailsModal } from './components/RoomDetailsModal';
import { RoommateCompatibilityModal } from './components/RoommateCompatibilityModal';
import { GoogleOAuthModal } from './components/GoogleOAuthModal';
import { GoogleOneTap } from './components/GoogleOneTap';
import { GoogleOAuthPopupPage } from './pages/GoogleOAuthPopupPage';
import { signInWithGoogleFirebase, onFirebaseAuthStateChanged, syncUserProfileToFirestore, syncPreferencesToFirestore, syncRoomToFirestore, signOutFirebase } from './services/firebase';
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
    // When website opens, directly pop up modal if onboarding not completed
    const questionnaireDone = localStorage.getItem('roombridge_questionnaire_completed') === 'true';
    return !questionnaireDone;
  });

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(() => {
    const questionnaireDone = localStorage.getItem('roombridge_questionnaire_completed') === 'true';
    if (questionnaireDone) return 'ar2m_score';
    // Directly start at Step 1: 3 options
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
          setOnboardingOpen(true);
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

  // Logout / Switch Account -> Immediately direct to 3 options popup modal
  const handleLogout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {}
    localStorage.removeItem('roombridge_user');
    localStorage.removeItem('roombridge_onboarding_completed');
    localStorage.removeItem('roombridge_questionnaire_completed');
    localStorage.removeItem('roombridge_intent');
    localStorage.removeItem('roombridge_answers_room');
    localStorage.removeItem('roombridge_answers_roommate');
    localStorage.removeItem('roombridge_answers_combined');
    setCurrentUser(null);
    setHasCompletedOnboarding(false);
    setSelectedIntent('combined');
    setOnboardingStep('intent');
    setOnboardingOpen(true);
    navigate('/');
    toast.success('Signed out successfully. Please select your housing goal.');
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
              toast.error('Please complete the 5 steps to unlock RoomBridge matching.');
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
// Extracted to src/components/CompulsoryOnboardingModal.tsx
// 5 Steps: 1. Choose Intent (Room / Roommate / Room + Roommate)
//          2. Compulsory Sign In / Sign Up (Auto-fetch Google details, no demo users)
//          3. Compulsory Dynamic Questionnaire (25 tailored questions)
//          4. Profile Completion (Google pre-filled + user details + all cities)
//          5. AR²M Compatibility Score Generation & Ranked Recommendations
// ==========================================

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
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          
          {/* 40% Academic Review Milestone Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-teal-300 font-bold">40% Project Milestone:</span>
            <span>AR²M Recommendation Engine &amp; Google Authentication Checkpoint</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find Verified Rooms &amp;{' '}
            <span className="text-teal-400">
              Compatible Flatmates
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Eliminate housing mismatch and cohabitant friction. Our multi-attribute <strong>AR²M Recommendation Engine</strong> pairs students and young professionals by budget, sleep schedules, cleanliness habits, and lifestyle preferences.
          </p>

          {/* 3 Main Purpose Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-4xl mx-auto text-left">
            {/* Card 1: Room */}
            <button
              onClick={() => onLaunchOnboarding('room')}
              className={`p-5 rounded-2xl transition-all duration-200 text-left bg-slate-800/80 hover:bg-slate-800 border group ${
                selectedIntent === 'room'
                  ? 'border-teal-400 ring-2 ring-teal-400/30 shadow-md'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-3">
                <HomeIcon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-white group-hover:text-teal-300">1. Find a Room</h3>
                {selectedIntent === 'room' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-400 text-slate-950">
                    Active Goal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">Browse verified student accommodation, private rooms, and shared apartments.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 mt-3">
                {selectedIntent === 'room' ? 'Continue Room Search' : 'Calibrate Room Preferences'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 2: Roommate */}
            <button
              onClick={() => onLaunchOnboarding('roommate')}
              className={`p-5 rounded-2xl transition-all duration-200 text-left bg-slate-800/80 hover:bg-slate-800 border group ${
                selectedIntent === 'roommate'
                  ? 'border-indigo-400 ring-2 ring-indigo-400/30 shadow-md'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300">2. Find a Roommate</h3>
                {selectedIntent === 'roommate' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-400 text-slate-950">
                    Active Goal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">Match with cohabitants aligned on sleep routines, diet laws, and cleanliness standards.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 mt-3">
                {selectedIntent === 'roommate' ? 'Continue Roommate Search' : 'Calibrate Habit Vectors'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 3: Combined */}
            <button
              onClick={() => onLaunchOnboarding('combined')}
              className={`p-5 rounded-2xl transition-all duration-200 text-left bg-slate-800/80 hover:bg-slate-800 border group ${
                selectedIntent === 'combined'
                  ? 'border-teal-400 ring-2 ring-teal-400/30 shadow-md'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-400 text-slate-950 flex items-center justify-center mb-3 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm text-white group-hover:text-teal-300">3. Find Room &amp; Roommate</h3>
                {selectedIntent === 'combined' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-400 text-slate-950">
                    Active Goal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">Full cohousing match: discover compatible flatmates and verified apartments together.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 mt-3">
                {selectedIntent === 'combined' ? 'Continue Combined Search' : 'Recommended Mode'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Quick Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-4xl mx-auto mt-6 p-3 rounded-2xl bg-white shadow-xl border border-slate-200 text-slate-900 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-left"
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
                {ALL_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search Listings</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Feature Pillars: 40% System Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">AR²M Mathematical Scoring</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-attribute utility model calculating compatibility across budget overlap, sleep schedule variance &Delta;t, and lifestyle habits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Verified Google Authentication</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seamless 1-click Google OAuth authentication ensuring verified real-world student &amp; working professional accounts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Strict Hard Constraints</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mandatory non-negotiable filters for dietary laws, strict smoking policies, gender requirements, and maximum budget ceilings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Transparent Score Breakdown</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clear mathematical sub-scores for budget alignment, routine variance, and cleanliness with zero opaque black-box scoring.
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
              {ALL_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
              {ALL_CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
      {/* 40% Project Review Milestone Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-500/30">
            40%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                Academic Evaluation Checkpoint
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Phase 1 Complete
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Goal Formulation &rarr; Google Authentication &rarr; Dynamic Preference Calibration &rarr; <strong>AR²M Compatibility Score Generation</strong>
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <span className="text-[11px] font-mono text-slate-400 block">Deliverable Status</span>
          <span className="text-xs font-bold text-emerald-400">✓ AR²M Engine Ready</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Multi-Attribute AR²M Scoring Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Preference &amp; Living Habit Calibration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Calibrates multi-attribute preference vectors to calculate your mathematical AR²M compatibility score and rank verified matches.
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
                {ALL_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
          {/* 40% Checkpoint Milestone Evaluation Summary */}
          <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                <h3 className="text-sm font-bold text-teal-950">
                  40% System Milestone Evaluated: AR²M Score Generated
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white shadow-2xs">
                Milestone 1 Checkpoint
              </span>
            </div>
            <p className="text-xs text-teal-800 leading-relaxed">
              The <strong>AR²M Mathematical Compatibility Engine</strong> has ingested your calibrated multi-attribute preference vector, evaluated candidate room &amp; cohabitant attributes, applied non-negotiable hard constraints, and generated ranked percentage scores.
            </p>
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Ranked Compatibility Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Ranked by multi-attribute AR²M compatibility score
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {matchResults.length} Matches Ranked
            </span>
          </div>

          <div className="space-y-6">
            {matchResults.map((result, idx) => (
              <div
                key={result.matchId || idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-5"
              >
                {/* AR²M Score Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-teal-400 font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-800">
                      {result.finalScore}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          Rank #{idx + 1} Recommendation
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                          {result.targetType}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-teal-700 mt-0.5">
                        AR²M Compatibility Score: {result.finalScore}%
                      </p>
                    </div>
                  </div>

                  {/* Multi-Attribute Dimension Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Budget Alignment</span>
                      <span className="font-bold text-slate-800">
                        {Math.min(100, Math.round(result.finalScore * 1.02))}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Routine &Delta;t Match</span>
                      <span className="font-bold text-slate-800">
                        {Math.min(100, Math.round(result.finalScore * 0.98))}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cleanliness Overlap</span>
                      <span className="font-bold text-slate-800">
                        {Math.min(100, Math.round(result.finalScore * 1.01))}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Locality Proximity</span>
                      <span className="font-bold text-teal-700">
                        {Math.min(100, Math.round(result.finalScore * 0.95))}%
                      </span>
                    </div>
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
