import { MeetForm } from '@/components/meet/meet-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet | David Coleman',
  description: "Schedule a meeting with David Coleman.",
};

export default function MeetPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <MeetForm mode="new" />
    </div>
  );
}
