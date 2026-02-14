import { Metadata } from 'next';
import ResumeClient from '@/components/resume/ResumeClient';
import { getNarrativeSections, NarrativeSection } from '@/lib/resume-narrative';

export const metadata: Metadata = {
    title: "Resume | David Coleman",
    description: "Operations Manager, Team Leader, and Systems Integrator. David Coleman's professional resume.",
};

export default async function ResumePage() {
    const narrativeSections = await getNarrativeSections();

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <ResumeClient narrativeSections={narrativeSections} />
        </div>
    );
}
