import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { useTheme } from './ThemeProvider';

export interface TourStep {
    /** CSS selector for the target element to highlight */
    target?: string;
    /** Title of the step (bilingual) */
    title_en: string;
    title_ar: string;
    /** Description of the step (bilingual) */
    desc_en: string;
    desc_ar: string;
    /** Optional placement: top, bottom, left, right */
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
    /** Unique key for localStorage persistence */
    tourKey: string;
    /** Array of tour steps */
    steps: TourStep[];
    /** Whether to show the tour */
    active?: boolean;
    /** Callback when tour is completed or dismissed */
    onComplete?: () => void;
}

export default function GuidedTour({ tourKey, steps, active = true, onComplete }: GuidedTourProps) {
    const { language } = useTheme();
    const isAr = language === 'ar';
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Check if tour was already completed
    useEffect(() => {
        const completed = localStorage.getItem(`tour_${tourKey}`);
        if (!completed && active && steps.length > 0) {
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [tourKey, active, steps.length]);

    // Position the tooltip near the target element
    useEffect(() => {
        if (!visible || !steps[currentStep]?.target) {
            setTargetRect(null);
            return;
        }
        const el = document.querySelector(steps[currentStep].target!);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setTargetRect(null);
        }
    }, [visible, currentStep, steps]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    }, [currentStep, steps.length]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    }, [currentStep]);

    const handleComplete = useCallback(() => {
        localStorage.setItem(`tour_${tourKey}`, 'true');
        setVisible(false);
        onComplete?.();
    }, [tourKey, onComplete]);

    const handleSkip = useCallback(() => {
        localStorage.setItem(`tour_${tourKey}`, 'true');
        setVisible(false);
        onComplete?.();
    }, [tourKey, onComplete]);

    if (!visible || steps.length === 0) return null;

    const step = steps[currentStep];
    const placement = step.placement || 'bottom';

    // Calculate tooltip position
    let tooltipStyle: React.CSSProperties = {};
    if (targetRect) {
        switch (placement) {
            case 'bottom':
                tooltipStyle = { top: targetRect.bottom + 16, left: Math.max(16, targetRect.left + targetRect.width / 2 - 180) };
                break;
            case 'top':
                tooltipStyle = { bottom: window.innerHeight - targetRect.top + 16, left: Math.max(16, targetRect.left + targetRect.width / 2 - 180) };
                break;
            case 'left':
                tooltipStyle = { top: targetRect.top + targetRect.height / 2 - 80, right: window.innerWidth - targetRect.left + 16 };
                break;
            case 'right':
                tooltipStyle = { top: targetRect.top + targetRect.height / 2 - 80, left: targetRect.right + 16 };
                break;
        }
    } else {
        // Center on screen if no target
        tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Overlay */}
                    <motion.div
                        ref={overlayRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]"
                        onClick={handleSkip}
                    >
                        {/* Spotlight hole for target element */}
                        {targetRect && (
                            <div
                                className="absolute border-2 border-blue-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                                style={{
                                    top: targetRect.top - 8,
                                    left: targetRect.left - 8,
                                    width: targetRect.width + 16,
                                    height: targetRect.height + 16,
                                }}
                            />
                        )}
                    </motion.div>

                    {/* Tooltip Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="fixed z-[9999] w-[360px] max-w-[calc(100vw-32px)]"
                        style={tooltipStyle}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                            {/* Header with RARE image */}
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0 border-2 border-white/30">
                                    <img src={ASSETS.RARE_AGENT} alt="RARE" className="w-full h-full object-cover" {...IMAGE_PROPS} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-yellow-300" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">RARE Guide</span>
                                    </div>
                                    <h3 className="text-white font-bold text-sm truncate">
                                        {isAr ? step.title_ar : step.title_en}
                                    </h3>
                                </div>
                                <button onClick={handleSkip} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-4">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {isAr ? step.desc_ar : step.desc_en}
                                </p>
                            </div>

                            {/* Footer with navigation */}
                            <div className="px-4 pb-4 flex items-center justify-between">
                                {/* Progress indicator */}
                                <div className="flex items-center gap-1">
                                    {steps.map((_, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-blue-600' : i < currentStep ? 'bg-blue-400' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                                    ))}
                                </div>

                                {/* Step counter */}
                                <span className="text-[10px] text-zinc-400 font-mono">
                                    {currentStep + 1}/{steps.length}
                                </span>

                                {/* Buttons */}
                                <div className="flex items-center gap-2">
                                    {currentStep > 0 && (
                                        <button onClick={handlePrev} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                                            <ChevronLeft size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                                    >
                                        {currentStep === steps.length - 1
                                            ? (isAr ? 'تم' : 'Done')
                                            : (isAr ? 'التالي' : 'Next')}
                                        {currentStep < steps.length - 1 && <ChevronRight size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Reset a specific tour so it shows again
export function resetTour(tourKey: string) {
    localStorage.removeItem(`tour_${tourKey}`);
}

// Reset all tours
export function resetAllTours() {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tour_')) localStorage.removeItem(key);
    });
}
