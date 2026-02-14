'use client';

import { TextType } from '@/components/ui/text-type';
import { BlurText } from '@/components/ui/blur-text';
import { ProfileCard } from '@/components/ui/profile-card';
import { Cpu, Code2, Sparkles } from 'lucide-react';
import type { AboutData } from '@/lib/about';

interface AboutClientProps {
  data: AboutData;
}

export default function AboutClient({ data }: AboutClientProps) {
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

      <div className="space-y-8 lg:space-y-0">
        {/* On mobile: stack everything, On desktop: bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Intro Card - Wide */}
          <div className="md:col-span-2 p-8 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  <TextType text="Introduction" speed={80} />
                </h2>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                <BlurText
                  text={data.introduction}
                  duration={1200}
                />
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div className="h-full w-0 bg-primary group-hover:w-full transition-all duration-500 mx-auto" />
            </div>
          </div>

          {/* Profile Card - Hidden on mobile, shown on desktop in bento grid */}
          <div className="hidden lg:flex lg:row-span-2 items-start justify-center">
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

          {/* What I Do Card */}
          <div className="p-8 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Cpu size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                <TextType text="What I Do" speed={80} />
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed">
              <BlurText
                text={data.whatIDo}
                duration={1200}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div className="h-full w-0 bg-primary group-hover:w-full transition-all duration-500 mx-auto" />
            </div>
          </div>

          {/* This Website Card */}
          <div className="p-8 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Code2 size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                <TextType text="This Website" speed={80} />
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed">
              <BlurText
                text={data.thisWebsite}
                duration={1200}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div className="h-full w-0 bg-primary group-hover:w-full transition-all duration-500 mx-auto" />
            </div>
          </div>
        </div>

        {/* The 1159 - Full width block matching intro style */}
        {data.the1159 && (
          <div className="mt-6 lg:mt-8">
            <div className="md:col-span-full p-8 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    <TextType text="The 1159" speed={80} />
                  </h2>
                </div>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  <BlurText
                    text={data.the1159}
                    duration={1200}
                  />
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1">
                <div className="h-full w-0 bg-primary group-hover:w-full transition-all duration-500 mx-auto" />
              </div>
            </div>
          </div>
        )}

        {/* Profile Card - Centered Below on Mobile Only */}
        <div className="flex justify-center pt-8 lg:hidden">
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
    </div>
  );
}
