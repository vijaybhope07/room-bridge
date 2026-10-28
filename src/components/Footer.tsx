import React from 'react';
import { Home, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight">RoomBridge</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Smart Room &amp; Roommate Recommendation System for college students and working professionals. Combining intelligent preference filtering with multi-attribute compatibility scoring.
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              Final Year Engineering Capstone Project
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Explore Platforms</h4>
            <ul className="space-y-2">
              <li><Link to="/rooms" className="hover:text-white transition-colors">Find a Room</Link></li>
              <li><Link to="/roommates" className="hover:text-white transition-colors">Find a Roommate</Link></li>
              <li><Link to="/questionnaire" className="hover:text-white transition-colors">AR²M Compatibility Calibration</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Saved Accommodations</Link></li>
            </ul>
          </div>

          {/* Col 3: System Technology */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">System Architecture</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                AR²M Multi-Attribute Recommendation Model
              </li>
              <li>Multi-Attribute Utility Theory (MAUT)</li>
              <li>Jaccard Metric for Amenities &amp; Hobbies</li>
              <li>Cleanliness &amp; Noise Variance Scoring</li>
              <li>Sleep Schedule Alignment Delta &Delta;t</li>
              <li>Google OAuth &amp; Firebase Session Sync</li>
            </ul>
          </div>

          {/* Col 4: Trust & Ethics */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Security &amp; Ethics</h4>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" /> Privacy-First Design
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                No personal contact details or exact home addresses are exposed without consented requests.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <p>© 2026 RoomBridge. Phase 1 Evaluation (40% Milestone Scope).</p>
          <div className="flex items-center gap-4">
            <span className="text-teal-400">AR²M Compatibility Engine Active</span>
            <span>•</span>
            <span>REST API Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
