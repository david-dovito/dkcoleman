import { IntakeForm } from '@/components/contact/intake-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect | David Coleman',
  description: "Let's connect — schedule a meeting with David Coleman.",
};

export default function ContactPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <IntakeForm />
    </div>
  );
}
