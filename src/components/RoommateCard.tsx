import React from 'react';
import { MapPin, Moon, Sparkles, UserPlus, Heart, ShieldCheck, Clock, Check } from 'lucide-react';
import { RoommateProfile } from '../types';

interface RoommateCardProps {
  roommate: RoommateProfile;
  isSaved?: boolean;
  onToggleSave?: (roommate: RoommateProfile) => void;
  onViewCompatibility?: (roommate: RoommateProfile) => void;
  onSendRequest?: (roommate: RoommateProfile) => void;
  matchScore?: number;
  ar2mScore?: number;
  predictedScore?: number;
}

export const RoommateCard: React.FC<RoommateCardProps> = ({
  roommate,
  isSaved = false,
  onToggleSave,
  onViewCompatibility,
  onSendRequest,
  matchScore,
  ar2mScore,
  predictedScore
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 space-y-4 group">
      
      {/* Top Header: Avatar, Name & Save */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={roommate.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={roommate.displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm"
              loading="lazy"
            />
            <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow">
              <ShieldCheck className="w-4 h-4 text-teal-600 fill-teal-50" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                {roommate.displayName}
              </h3>
              {roommate.age && (
                <span className="text-xs text-slate-400 font-medium">({roommate.age})</span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 line-clamp-1">
              {roommate.occupation} {roommate.college ? `• ${roommate.college}` : ''}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Prefers: {roommate.preferredLocality ? `${roommate.preferredLocality}, ` : ''}{roommate.preferredCity}</span>
            </div>
          </div>
        </div>

        {/* Save button & Match Score */}
        <div className="flex flex-col items-end gap-1.5">
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(roommate)}
              className={`p-2 rounded-full border transition-colors ${
                isSaved 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600'
              }`}
              title="Save roommate"
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600' : ''}`} />
            </button>
          )}

          {matchScore !== undefined && (
            <div className="flex flex-col items-end">
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-lg bg-teal-50 text-teal-800 border border-teal-200 shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span>{matchScore}% Match</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Budget & Key Preferences Summary */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget Range</span>
          <p className="font-bold text-slate-800">
            ₹{roommate.budgetMin.toLocaleString()} - ₹{roommate.budgetMax.toLocaleString()}/mo
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Diet Preference</span>
          <p className="font-semibold text-slate-700 capitalize">
            {roommate.foodPreference}
          </p>
        </div>
      </div>

      {/* Routine & Lifestyle Badges */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-100/70 text-slate-700">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">Sleep: ~{roommate.sleepTime}</span>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-100/70 text-slate-700">
          <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate capitalize">{roommate.cleanliness} clean</span>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-100/70 text-slate-700">
          <span className="truncate capitalize">{roommate.noiseTolerance} noise tol.</span>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-100/70 text-slate-700">
          <span className="truncate capitalize">{roommate.smokingPreference.replace(/-/g, ' ')}</span>
        </div>
      </div>

      {/* Bio excerpt */}
      {roommate.bio && (
        <p className="text-xs text-slate-500 italic line-clamp-2">
          "{roommate.bio}"
        </p>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
        {onViewCompatibility && (
          <button
            onClick={() => onViewCompatibility(roommate)}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Compatibility
          </button>
        )}

        {onSendRequest && (
          <button
            onClick={() => onSendRequest(roommate)}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Connect
          </button>
        )}
      </div>

    </div>
  );
};
