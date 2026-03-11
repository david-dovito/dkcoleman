'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Clock, Calendar, ArrowRight } from 'lucide-react';

type MeetingStatus = 'pending' | 'processing' | 'aligned' | 'not_aligned' | 'scheduled' | 'declined';

interface TimeSlot {
  date: string;
  time: string;
  duration: string;
  calendarLink?: string;
}

interface StatusResponse {
  id: number;
  status: MeetingStatus;
  source: string;
  aiResponse?: {
    message?: string;
    timeSlots?: TimeSlot[];
  };
}

const PROGRESS_MESSAGES = [
  'Reviewing your request...',
  'Checking David\'s calendar...',
  'Finding the best times...',
  'Evaluating priorities...',
  'Almost there...',
];

export function AvailabilityChecker() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  const source = searchParams.get('source') || 'new';

  const [status, setStatus] = useState<MeetingStatus>('pending');
  const [aiResponse, setAiResponse] = useState<StatusResponse['aiResponse']>();
  const [progressIndex, setProgressIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Animate the loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Cycle through progress messages
  useEffect(() => {
    if (status !== 'pending' && status !== 'processing') return;
    const interval = setInterval(() => {
      setProgressIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  // Poll for status updates
  const pollStatus = useCallback(async () => {
    if (!requestId) return;
    try {
      const res = await fetch(`/api/meeting-requests/${requestId}`);
      if (!res.ok) return;
      const data: StatusResponse = await res.json();
      setStatus(data.status);
      if (data.aiResponse) setAiResponse(data.aiResponse);
    } catch {
      // Silently retry
    }
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;
    // Initial poll
    pollStatus();
    // Poll every 3 seconds while pending/processing
    const interval = setInterval(() => {
      if (status === 'pending' || status === 'processing') {
        pollStatus();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [requestId, status, pollStatus]);

  if (!requestId) {
    return (
      <div className="w-full max-w-lg text-center">
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12">
          <p className="text-muted-foreground">No meeting request found.</p>
        </div>
      </div>
    );
  }

  // Aligned — show time slots
  if (status === 'aligned' && aiResponse?.timeSlots && aiResponse.timeSlots.length > 0) {
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fern-500/20">
              <Calendar className="h-7 w-7 text-fern-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Pick a time</h2>
            <p className="text-sm text-muted-foreground">
              {aiResponse.message || 'Here are a few times that work. Choose what suits you best.'}
            </p>
          </div>

          <div className="space-y-3">
            {aiResponse.timeSlots.map((slot, i) => (
              <a
                key={i}
                href={slot.calendarLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-fern-500/50 hover:bg-fern-500/5 transition-all group"
              >
                <div>
                  <div className="font-medium">{slot.date}</div>
                  <div className="text-sm text-muted-foreground">
                    {slot.time} ({slot.duration})
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-fern-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Scheduled — confirmed
  if (status === 'scheduled') {
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-fern-500/20">
            <Check className="h-8 w-8 text-fern-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">You&apos;re booked!</h2>
          <p className="text-muted-foreground">
            Check your email for the calendar invite. Looking forward to it.
          </p>
        </div>
      </div>
    );
  }

  // Not aligned / declined — human follow-up
  if (status === 'not_aligned' || status === 'declined') {
    return (
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Appreciate you reaching out
          </h2>
          <p className="text-muted-foreground">
            {aiResponse?.message ||
              'David will be in touch shortly to schedule a time that works for both of you.'}
          </p>
        </div>
      </div>
    );
  }

  // Pending / processing — loading state
  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12">
        <div className="text-center">
          {/* Animated rings */}
          <div className="relative mx-auto mb-8 h-24 w-24">
            <div className="absolute inset-0 rounded-full border-2 border-fern-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-fern-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
            <div className="absolute inset-4 rounded-full border-2 border-fern-500/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-fern-500 animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            Checking David&apos;s availability{dots}
          </h2>

          <p className="text-sm text-muted-foreground transition-opacity duration-500">
            {PROGRESS_MESSAGES[progressIndex]}
          </p>

          {/* Progress bar */}
          <div className="mt-8 h-1 bg-border/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-fern-500/60 rounded-full transition-all duration-1000"
              style={{
                width: status === 'processing' ? '70%' : '30%',
                animation: 'progressPulse 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
