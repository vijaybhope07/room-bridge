import React from 'react';
import { MapPin, Heart, Wifi, Shield, CheckCircle2, BedSingle, Calendar } from 'lucide-react';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  isSaved?: boolean;
  onToggleSave?: (room: Room) => void;
  onViewDetails?: (room: Room) => void;
  matchScore?: number;
  ar2mScore?: number;
  predictedScore?: number;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSaved = false,
  onToggleSave,
  onViewDetails,
  matchScore,
  ar2mScore,
  predictedScore
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Property Photograph with Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={room.imageUrls[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-900/85 text-white backdrop-blur-sm shadow-sm">
            {room.roomType}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/90 text-slate-800 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            {room.furnishing}
          </span>
        </div>

        {/* Match Score Badge */}
        {matchScore !== undefined && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 shadow-md border border-teal-500/30">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 font-extrabold">{matchScore}% Match</span>
          </div>
        )}

        {/* Save Button */}
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(room);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm ${
              isSaved 
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                : 'bg-white/80 text-slate-600 hover:text-rose-600 hover:bg-white'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save room'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Room Details Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Price & Deposit */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-900">
                ₹{room.rent.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">/month</span>
            </div>
            {room.deposit > 0 && (
              <span className="text-[11px] text-slate-500 font-medium">
                Deposit: ₹{room.deposit.toLocaleString()}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-slate-800 mt-1 line-clamp-1 group-hover:text-teal-700 transition-colors">
            {room.title}
          </h3>

          {/* Location & Distance */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{room.locality}, {room.city}</span>
            <span className="text-slate-300">•</span>
            <span className="shrink-0 text-teal-700 font-semibold">{room.distanceKm} km from hub</span>
          </div>
        </div>

        {/* Amenities Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {room.amenities.slice(0, 3).map((amenity, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
            >
              {amenity}
            </span>
          ))}
          {room.amenities.length > 3 && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">
              +{room.amenities.length - 3} more
            </span>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Available {new Date(room.availabilityDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
          </div>

          {onViewDetails && (
            <button
              onClick={() => onViewDetails(room)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
