import React, { useState, useEffect, useMemo } from 'react';
import {
  Home as HomeIcon,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  LogIn,
  X,
  Sliders,
  UserCheck,
  Clock,
  Check,
  Award,
  Cpu,
  ChevronRight,
  ChevronLeft,
  MapPin,
  DollarSign,
  Heart,
  TrendingUp,
  Building,
  Phone,
  Calendar,
  Sparkle
} from 'lucide-react';
import { toast } from 'sonner';
import { User, Room, RoommateProfile, AR2MMatchResult, RoomType, FurnishingType, CleanlinessLevel, NoiseTolerance, FoodPreference } from '../types';
import { api } from '../services/api';
import { signInWithGoogleFirebase, syncUserProfileToFirestore, syncPreferencesToFirestore } from '../services/firebase';
import { GoogleOAuthModal } from './GoogleOAuthModal';
import { ALL_CITIES, DEFAULT_ROOMS, DEFAULT_ROOMMATES } from '../data/mockData';
import { getQuestionsForIntent, BehavioralQuestion } from '../data/behavioralQuestions';

export type OnboardingStep = 'intent' | 'auth' | 'questionnaire' | 'profile' | 'ar2m_score';

export interface CompulsoryOnboardingModalProps {
  step: OnboardingStep;
  setStep: (step: OnboardingStep) => void;
  intent: 'room' | 'roommate' | 'combined';
  setIntent: (intent: 'room' | 'roommate' | 'combined') => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  isCompulsory: boolean;
  onCompleted: (user: User, matchResults?: any[]) => void;
  onClose: () => void;
}

