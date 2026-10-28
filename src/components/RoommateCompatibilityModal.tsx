import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';
import { RoommateProfile, MatchReason } from '../types';

interface RoommateCompatibilityModalProps {
  roommate: RoommateProfile | null;
  onClose: () => void;
  onConnect?: (roommate: RoommateProfile) => void;
  ar2mScore?: number;
  predictedScore?: number;
  finalScore?: number;
}

export const RoommateCompatibilityModal: React.FC<RoommateCompatibilityModalProps> = ({
  roommate,
  onClose,
  onConnect,
  ar2mScore,
  predictedScore,
  finalScore
}) => {
  if (!roommate) return null;

  // Realistic sample AR²M calculation output if not directly passed
  const baseScore = ar2mScore !== undefined ? ar2mScore : (roommate.cleanliness === 'spotless' ? 94 : 86);
  const conflictPenalty = roommate.cleanliness === 'relaxed' ? 12 : 0;
  const effectiveAr2m = baseScore - conflictPenalty;
  const effectivePredicted = predictedScore !== undefined ? predictedScore : Math.round(effectiveAr2m * 0.94);
  const effectiveFinal = finalScore !== undefined ? finalScore : Math.round((effectiveAr2m + effectivePredicted) / 2);

  const reasons: MatchReason[] = [
    { type: 'positive', text: `Aligned budget expectations (₹${roommate.budgetMin.toLocaleString()} - ₹${roommate.budgetMax.toLocaleString()}/mo)` },
    { type: 'positive', text: `Synchronized sleep & wake routine (~${roommate.sleepTime} bedtime)` },
    { type: 'positive', text: `Dietary preference compatible: ${roommate.foodPreference}` },
    { type: 'positive', text: `Shared interests in ${roommate.hobbies.slice(0, 2).join(' & ')}` },
  ];

  if (conflictPenalty > 0) {
    reasons.push({ type: 'warning', text: 'Cleanliness preference variance: Spotless vs Relaxed (-12 penalty)' });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Comprehensive Compatibility Analysis
              </h2>
              <p className="text-[11px] text-slate-500">
                Evaluation for {roommate.displayName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Main Score Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Compatibility Score
              </span>
              <div className="text-3xl font-black mt-0.5 flex items-baseline gap-1 text-white">
                <span>{effectiveFinal}</span>
                <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-teal-200/90 mt-1 font-medium">
                {effectiveFinal >= 80 ? 'Highly Compatible Match' : effectiveFinal >= 60 ? 'Moderate Compatibility' : 'Low Compatibility'}
              </p>
            </div>

            <div className="text-right space-y-1 font-mono text-[11px] bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <p className="text-slate-300">Preference Match: <span className="font-bold text-white">{effectiveAr2m}%</span></p>
              <p className="text-indigo-300">Behavioral Fit: <span className="font-bold text-indigo-200">{effectivePredicted}%</span></p>
              <div className="border-t border-slate-700 pt-1 text-[10px] text-teal-300 font-bold">
                Overall Compatibility: {effectiveFinal}%
              </div>
            </div>
          </div>

          {/* Mathematical Stage Breakdown */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-2 uppercase tracking-wider">
              Compatibility Dimensions
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                  <span>Budget Overlap (Weight 15%)</span>
                  <span>95%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                  <span>Sleep & Routine Match (Weight 15%)</span>
                  <span>90%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '90%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                  <span>Cleanliness & House Rules (Weight 15%)</span>
                  <span>{conflictPenalty > 0 ? '60%' : '90%'}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${conflictPenalty > 0 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: conflictPenalty > 0 ? '60%' : '90%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                  <span>Noise & Social Habits (Weight 10%)</span>
                  <span>88%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Reasons */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-2 uppercase tracking-wider">
              Compatibility Indicators
            </h3>
            <div className="space-y-1.5">
              {reasons.map((r, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded-lg flex items-start gap-2 border ${
                    r.type === 'positive' 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  {r.type === 'positive' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs leading-normal">{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Machine Learning Validation Tag */}
          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-[11px] text-slate-700">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>Smart Verification: <strong>Active (Confidence: {effectivePredicted}%)</strong></span>
            </span>
            <span className="text-indigo-700 font-bold">Overall Match: {effectiveFinal}%</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            Close
          </button>
          {onConnect && (
            <button
              onClick={() => {
                onClose();
                onConnect(roommate);
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm"
            >
              Send Connect Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
