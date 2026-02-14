'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, MapPin, Globe, Linkedin, ChevronDown } from 'lucide-react';
import { FallInText } from '@/components/ui/fall-in-text';
import { BlurText } from '@/components/ui/blur-text';
import { TextType } from '@/components/ui/text-type';

// ── Scroll-triggered fade-in wrapper ──
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// ── Glass card wrapper ──
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-border/30 bg-background/40 backdrop-blur-xl p-6 md:p-8 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
}

// ── Section heading ──
function SectionHeading({ children, delay = 0 }: { children: string; delay?: number }) {
    return (
        <Reveal delay={delay}>
            <h2 className="text-2xl font-bold tracking-tight mb-6">
                <TextType text={children} speed={40} />
            </h2>
        </Reveal>
    );
}

// ── Expandable experience card ──
function ExperienceCard({ title, company, meta, description, achievements, defaultOpen = false, delay = 0 }: {
    title: string;
    company: string;
    meta: string;
    description: string;
    achievements?: string[];
    defaultOpen?: boolean;
    delay?: number;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [open, hasMounted]);

    return (
        <Reveal delay={delay}>
            <GlassCard className="group cursor-pointer" >
                <div onClick={() => achievements?.length ? setOpen(!open) : null}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="text-lg font-semibold text-foreground mb-1">
                                <span className="text-fern dark:text-dry_sage font-bold">{company}</span>
                                <span className="text-muted-foreground font-normal"> — {title}</span>
                            </div>
                            <div className="text-sm text-muted-foreground/70 italic">{meta}</div>
                        </div>
                        {achievements && achievements.length > 0 && (
                            <div className={`p-1.5 rounded-full bg-muted/50 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mt-3">{description}</p>
                </div>

                {achievements && achievements.length > 0 && (
                    <div
                        className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ maxHeight: open ? (contentHeight === 'auto' ? 'none' : `${contentHeight}px`) : '0px', opacity: open ? 1 : 0 }}
                    >
                        <div ref={contentRef}>
                            <div className="h-px bg-border/50 my-4" />
                            <ul className="space-y-3">
                                {achievements.map((item, i) => (
                                    <li
                                        key={i}
                                        className="relative pl-5 text-muted-foreground leading-relaxed text-sm before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:bg-fern dark:before:bg-dry_sage before:rounded-full"
                                        dangerouslySetInnerHTML={{ __html: item }}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </GlassCard>
        </Reveal>
    );
}

// ── Contact items ──
const contactItems = [
    { icon: MapPin, label: 'Windsor, CO', href: 'https://www.google.com/maps/search/?api=1&query=Windsor,+CO' },
    { icon: Mail, label: 'david@dkcoleman.com', href: 'mailto:david@dkcoleman.com' },
    { icon: Linkedin, label: 'linkedin.com/in/dkcoleman23', href: 'https://linkedin.com/in/dkcoleman23' },
    { icon: Globe, label: 'dkcoleman.com', href: 'https://dkcoleman.com' },
];

// ── Competencies ──
const competencies = [
    { title: 'Team Leadership', desc: 'Building ownership, coaching & mentoring, performance development' },
    { title: 'Operational Excellence', desc: 'Budget management, workflow design, technology implementation' },
    { title: 'Knowledge Retention', desc: 'Process documentation, transition management, building resilience not dependency' },
    { title: 'Systems Integration', desc: 'Platform integration, process automation, data analysis' },
    { title: 'Change Management', desc: 'Leading teams through transitions, cultural alignment, validation-first approach' },
    { title: 'Process Optimization', desc: 'Eliminating waste, improving efficiency, proving concepts before full commitment' },
];

// ── Philosophy ──
const philosophy = [
    'Systems run the business, people run the systems — build for people first.',
    'Technology should deepen relationships, not replace them.',
    'Lead from the ground up. Leadership is daily actions, not titles.',
    'Validate before committing full resources. Prove concepts, reduce rework.',
    'Pass forward what others invested in you. Develop the next generation.',
];

// ── Main component ──
export default function ResumeClient() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* ── Header ── */}
            <Reveal>
                <GlassCard className="relative overflow-hidden !p-0">
                    <div className="bg-gradient-to-br from-pine_teal to-hunter_green dark:from-pine_teal/90 dark:to-hunter_green/80 text-white p-8 md:p-12 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-[30%] -translate-y-[30%] pointer-events-none" />
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 relative z-10">
                            <FallInText text="David Coleman" duration={800} />
                        </h1>
                        <div className="text-lg text-[#8fc0a9] font-medium mb-6 relative z-10">
                            <BlurText text="Operations Manager | Team Leader | Systems Integrator" delay={300} duration={1000} />
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 relative z-10">
                            {contactItems.map(({ icon: Icon, label, href }, i) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-zinc-300 hover:text-[#8fc0a9] transition-all duration-300 hover:translate-x-0.5"
                                    style={{ opacity: 0, animation: `fadeSlideIn 0.5s ease-out ${600 + i * 100}ms forwards` }}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </a>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </Reveal>

            {/* ── Professional Summary ── */}
            <div>
                <SectionHeading>Professional Summary</SectionHeading>
                <Reveal delay={100}>
                    <GlassCard>
                        <p className="text-muted-foreground leading-relaxed text-[1.05rem]">
                            <BlurText
                                text="Over the past 8 years I've discovered and validated where I create the most impact: developing teams through operational transformation. To me, systems and technology aren't about replacing people. They're tools to deepen relationships and free teams to do their best work. As a fast learner, I've grown from web development to operations leadership and consulting. I thrive under pressure, lead from the ground up, and I'm excited to further develop operational excellence locally in Colorado."
                                delay={200}
                                duration={1200}
                            />
                        </p>
                    </GlassCard>
                </Reveal>
            </div>

            {/* ── Experience ── */}
            <div>
                <SectionHeading>Experience</SectionHeading>
                <div className="space-y-4">
                    <ExperienceCard
                        company="The Coffee Collective (Coffee House 29)"
                        title="Director of Operations"
                        meta="May 2022 – Aug 2023 | Windsor, CO"
                        description="I was brought in to lead operations during an aggressive expansion: 4 brands, 2 acquisitions, 2 brick-and-mortar locations, 40+ employees."
                        defaultOpen={true}
                        delay={0}
                        achievements={[
                            '<strong>Prevented 12+ months of knowledge loss:</strong> Three assistant managers came to me planning to resign. After encouraging them in their next steps and supporting them in their transition, I coached them to systematize their roles before leaving. All three stayed 4+ months beyond planned departure, documenting everything and training their replacements.',
                            '<strong>Led team through difficult acquisition:</strong> Integrated second café location while navigating community pushback, technology transitions, and cultural misalignment. I worked hard to keep the team intact through the issues, and we worked hard as a team to stabilize the shop for sale.',
                            '<strong>Learned valuable lessons about validation:</strong> The hard truth is that we rushed an acquisition without proper market research. While I wasn\'t on the final decision-making team, I take full ownership as the Operations Manager at the time. We ultimately sold the location to local investors (now Tradecraft Coffee). That mistake taught me to prove concepts (validate) before committing full resources.',
                            '<strong>Built culture of knowledge transfer:</strong> The first thing I was told when I started was "David, we have a ton of tribal knowledge, and we need to change that". We developed processes as a team to transfer knowledge to new team members, via checklists, SOPs, and other documentation critical to training.',
                        ]}
                    />

                    <ExperienceCard
                        company="Dovito Business Solutions"
                        title="Founder & Principal Consultant"
                        meta="Aug 2023 – Present | Windsor, CO"
                        description="I've built a consulting practice helping service businesses eliminate operational chaos. I've worked with companies across concrete resurfacing, septic management, and prefab manufacturing. Dovito = Discover Opportunity, Validate Ideas, Transform Organizations."
                        delay={100}
                        achievements={[
                            '<strong>Systems integration:</strong> We focus on working with what\'s there and building efficiency into the current framework. It\'s critical that we don\'t go in swinging hammers and creating all new systems.',
                            '<strong>We fail fast and iterate:</strong> Instead of spending months planning the perfect system, we build small, test quickly, and adjust based on what actually works in the field.',
                            '<strong>Support operational expansion through technology planning:</strong> When companies are ready to scale, we help them understand what technology infrastructure they need before they grow, not after.',
                            'Connected disconnected platforms (CRM, IMS, PMS, accounting) so teams could actually see their full operational picture without having to learn entirely new systems.',
                            'Led internship program mentoring emerging professionals through real projects. Most satisfying work of my career because it\'s passing forward what others invested in me.',
                            '<em>This continues as a side consulting business that I run with referral-based clients only.</em>',
                        ]}
                    />

                    <ExperienceCard
                        company="LP LLC Feature Film Production"
                        title="Transportation Captain"
                        meta="Nov 2021 – Dec 2021 | Estes Park, CO"
                        description="I led transportation logistics for a 5-week, $3M feature film in Estes Park. Coordinated transportation for cast, crew, and equipment from LA to Estes Park."
                        delay={200}
                        achievements={[
                            '<strong>A Glimpse Inside:</strong> A 36-hour workday. Equipment breakdowns. Weather delays. I thrived on the pressure and challenge of the role over the holiday season. I implemented team meetings, rotating schedules, and coordinated with Locations Management to ensure we had minimal delays.',
                            '<strong>What I learned:</strong> Leadership is infinitely more than a title — it\'s daily actions and intentional communication, especially when it\'s hardest, that build a team who will go the distance with you.',
                        ]}
                    />

                    <ExperienceCard
                        company="DKC Strategic LLC"
                        title="Freelance Contractor"
                        meta="2019 – 2023 | Windsor, CO"
                        description="I operated DKC Strategic as my freelancing entity, contracting with multiple clients including Ellerslie Training and Mark Sharman CPA. This served as the foundation for learning across marketing, production, A/V consulting, and web development — experience that ultimately led to operations management and founding Dovito."
                        delay={300}
                    />

                    <ExperienceCard
                        company="G-Man Graphics, LLC"
                        title="Website Developer"
                        meta="Oct 2017 – Mar 2021 | Greeley, CO"
                        description="I started as freelance video editor doing capture, organization, editing, color correction, and motion graphics work. The owners, Shawn and Gary, had over 50 years combined experience in graphic design."
                        delay={400}
                        achievements={[
                            '<strong>Fast Learning & Growth:</strong> The owners saw how fast I was picking things up and made me an offer to pay for me to learn website development. I took them up on it, learned Bootstrap and WordPress, and started building most of their client websites.',
                            '<strong>Built technical skills:</strong> Took custom designs they\'d created in InDesign, Photoshop, and Illustrator and translated them into functional WordPress sites.',
                            '<strong>Grew into client-facing work:</strong> As I got better at the technical work, they brought me into more client meetings, website delivery, and training clients on their new platforms.',
                            '<strong>What I carry forward:</strong> When people invest in your development like Shawn and Gary did for me, you have a responsibility to pass that forward. That\'s why mentoring others has become such a core part of how I lead now.',
                        ]}
                    />
                </div>
            </div>

            {/* ── Education ── */}
            <div>
                <SectionHeading delay={100}>Education &amp; Leadership</SectionHeading>
                <Reveal delay={150}>
                    <GlassCard>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                <span className="font-semibold text-foreground">Bachelor of Business Administration (BBA)</span>
                                <span className="text-sm text-muted-foreground">Western Governors University (2020 – 2022)</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                <span className="font-semibold text-foreground">Leadership Program of the Rockies Graduate</span>
                                <span className="text-sm text-muted-foreground">Class of 2024</span>
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">Professional Development:</span>{' '}
                                WGU Micro-credentials in Applied Business Skills, Human Resource Management, Business Essentials | Foundations of Leadership Certificate (Sigma Alpha Pi, NSLS)
                            </div>
                        </div>
                    </GlassCard>
                </Reveal>
            </div>

            {/* ── Core Competencies ── */}
            <div>
                <SectionHeading delay={100}>Core Competencies</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {competencies.map((c, i) => (
                        <Reveal key={c.title} delay={i * 80}>
                            <div className="h-full rounded-2xl border border-border/30 bg-background/40 backdrop-blur-xl p-5 hover:border-primary/40 hover:bg-background/60 hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <div className="font-semibold text-foreground mb-1.5">{c.title}</div>
                                <div className="text-sm text-muted-foreground leading-relaxed">{c.desc}</div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* ── Leadership Philosophy ── */}
            <div>
                <SectionHeading delay={100}>Leadership Philosophy</SectionHeading>
                <Reveal delay={150}>
                    <GlassCard>
                        <ul className="space-y-4">
                            {philosophy.map((item, i) => (
                                <li
                                    key={i}
                                    className="relative pl-8 text-muted-foreground leading-relaxed before:content-['✓'] before:absolute before:left-0 before:text-fern dark:before:text-dry_sage before:font-bold before:text-lg hover:pl-9 hover:text-foreground transition-all duration-300"
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </GlassCard>
                </Reveal>
            </div>

            {/* Inline keyframes for contact stagger animation */}
            <style jsx global>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateX(-12px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