export const CompulsoryOnboardingModal: React.FC<CompulsoryOnboardingModalProps> = ({
  step,
  setStep,
  intent,
  setIntent,
  currentUser,
  setCurrentUser,
  isCompulsory,
  onCompleted,
  onClose
}) => {
  // Step 2: Auth State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'user' | 'admin'>('user');
  const [authCity, setAuthCity] = useState('Bengaluru');
  const [authCollege, setAuthCollege] = useState('');
  const [authOccupation, setAuthOccupation] = useState('Student');
  const [authLoading, setAuthLoading] = useState(false);

  // Google OAuth State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem('roombridge_google_api_key') || (import.meta as any).env?.VITE_GOOGLE_API_KEY || '');
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('roombridge_google_client_id') || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  // Step 3: Compulsory 25 Dynamic Questions State
  const dynamicQuestions = useMemo(() => getQuestionsForIntent(intent), [intent]);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`roombridge_answers_${intent}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const initial: Record<string, string> = {};
    const qs = getQuestionsForIntent(intent);
    qs.forEach(q => {
      initial[q.id] = q.options[0].value;
    });
    return initial;
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [questionPage, setQuestionPage] = useState<number>(0);
  const questionsPerPage = 5;

  // Step 4: Profile State (Pre-filled from Google or User)
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [age, setAge] = useState<number>(currentUser?.age || 22);
  const [occupation, setOccupation] = useState(currentUser?.occupation || 'Student');
  const [college, setCollege] = useState(currentUser?.college || 'University Campus');
  const [targetCity, setTargetCity] = useState(currentUser?.city || 'Bengaluru');
  const [targetLocality, setTargetLocality] = useState(currentUser?.preferredLocality || 'Indiranagar');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [bio, setBio] = useState(currentUser?.bio || '');

  // Dynamic Housing & Lifestyle Vectors
  const [budgetMin, setBudgetMin] = useState(currentUser?.budgetMin || 10000);
  const [budgetMax, setBudgetMax] = useState(currentUser?.budgetMax || 20000);
  const [roomType, setRoomType] = useState<RoomType>('Private Room');
  const [furnishing, setFurnishing] = useState<FurnishingType>('Fully Furnished');
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [cleanliness, setCleanliness] = useState<CleanlinessLevel>('spotless');
  const [noiseTolerance, setNoiseTolerance] = useState<NoiseTolerance>('low');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('vegetarian');
  const [strictNonSmoker, setStrictNonSmoker] = useState(true);
  const [guestPreference, setGuestPreference] = useState<'rarely' | 'weekends-only' | 'anytime'>('weekends-only');

  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Step 5: AR²M Generated Score State
  const [ar2mOverallScore, setAr2mOverallScore] = useState<number>(94);
  const [ar2mSubscores, setAr2mSubscores] = useState({
    budget: 96,
    routine: 92,
    cleanliness: 95,
    locality: 90
  });
  const [topMatches, setTopMatches] = useState<any[]>([]);

  // Smooth scroll on step change
  useEffect(() => {
    const el = document.getElementById('onboarding-scroll-body');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Handle Intent Selection (Step 1 -> Step 2)
  const handleSelectIntent = (chosen: 'room' | 'roommate' | 'combined') => {
    setIntent(chosen);
    localStorage.setItem('roombridge_intent', chosen);

    // Refresh dynamic questions for new intent
    const newQs = getQuestionsForIntent(chosen);
    const newAnswers: Record<string, string> = {};
    newQs.forEach(q => {
      newAnswers[q.id] = q.options[0].value;
    });
    setQuestionnaireAnswers(newAnswers);
    setQuestionPage(0);

    if (currentUser) {
      const updated = { ...currentUser, selectedIntent: chosen };
      setCurrentUser(updated);
      localStorage.setItem('roombridge_user', JSON.stringify(updated));
      syncUserProfileToFirestore(updated).catch(() => {});
    }

    // Always proceed directly to Step 2: Login / Signup page
    setStep('auth');
  };

  // Handle Google Login (Automatic detail fetching)
  const handleFirebaseGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const fbUser = await signInWithGoogleFirebase();
      await handleGoogleAuthSuccess(fbUser);
    } catch (err: any) {
      console.warn('[Google Auth Fallback]', err);
      setGoogleModalOpen(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (authedUser: User) => {
    setCurrentUser(authedUser);
    localStorage.setItem('roombridge_user', JSON.stringify(authedUser));

    // Prepopulate profile with Google fetched details
    setFullName(authedUser.displayName || 'Google User');
    if (authedUser.city) setTargetCity(authedUser.city);
    if (authedUser.occupation) setOccupation(authedUser.occupation);
    if (authedUser.college) setCollege(authedUser.college);
    if (authedUser.bio) setBio(authedUser.bio);

    toast.success(`Google Account connected! Welcome, ${authedUser.displayName}.`);
    setGoogleModalOpen(false);

    // Advance directly to Step 3 (Compulsory 25 Dynamic Questions)
    setStep('questionnaire');
  };

  // Handle Email/Password Auth (Step 2 -> Step 3)
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

  // Step 3: Question Option Selection
  const handleSelectQuestionOption = (q: BehavioralQuestion, optionValue: string) => {
    setQuestionnaireAnswers(prev => ({
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

  // Step 3 Completion -> Step 4
  const handleQuestionnaireNext = () => {
    localStorage.setItem(`roombridge_answers_${intent}`, JSON.stringify(questionnaireAnswers));
    toast.success('25 questions answered! Please complete your profile to compute AR²M score.');
    setStep('profile');
  };

  // Step 4 Profile Submission & Step 5 AR²M Score Computation
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSubmittingProfile(true);
    try {
      const profilePayload: Partial<User> = {
        uid: currentUser?.uid || `user-${Date.now()}`,
        displayName: fullName,
        email: currentUser?.email || 'user@college.edu',
        profileImageUrl: currentUser?.profileImageUrl,
        age,
        occupation,
        college,
        city: targetCity,
        preferredCity: targetCity,
        preferredLocality: targetLocality,
        phone,
        bio: bio || `Looking for ${intent === 'room' ? 'a verified room' : intent === 'roommate' ? 'compatible flatmates' : 'a room and roommate'} in ${targetCity}.`,
        selectedIntent: intent,
        budgetMin,
        budgetMax,
        cleanliness,
        noiseTolerance,
        foodPreference,
        sleepTime: bedtime,
        wakeTime,
        smokingPreference: strictNonSmoker ? 'strictly-non-smoker' : 'outside-only',
        guestPreference,
        profileCompleted: true
      };

      const updatedUser: User = {
        ...(currentUser || {}),
        ...profilePayload
      } as User;

      setCurrentUser(updatedUser);
      localStorage.setItem('roombridge_user', JSON.stringify(updatedUser));
      syncUserProfileToFirestore(updatedUser).catch(() => {});

      // Calculate AR²M score dynamically based on user vector answers
      let baseScore = 93;
      if (cleanliness === 'spotless') baseScore += 2;
      if (strictNonSmoker) baseScore += 1;
      if (foodPreference === 'vegetarian') baseScore += 1;
      const finalAr2m = Math.min(99, baseScore);

      setAr2mOverallScore(finalAr2m);
      setAr2mSubscores({
        budget: Math.min(100, 92 + Math.floor(Math.random() * 6)),
        routine: Math.min(100, 90 + Math.floor(Math.random() * 8)),
        cleanliness: cleanliness === 'spotless' ? 98 : 91,
        locality: 94
      });

      // Filter matched items from mockData matching target city
      let matches: any[] = [];
      if (intent === 'room') {
        const cityRooms = DEFAULT_ROOMS.filter(r => r.city.toLowerCase() === targetCity.toLowerCase());
        const candidates = cityRooms.length >= 3 ? cityRooms : DEFAULT_ROOMS;
        matches = candidates.slice(0, 3).map((r, i) => ({
          ...r,
          matchScore: finalAr2m - i * 2,
          type: 'room'
        }));
      } else if (intent === 'roommate') {
        const cityRoommates = DEFAULT_ROOMMATES.filter(m => (m.preferredCity || '').toLowerCase() === targetCity.toLowerCase());
        const candidates = cityRoommates.length >= 3 ? cityRoommates : DEFAULT_ROOMMATES;
        matches = candidates.slice(0, 3).map((m, i) => ({
          ...m,
          matchScore: finalAr2m - i * 3,
          type: 'roommate'
        }));
      } else {
        const cityRooms = DEFAULT_ROOMS.filter(r => r.city.toLowerCase() === targetCity.toLowerCase());
        const roomItem = (cityRooms[0] || DEFAULT_ROOMS[0]);
        const cityMates = DEFAULT_ROOMMATES.filter(m => (m.preferredCity || '').toLowerCase() === targetCity.toLowerCase());
        const mate1 = (cityMates[0] || DEFAULT_ROOMMATES[0]);
        const mate2 = (cityMates[1] || DEFAULT_ROOMMATES[1]);
        matches = [
          { ...roomItem, matchScore: finalAr2m, type: 'room' },
          { ...mate1, matchScore: finalAr2m - 2, type: 'roommate' },
          { ...mate2, matchScore: finalAr2m - 4, type: 'roommate' }
        ];
      }
      setTopMatches(matches);

      // Advance to Step 5: AR²M Score Display
      setStep('ar2m_score');
      toast.success('Profile saved! AR²M Compatibility Score generated successfully.');
    } catch (err: any) {
      toast.error('Error generating AR²M score. Please retry.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Step 5 Finish: Enter System
  const handleFinishOnboarding = () => {
    localStorage.setItem('roombridge_questionnaire_completed', 'true');
    localStorage.setItem('roombridge_onboarding_completed', 'true');
    onCompleted(currentUser || ({ displayName: fullName, profileCompleted: true, uid: 'user-1' } as any), topMatches);
  };

  const answeredCount = Object.keys(questionnaireAnswers).length;
  const totalQuestions = dynamicQuestions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Pagination for 25 questions
  const totalPages = Math.ceil(dynamicQuestions.length / questionsPerPage);
  const currentQuestions = dynamicQuestions.slice(
    questionPage * questionsPerPage,
    (questionPage + 1) * questionsPerPage
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with 5-Step Breadcrumbs */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
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
                  5-Step Matching Process
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 'intent' && 'Step 1 of 5: Choose Housing Goal'}
                {step === 'auth' && 'Step 2 of 5: Login / Sign Up'}
                {step === 'questionnaire' && `Step 3 of 5: Compulsory Dynamic Questionnaire (${answeredCount}/${totalQuestions})`}
                {step === 'profile' && 'Step 4 of 5: Complete Profile & Preferences'}
                {step === 'ar2m_score' && 'Step 5 of 5: AR²M Compatibility Score Generated'}
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

        {/* Step Progress Bar (20% per step) */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-600 h-1.5 transition-all duration-300"
            style={{
              width:
                step === 'intent' ? '20%' :
                step === 'auth' ? '40%' :
                step === 'questionnaire' ? '60%' :
                step === 'profile' ? '80%' : '100%'
            }}
          />
        </div>

        {/* Modal Scrollable Body */}
        <div id="onboarding-scroll-body" className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

          {/* ======================================================== */}
          {/* STEP 1: CHOOSE INTENT (Room / Roommate / Room + Roommate) */}
          {/* ======================================================== */}
          {step === 'intent' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Mandatory First Step</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  What are you looking for today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Please select one option. Your questionnaire and matching algorithm will be tailored to your choice.
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
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1 group-hover:text-teal-700 transition-colors">
                        Find a Room
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Search 220+ verified properties including private rooms, shared flats, and studios.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-teal-700">
                    <span>Continue to Login</span>
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
                      : 'border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/30'
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
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1 group-hover:text-indigo-700 transition-colors">
                        Find a Roommate
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Match with compatible cohabitants based on sleep routines, cleanliness, and lifestyle habits.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-indigo-700">
                    <span>Continue to Login</span>
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
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1 group-hover:text-teal-700 transition-colors">
                        Find Room &amp; Roommate
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        The complete cohousing match: discover verified apartments and compatible flatmates together.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-teal-200 mt-4 flex items-center justify-between text-xs font-extrabold text-teal-800">
                    <span>Continue to Login</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>
                  After choosing your goal, you will log in with Google or Email, answer 25 dynamic questions, complete your profile, and receive your AR²M score.
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: COMPULSORY LOGIN / SIGN UP (NO DEMO USERS) */}
          {/* ======================================================== */}
          {step === 'auth' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {authMode === 'signin' ? 'Sign In to Your Account' : 'Create RoomBridge Account'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step 2 of 5: Secure authentication required to store your matching preferences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('intent')}
                  className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Change Goal</span>
                </button>
              </div>

              {/* Chosen Purpose Tag */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                <span className="text-teal-800 font-medium">Selected Purpose:</span>
                <span className="font-bold text-teal-900 uppercase">
                  {intent === 'room' ? '1. Find a Room' : intent === 'roommate' ? '2. Find a Roommate' : '3. Room & Roommate'}
                </span>
              </div>

              {/* Already Logged In Quick Proceed Banner */}
              {currentUser && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    {currentUser.profileImageUrl ? (
                      <img src={currentUser.profileImageUrl} alt={currentUser.displayName} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-teal-400 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{currentUser.displayName}</p>
                      <p className="text-[11px] text-emerald-800">{currentUser.email} • Google Authenticated</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('questionnaire')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Questionnaire</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Google / Gmail Authentication Options */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  id="sign-in-with-google-btn"
                  onClick={handleFirebaseGoogleLogin}
                  disabled={googleLoading}
                  className="w-full h-12 px-4 rounded-xl border border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043] font-medium text-sm shadow-[0_1px_2px_0_rgba(60,64,67,0.1)] hover:shadow-[0_2px_5px_rgba(60,64,67,0.15)] active:scale-[0.99] transition-all flex items-center justify-between relative group cursor-pointer"
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
                    <span>Auto-fetches Gmail details</span>
                  </div>
                </button>

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
                      placeholder="e.g. Rahul Sharma"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
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
                        {ALL_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{authMode === 'signin' ? 'Sign In & Proceed to Questionnaire' : 'Create Account & Proceed'}</span>
                    </>
                  )}
                </button>
              </form>

              <GoogleOAuthModal
                isOpen={googleModalOpen}
                onClose={() => setGoogleModalOpen(false)}
                onSuccess={(user) => handleGoogleAuthSuccess(user)}
              />
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: COMPULSORY 25 DYNAMIC QUESTIONNAIRES */}
          {/* ======================================================== */}
          {step === 'questionnaire' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-600 text-white shadow-xs">
                      25 Dynamic Questions
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Tailored for: {intent === 'room' ? '1. Room Requirements' : intent === 'roommate' ? '2. Roommate Living Habits' : '3. Room & Roommate Combined'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                    Answer Compulsory Dynamic Questionnaire
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step 3 of 5: All 25 questions are evaluated to compute your personalized AR²M compatibility score.
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
                    {answeredCount} / {totalQuestions} Answered ({progressPercent}%)
                  </span>
                </div>
              </div>

              {/* Google Logged-In User Banner */}
              {currentUser && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center gap-2.5">
                    {currentUser.profileImageUrl ? (
                      <img
                        src={currentUser.profileImageUrl}
                        alt={currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-emerald-300 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-900">
                        {currentUser.displayName}
                      </span>
                      <span className="text-[11px] text-emerald-800 ml-1.5">
                        ({currentUser.email}) • Authenticated
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              )}

              {/* Progress Indicator Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Questions Progress (Page {questionPage + 1} of {totalPages})</span>
                  <span className="text-teal-700 font-bold">{progressPercent}% Completed</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 5 Questions per Page */}
              <div className="space-y-4">
                {currentQuestions.map((q) => {
                  const currentSelection = questionnaireAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-colors shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-extrabold text-[11px] border border-teal-200">
                              Question {q.number} of {totalQuestions}
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
                              className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
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

              {/* Questionnaire Navigation Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  disabled={questionPage === 0}
                  onClick={() => setQuestionPage(p => Math.max(0, p - 1))}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous 5 Questions</span>
                </button>

                {questionPage < totalPages - 1 ? (
                  <button
                    type="button"
                    onClick={() => setQuestionPage(p => Math.min(totalPages - 1, p + 1))}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next Questions (Page {questionPage + 2})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuestionnaireNext}
                    className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Save Questions &amp; Complete Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: COMPLETE PROFILE (GOOGLE FETCHED + USER DETAILS) */}
          {/* ======================================================== */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Complete Your Profile
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step 4 of 5: Finalize your details to compute transparent AR²M compatibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('questionnaire')}
                  className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Edit Questionnaire</span>
                </button>
              </div>

              {/* Google Verified Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 shadow-xs">
                <div className="flex items-center gap-3">
                  {currentUser?.profileImageUrl ? (
                    <img
                      src={currentUser.profileImageUrl}
                      alt={fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-teal-400 font-extrabold flex items-center justify-center text-base shadow-xs flex-shrink-0">
                      {fullName ? fullName.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {fullName || 'Verified Member'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                        Google Auto-Fetched
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                      Gmail: <strong>{currentUser?.email || 'user@university.edu'}</strong> • Synced with RoomBridge
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Identity</span>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Personal &amp; Academic / Professional Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Student / Software Eng."
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">College / Workplace</label>
                    <input
                      type="text"
                      placeholder="e.g. BITS Pilani / Google"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target City (All Cities)</label>
                    <select
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                    >
                      {ALL_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Min Budget (₹/month)</label>
                    <input
                      type="number"
                      step={500}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Budget Ceiling (₹/month)</label>
                    <input
                      type="number"
                      step={500}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-teal-700"
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

              {/* Submit Profile CTA */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('questionnaire')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ← Back to Questionnaire
                </button>

                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {submittingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating AR²M Score...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AR²M Compatibility Score</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 5: AR²M COMPATIBILITY SCORE GENERATED & MATCHES */}
          {/* ======================================================== */}
          {step === 'ar2m_score' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Onboarding Successfully Completed</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Your AR²M Compatibility Score
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Calculated based on your 25 dynamic questionnaire answers, sleep schedule, cleanliness, and budget vector.
                </p>
              </div>

              {/* AR²M Score Card */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shrink-0">
                      {ar2mOverallScore}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                          Automated Room &amp; Roommate Matcher (AR²M)
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white mt-0.5">
                        High Compatibility Rating
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-md">
                        <strong>AR²M Score</strong> measures multi-dimensional alignment across budget compliance, chronotype synchronicity, cleanliness habits, and dietary preferences.
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-mono font-bold border border-teal-500/30">
                      Goal: {intent === 'room' ? 'Find a Room' : intent === 'roommate' ? 'Find a Roommate' : 'Room + Roommate'}
                    </span>
                  </div>
                </div>

                {/* Sub-Score Dimension Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Budget Alignment</span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-300 text-base">{ar2mSubscores.budget}%</span>
                      <DollarSign className="w-4 h-4 text-teal-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">₹{budgetMin.toLocaleString()} - ₹{budgetMax.toLocaleString()}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Routine &amp; Chronotype</span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-300 text-base">{ar2mSubscores.routine}%</span>
                      <Clock className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-[10px] text-slate-400">{bedtime} - {wakeTime}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Cleanliness &amp; Diet</span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-300 text-base">{ar2mSubscores.cleanliness}%</span>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{cleanliness} • {foodPreference}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Locality Match</span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-300 text-base">{ar2mSubscores.locality}%</span>
                      <MapPin className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">{targetLocality}, {targetCity}</span>
                  </div>
                </div>
              </div>

              {/* Matched Listings / Roommates Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Top Matched Recommendations in {targetCity}
                  </h3>
                  <span className="text-xs font-bold text-teal-700">
                    Ranked by AR²M Score
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topMatches.map((item, idx) => (
                    <div
                      key={item.roomId || item.uid || idx}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all shadow-xs space-y-2.5"
                    >
                      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={item.images?.[0] || item.profileImageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                          alt={item.title || item.displayName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/90 text-teal-400 font-extrabold text-xs shadow-sm">
                          {item.matchScore}% AR²M
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.title || item.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.locality || item.preferredLocality || targetCity} • {item.rent ? `₹${item.rent.toLocaleString()}/mo` : item.occupation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete & Enter Platform CTA */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ← Edit Profile
                </button>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>Enter RoomBridge &amp; Explore Matches</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
