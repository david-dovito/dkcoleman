import { AvailabilityChecker } from '@/components/meet/availability-checker';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Booking | David Coleman',
  description: "Checking availability for your meeting with David Coleman.",
};

export default function BookingPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <AvailabilityChecker />
      </Suspense>
    </div>
  );
}
