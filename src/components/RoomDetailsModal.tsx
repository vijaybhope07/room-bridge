import React, { useState } from 'react';
import { X, MapPin, Calendar, Check, Phone, ShieldCheck, Heart, UserCheck, Sparkles } from 'lucide-react';
import { Room } from '../types';

interface RoomDetailsModalProps {
  room: Room | null;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (room: Room) => void;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  onClose,
  isSaved = false,
  onToggleSave
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [contactRevealed, setContactRevealed] = useState(false);

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              {room.city} • {room.locality}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 line-clamp-1">
              {room.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(room)}
                className={`p-2 rounded-lg border transition-colors ${
                  isSaved
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600'
                }`}
                title="Save room"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Photo Gallery */}
          <div className="space-y-2">
            <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={room.imageUrls[activeImageIndex] || room.imageUrls[0]}
                alt={room.title}
                className="w-full h-full object-cover"
              />
            </div>

            {room.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {room.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-teal-600 scale-95' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Monthly Rent</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">₹{room.rent.toLocaleString()}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Security Deposit</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">₹{room.deposit.toLocaleString()}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Room Type</span>
              <p className="text-sm font-bold text-slate-900 mt-1">{room.roomType}</p>
              <p className="text-[10px] text-slate-500">{room.bhk}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Distance</span>
              <p className="text-sm font-bold text-teal-700 mt-1">{room.distanceKm} km</p>
              <p className="text-[10px] text-slate-500">From prime college/hub</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1.5">Property Overview</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {room.description}
            </p>
          </div>

          {/* Amenities Checklist */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">Amenities & Inclusions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {room.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host & Verification Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400">
                {room.ownerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm">{room.ownerName}</p>
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xs text-slate-400">Verified Listing Host</p>
              </div>
            </div>

            <button
              onClick={() => setContactRevealed(!contactRevealed)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              {contactRevealed ? (room.ownerPhone || '+91 98201 44521') : 'Contact Host'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
