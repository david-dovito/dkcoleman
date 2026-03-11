'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Loader2, AlertCircle, Send } from 'lucide-react';

// ── Constants ──

const REASONS = [
  { value: 'Collaboration', label: 'Collaboration', description: 'Work on something together' },
  { value: 'Consulting', label: 'Consulting', description: 'Get expert guidance' },
  { value: 'Speaking', label: 'Speaking', description: 'Invite me to speak' },
  { value: 'Mentorship', label: 'Mentorship', description: 'Grow with guidance' },
  { value: 'Other', label: 'Other', description: 'Something else entirely' },
] as const;

const TIMEFRAMES = [
  { value: 'This week', label: 'This week' },
  { value: 'Next 2 weeks', label: 'Next 2 weeks' },
  { value: 'This month', label: 'This month' },
  { value: '1-3 months', label: '1\u20133 months' },
  { value: 'Flexible', label: 'Flexible' },
] as const;

const TOTAL_STEPS = 6;

// ── Types ──

interface FormData {
  name: string;
  email: string;
  company: string;
  reason: string;
  preferredTimeframe: string;
  additionalContext: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// ── Component ──

export function IntakeForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    reason: '',
    preferredTimeframe: '',
    additionalContext: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the active input when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step <= 2) {
        inputRef.current?.focus();
      } else if (step === 5) {
        textareaRef.current?.focus();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [step]);

  // ── Validation ──

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 0:
        return formData.name.trim().length > 0;
      case 1:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 2:
        return true; // optional
      case 3:
        return formData.reason !== '';
      case 4:
        return formData.preferredTimeframe !== '';
      case 5:
        return true; // optional
      default:
        return false;
    }
  }, [step, formData]);

  // ── Navigation ──

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1 && canAdvance()) {
      setStep((s) => s + 1);
    }
  }, [step, canAdvance]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (step === TOTAL_STEPS - 1) {
          handleSubmit();
        } else {
          goNext();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, goNext]
  );

  const handleCardSelect = useCallback(
    (field: 'reason' | 'preferredTimeframe', value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Auto-advance after a brief delay for visual feedback
      setTimeout(() => {
        setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
      }, 250);
    },
    []
  );

  // ── Submit ──

  const handleSubmit = async () => {
    if (status === 'submitting') return;
    setErrorMessage('');
    setStatus('submitting');

    try {
      const res = await fetch('/api/meeting-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          reason: formData.reason,
          preferredTimeframe: formData.preferredTimeframe,
          additionalContext: formData.additionalContext.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setStatus('error');
    }
  };

  const retry = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  // ── Render helpers ──

  const renderSelectCards = (
    options: ReadonlyArray<{ value: string; label: string; description?: string }>,
    field: 'reason' | 'preferredTimeframe'
  ) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const selected = formData[field] === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleCardSelect(field, opt.value)}
            className={`rounded-xl border p-4 cursor-pointer text-left transition-all duration-150 ${
              selected
                ? 'border-fern-500 bg-fern-500/10'
                : 'border-border/30 hover:border-fern-500/50'
            }`}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            {opt.description && (
              <span className="block text-xs text-muted-foreground mt-1">{opt.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Success state ──

  if (status === 'success') {
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-fern-500/20">
            <Check className="h-8 w-8 text-fern-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Thanks! I&apos;ll be in touch.
          </h2>
          <p className="text-muted-foreground">
            Expect to hear back within a day or two.
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (status === 'error') {
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">
            {errorMessage}
          </p>
          <button
            onClick={retry}
            className="px-6 py-3 rounded-xl bg-fern-500 text-white font-medium hover:bg-fern-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Step content builder ──

  const stepContent = (i: number) => {
    switch (i) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                What&apos;s your name?
              </h2>
              <p className="text-sm text-muted-foreground">
                So I know who I&apos;m talking to.
              </p>
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              autoComplete="name"
              className="w-full h-12 px-4 rounded-lg text-base bg-transparent border border-border/50
                focus:border-fern-500 focus:outline-none text-foreground
                placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                What&apos;s your email?
              </h2>
              <p className="text-sm text-muted-foreground">
                I&apos;ll use this to follow up.
              </p>
            </div>
            <input
              ref={inputRef}
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              autoComplete="email"
              className="w-full h-12 px-4 rounded-lg text-base bg-transparent border border-border/50
                focus:border-fern-500 focus:outline-none text-foreground
                placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                Where do you work?
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional &mdash; skip if you&apos;d rather not say.
              </p>
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Company or organization"
              value={formData.company}
              onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
              autoComplete="organization"
              className="w-full h-12 px-4 rounded-lg text-base bg-transparent border border-border/50
                focus:border-fern-500 focus:outline-none text-foreground
                placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                What brings you here?
              </h2>
              <p className="text-sm text-muted-foreground">Pick the best fit.</p>
            </div>
            {renderSelectCards(REASONS, 'reason')}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                When works for you?
              </h2>
              <p className="text-sm text-muted-foreground">
                No pressure &mdash; just a rough idea.
              </p>
            </div>
            {renderSelectCards(TIMEFRAMES, 'preferredTimeframe')}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                Anything else to share?
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional &mdash; context helps, but isn&apos;t required.
              </p>
            </div>
            <textarea
              ref={textareaRef}
              placeholder="Tell me more..."
              value={formData.additionalContext}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, additionalContext: e.target.value }))
              }
              rows={4}
              className="w-full min-h-[120px] px-4 py-3 rounded-lg text-base bg-transparent
                border border-border/50 focus:border-fern-500 focus:outline-none text-foreground
                placeholder:text-muted-foreground/40 transition-colors resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  // ── Main form ──

  const isLastStep = step === TOTAL_STEPS - 1;
  const isInputStep = step <= 2 || step === 5;

  return (
    <div className="w-full max-w-lg" onKeyDown={handleKeyDown}>
      <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-8 md:p-12 overflow-hidden">
        {/* Slide container */}
        <div className="relative" style={{ minHeight: '220px' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const isActive = i === step;
            const isPast = i < step;

            return (
              <div
                key={i}
                className="transition-all duration-500 ease-out"
                style={{
                  transform: isPast
                    ? 'translateX(-100%)'
                    : isActive
                      ? 'translateX(0)'
                      : 'translateX(100%)',
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  position: isActive ? 'relative' : 'absolute',
                  top: isActive ? undefined : 0,
                  left: isActive ? undefined : 0,
                  right: isActive ? undefined : 0,
                }}
              >
                {/* Only render content for nearby steps to avoid input conflicts */}
                {Math.abs(i - step) <= 1 && stepContent(i)}
              </div>
            );
          })}
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          <div>
            {isInputStep && (
              <>
                {isLastStep ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === 'submitting'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fern-500
                      hover:bg-fern-600 text-white font-medium transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={step !== 2 && !canAdvance()}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors
                      disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {step === 2 && !formData.company.trim() ? 'Skip' : 'Next'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step
                  ? 'w-6 bg-fern-500'
                  : i === step
                    ? 'w-6 bg-fern-500/60'
                    : 'w-1.5 bg-border/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
