'use client';

import { useEffect, useState } from 'react';
import { MeetForm } from '@/components/meet/meet-form';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  token: string;
}

type TokenState = 'loading' | 'valid' | 'used' | 'expired' | 'not_found';

export function PreapprovedMeet({ token }: Props) {
  const [state, setState] = useState<TokenState>('loading');

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/meeting-tokens/${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setState('valid');
        } else if (data.reason === 'already_used') {
          setState('used');
        } else if (data.reason === 'expired') {
          setState('expired');
        } else {
          setState('not_found');
        }
      } catch {
        setState('not_found');
      }
    }
    validate();
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-fern-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (state === 'used' || state === 'expired' || state === 'not_found') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {state === 'used'
                ? 'Link already used'
                : state === 'expired'
                  ? 'Link expired'
                  : 'Link not found'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {state === 'used'
                ? 'This booking link has already been used. Each link is single-use for security.'
                : state === 'expired'
                  ? 'This booking link has expired.'
                  : 'This booking link is not valid.'}
            </p>
            <Link
              href="/meet"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fern-500 hover:bg-fern-600 text-white font-medium transition-colors"
            >
              Request a new meeting
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <MeetForm mode="preapproved" token={token} />
    </div>
  );
}
