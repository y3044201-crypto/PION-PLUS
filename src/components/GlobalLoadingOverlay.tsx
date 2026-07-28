import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Zap, X, CheckCircle2 } from 'lucide-react';

interface GlobalLoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  description?: string;
  smartStatus?: string;
  progress?: number; // 0 to 100, if undefined will simulate
  autoCloseMs?: number;
  onClose?: () => void;
}

const SMART_STEPS = [
  'Initializing...',
  'Connecting...',
  'Encrypting Data...',
  'Loading Resources...',
  'Preparing Dashboard...',
  'Syncing Database...',
  'Almost Ready...'
];

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  isVisible,
  title = 'Processing Request',
  description = 'Please wait while we securely process your request. Everything is encrypted and optimized.',
  smartStatus: customSmartStatus,
  progress: externalProgress,
  autoCloseMs,
  onClose,
}) => {
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [statusIndex, setStatusIndex] = useState<number>(0);

  // Auto close timer when autoCloseMs is specified
  useEffect(() => {
    if (!isVisible || !autoCloseMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isVisible, autoCloseMs, onClose]);

  // Animate progress and smart status when visible
  useEffect(() => {
    if (!isVisible) {
      setCurrentProgress(0);
      setStatusIndex(0);
      return;
    }

    if (typeof externalProgress === 'number') {
      setCurrentProgress(externalProgress);
      return;
    }

    // Auto simulate continuous progress up to 95% until complete
    setCurrentProgress(5);
    const progressInterval = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 95) return 95;
        const bump = Math.floor(Math.random() * 12) + 5;
        return Math.min(95, prev + bump);
      });
    }, 200);

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % SMART_STEPS.length);
    }, 450);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [isVisible, externalProgress]);

  if (!isVisible) return null;

  const displayProgress = typeof externalProgress === 'number' ? externalProgress : currentProgress;
  const currentStatusText = customSmartStatus || SMART_STEPS[statusIndex];
  const isComplete = displayProgress >= 100;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#030712]/75 backdrop-blur-md transition-all duration-300 animate-in fade-in select-none">
      
      {/* Background Ambient Glow Lights */}
      <div className="absolute w-[420px] h-[420px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-cyan-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      {/* Floating Center Glassmorphism 2.0 Modal Popup Card */}
      <div className="relative w-full max-w-[480px] bg-[#0b1226]/90 backdrop-blur-2xl rounded-[28px] p-7 sm:p-9 border border-white/15 shadow-[0_30px_75px_rgba(0,0,0,0.9)] flex flex-col items-center text-center space-y-6 overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
        
        {/* Top subtle light reflection line */}
        <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>

        {/* Optional Manual Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Futuristic Circular Animated Loader */}
        <div className="relative w-20 h-20 flex items-center justify-center my-1">
          {isComplete ? (
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-in zoom-in-75">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
          ) : (
            <>
              {/* Outer Rotating Glowing Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-indigo-500 border-b-purple-600 animate-spin shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
              
              {/* Counter Rotating Ring */}
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-500 border-l-pink-500 animate-[spin_1.5s_linear_infinite_reverse] opacity-70"></div>
              
              {/* Inner Glowing Orb / Pulse Icon */}
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-bounce" />
              </div>
            </>
          )}

          {/* Ambient Loader Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl pointer-events-none"></div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-cyan-400 flex items-center gap-1.5 font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              {currentStatusText}
            </span>
            <span className="text-white font-mono">{Math.round(displayProgress)}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
            ></div>
          </div>
        </div>

      </div>

    </div>,
    document.body
  );
};

