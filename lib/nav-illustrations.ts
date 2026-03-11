// Deterministic SVG illustrations for navigation menu items
// Uses fern accent (#588157) and the same aesthetic as lib/svg-generator.ts

const FERN = '#588157';
const FERN_DIM = '#58815730';

export function blogIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="6" width="32" height="36" rx="3" stroke="${FERN}" stroke-width="1.5" opacity="0.6"/>
    <line x1="14" y1="14" x2="34" y2="14" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <line x1="14" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
    <line x1="14" y1="26" x2="32" y2="26" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
    <line x1="14" y1="32" x2="24" y2="32" stroke="${FERN}" stroke-width="1.5" opacity="0.5"/>
  </svg>`;
}

export function projectsIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <rect x="26" y="10" width="16" height="12" rx="2" stroke="${FERN}" stroke-width="1.5" opacity="0.6"/>
    <rect x="6" y="26" width="16" height="12" rx="2" stroke="${FERN}" stroke-width="1.5" opacity="0.4"/>
    <rect x="26" y="26" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
    <circle cx="34" cy="16" r="2" fill="${FERN}" opacity="0.6"/>
  </svg>`;
}

export function resourcesIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12 L24 8 L36 12" stroke="${FERN}" stroke-width="1.5" opacity="0.5" fill="none"/>
    <circle cx="12" cy="20" r="3" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <circle cx="24" cy="18" r="3" stroke="${FERN}" stroke-width="1.5" opacity="0.6"/>
    <circle cx="36" cy="20" r="3" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <line x1="12" y1="23" x2="12" y2="36" stroke="currentColor" stroke-width="1" opacity="0.15"/>
    <line x1="24" y1="21" x2="24" y2="36" stroke="${FERN}" stroke-width="1" opacity="0.3"/>
    <line x1="36" y1="23" x2="36" y2="36" stroke="currentColor" stroke-width="1" opacity="0.15"/>
  </svg>`;
}

export function aboutIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="16" r="6" stroke="${FERN}" stroke-width="1.5" opacity="0.6"/>
    <path d="M12 38 C12 30 18 26 24 26 C30 26 36 30 36 38" stroke="currentColor" stroke-width="1.5" opacity="0.25" fill="none"/>
    <circle cx="24" cy="16" r="2" fill="${FERN}" opacity="0.4"/>
  </svg>`;
}

export function contactIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="12" width="36" height="24" rx="3" stroke="${FERN}" stroke-width="1.5" opacity="0.5"/>
    <path d="M6 15 L24 27 L42 15" stroke="${FERN}" stroke-width="1.5" opacity="0.4" fill="none"/>
    <circle cx="36" cy="14" r="4" fill="${FERN}" opacity="0.3"/>
  </svg>`;
}

export function weddingIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 36 C16 28 10 22 10 16 C10 12 13 8 17 8 C20 8 22 10 24 13 C26 10 28 8 31 8 C35 8 38 12 38 16 C38 22 32 28 24 36Z" stroke="${FERN}" stroke-width="1.5" opacity="0.5" fill="${FERN_DIM}"/>
  </svg>`;
}

export function signupIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="14" stroke="${FERN}" stroke-width="1.5" opacity="0.4"/>
    <text x="24" y="29" text-anchor="middle" font-size="14" font-weight="bold" fill="${FERN}" opacity="0.7">11:59</text>
  </svg>`;
}

export function meetIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="32" height="32" rx="4" stroke="${FERN}" stroke-width="1.5" opacity="0.5"/>
    <line x1="8" y1="16" x2="40" y2="16" stroke="${FERN}" stroke-width="1" opacity="0.3"/>
    <circle cx="18" cy="12" r="1.5" fill="${FERN}" opacity="0.5"/>
    <circle cx="30" cy="12" r="1.5" fill="${FERN}" opacity="0.5"/>
    <rect x="14" y="22" width="6" height="5" rx="1" fill="${FERN}" opacity="0.3"/>
    <rect x="22" y="22" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1" opacity="0.2"/>
    <rect x="30" y="22" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1" opacity="0.2"/>
    <rect x="14" y="30" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1" opacity="0.2"/>
    <rect x="22" y="30" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1" opacity="0.2"/>
  </svg>`;
}

export function resumeIllustration(): string {
  return `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="6" width="28" height="36" rx="2" stroke="${FERN}" stroke-width="1.5" opacity="0.5"/>
    <circle cx="24" cy="16" r="4" stroke="${FERN}" stroke-width="1.5" opacity="0.4"/>
    <line x1="16" y1="24" x2="32" y2="24" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
    <line x1="16" y1="29" x2="32" y2="29" stroke="currentColor" stroke-width="1" opacity="0.2"/>
    <line x1="16" y1="33" x2="28" y2="33" stroke="currentColor" stroke-width="1" opacity="0.2"/>
    <line x1="16" y1="37" x2="24" y2="37" stroke="${FERN}" stroke-width="1" opacity="0.3"/>
  </svg>`;
}

export const navIllustrations = {
  blog: blogIllustration,
  projects: projectsIllustration,
  resources: resourcesIllustration,
  about: aboutIllustration,
  contact: contactIllustration,
  wedding: weddingIllustration,
  signup: signupIllustration,
  meet: meetIllustration,
  resume: resumeIllustration,
} as const;
