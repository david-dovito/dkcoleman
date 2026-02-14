'use client';

import { TextType } from '@/components/ui/text-type';
import { BlurText } from '@/components/ui/blur-text';
import { ProfileCard } from '@/components/ui/profile-card';
import { Cpu, Code2, Sparkles, Mail } from 'lucide-react';
import { openSignupPopup } from '@/components/ui/signup-popup';
import type { AboutData } from '@/lib/about';

function MultiParagraph({ text }: { text: string }) {
  const paragraphs = text.split('\n\n').filter(Boolean);
  if (paragraphs.length <= 1) {
    return <BlurText text={text} duration={1200} />;
  }
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

const cardBase = "p-8 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group";

function BottomBar() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1">
      <div className="h-full w-0 bg-gradient-to-r from-fern-500 to-fern-600 group-hover:w-full transition-all duration-500 mx-auto" />
    </div>
  );
}

export default function AboutClient({ data }: { data: AboutData }) {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <header className="mb-12 text-center space-y-4 pt-8">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/50 to-primary bg-clip-text text-transparent">
          ABOUT
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto backdrop-blur-sm">
          A bit about who I am, what I do, and what drives me.
        </p>
      </header>

      <div className="space-y-6">
        {/* Row 1: Intro (2/3) + Photo (1/3), matching height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${cardBase} flex flex-col lg:col-span-2`}>
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                <TextType text="Introduction" speed={80} />
              </h2>
              <div className="text-lg text-muted-foreground leading-relaxed">
                <MultiParagraph text={data.introduction} />
              </div>
            </div>
            <BottomBar />
          </div>

          {/* Desktop: profile card matching intro height */}
          <div className="hidden lg:flex items-stretch">
            <div className="w-full flex items-center justify-center">
              <ProfileCard
                name="David Coleman"
                avatarUrl="/profile.jpg"
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={true}
                linkedinUrl="https://www.linkedin.com/in/dkcoleman23/"
                instagramUrl="https://www.instagram.com/dkcoleman23/"
                xUrl="https://x.com/dkcoleman23"
                githubUrl="https://github.com/david-dovito"
                className="w-full"
              />
            </div>
          </div>

          {/* Mobile: profile card below intro */}
          <div className="flex justify-center lg:hidden">
            <ProfileCard
              name="David Coleman"
              avatarUrl="/profile.jpg"
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={true}
              linkedinUrl="https://www.linkedin.com/in/dkcoleman23/"
              instagramUrl="https://www.instagram.com/dkcoleman23/"
              xUrl="https://x.com/dkcoleman23"
              githubUrl="https://github.com/david-dovito"
            />
          </div>
        </div>

        {/* Row 2: What I Do (1/2) + This Website (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardBase} flex flex-col`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-fern-500/10 text-fern-600">
                  <Cpu size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  <TextType text="What I Do" speed={80} />
                </h2>
              </div>
              <div className="text-muted-foreground leading-relaxed">
                <MultiParagraph text={data.whatIDo} />
              </div>
            </div>
            <BottomBar />
          </div>

          <div className={`${cardBase} flex flex-col`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-fern-500/10 text-fern-600">
                  <Code2 size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  <TextType text="This Website" speed={80} />
                </h2>
              </div>
              <div className="text-muted-foreground leading-relaxed">
                <MultiParagraph text={data.thisWebsite} />
              </div>
            </div>
            <BottomBar />
          </div>
        </div>

        {/* Row 3: The 1159 (full width) */}
        {data.the1159 && (
          <div className={cardBase}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-fern-500/10 text-fern-600">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  <TextType text="The 1159" speed={80} />
                </h2>
              </div>
              <div className="text-lg text-muted-foreground leading-relaxed mb-8">
                <MultiParagraph text={data.the1159} />
              </div>
              <button
                onClick={openSignupPopup}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-fern-500 text-white font-medium hover:bg-fern-400 transition-all duration-300 hover:shadow-lg hover:shadow-fern-500/25 hover:-translate-y-0.5"
              >
                <Mail size={18} />
                Get the Weekly Email
              </button>
            </div>
            <BottomBar />
          </div>
        )}
      </div>
    </div>
  );
}
