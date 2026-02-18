// Deterministic SVG illustration generator for blog posts
// Black/white + single accent color per tag, minimal geometric motifs

// --- Seeded PRNG (Mulberry32) ---
function createRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// --- Tag Configurations ---
interface TagConfig {
  accent: string;       // Single accent color
  accentDim: string;    // Dimmer version of accent
  motif: 'clock' | 'nodes' | 'rays' | 'grid' | 'circuit' | 'spiral' | 'wave';
}

const TAG_CONFIGS: Record<string, TagConfig> = {
  'The 1159': {
    accent: '#D4A853',
    accentDim: '#D4A83330',
    motif: 'clock',
  },
  Leadership: {
    accent: '#8B5CF6',
    accentDim: '#8B5CF630',
    motif: 'nodes',
  },
  Faith: {
    accent: '#E8B931',
    accentDim: '#E8B93130',
    motif: 'rays',
  },
  Business: {
    accent: '#14B8A6',
    accentDim: '#14B8A630',
    motif: 'grid',
  },
  Technology: {
    accent: '#3B82F6',
    accentDim: '#3B82F630',
    motif: 'circuit',
  },
  Growth: {
    accent: '#F59E0B',
    accentDim: '#F59E0B30',
    motif: 'spiral',
  },
  Life: {
    accent: '#F43F5E',
    accentDim: '#F43F5E30',
    motif: 'wave',
  },
};

const DEFAULT_CONFIG: TagConfig = {
  accent: '#8B8B8B',
  accentDim: '#8B8B8B30',
  motif: 'wave',
};

function getTagConfig(tags: string[]): TagConfig {
  // Skip "The 1159" (series identifier, not a content theme) unless it's the only tag
  const themeTags = tags.filter(t => t !== 'The 1159');
  const tagsToCheck = themeTags.length > 0 ? themeTags : tags;

  for (const tag of tagsToCheck) {
    if (TAG_CONFIGS[tag]) return TAG_CONFIGS[tag];
  }
  return DEFAULT_CONFIG;
}

// --- Motif Generators (minimal, centered, black/white + accent) ---

function generateClockMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const radius = Math.min(w, h) * 0.3;
  let paths = '';

  // Outer circle (thin white)
  paths += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.15"/>`;

  // Tick marks
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isHour = i % 3 === 0;
    const innerR = radius * (isHour ? 0.85 : 0.9);
    const outerR = radius * 0.95;
    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = cy + Math.sin(angle) * innerR;
    const x2 = cx + Math.cos(angle) * outerR;
    const y2 = cy + Math.sin(angle) * outerR;
    paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="${isHour ? 2 : 1}" opacity="${isHour ? 0.4 : 0.2}" stroke-linecap="round"/>`;
  }

  // Minute hand (11:59 → pointing straight up)
  const minuteAngle = (59 / 60) * Math.PI * 2 - Math.PI / 2;
  paths += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(minuteAngle) * radius * 0.7}" y2="${cy + Math.sin(minuteAngle) * radius * 0.7}" stroke="#ffffff" stroke-width="2" opacity="0.6" stroke-linecap="round"/>`;

  // Hour hand (pointing to ~11)
  const hourAngle = (11 / 12 + 59 / 720) * Math.PI * 2 - Math.PI / 2;
  paths += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(hourAngle) * radius * 0.45}" y2="${cy + Math.sin(hourAngle) * radius * 0.45}" stroke="${config.accent}" stroke-width="2.5" opacity="0.8" stroke-linecap="round"/>`;

  // Center dot (accent)
  paths += `<circle cx="${cx}" cy="${cy}" r="3" fill="${config.accent}" opacity="0.9"/>`;

  // Subtle scattered dots
  for (let i = 0; i < 3; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = radius * (1.15 + rng() * 0.3);
    const r = 1 + rng() * 1.5;
    paths += `<circle cx="${cx + Math.cos(angle) * dist}" cy="${cy + Math.sin(angle) * dist}" r="${r}" fill="${config.accent}" opacity="0.2"/>`;
  }

  return paths;
}

function generateNodesMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const nodeCount = 6 + Math.floor(rng() * 3);
  const nodes: { x: number; y: number }[] = [];
  const margin = Math.min(w, h) * 0.15;

  // Generate ascending nodes (bottom-left to top-right)
  for (let i = 0; i < nodeCount; i++) {
    const progress = i / (nodeCount - 1);
    const x = margin + progress * (w - margin * 2) + (rng() - 0.5) * w * 0.1;
    const y = h - margin - progress * (h - margin * 2) + (rng() - 0.5) * h * 0.08;
    nodes.push({ x, y });
  }

  // Draw connections (thin white lines)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(w, h) * 0.4;
      if (dist < maxDist) {
        const opacity = 0.06 + (1 - dist / maxDist) * 0.1;
        paths += `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="#ffffff" stroke-width="1" opacity="${opacity}"/>`;
      }
    }
  }

  // Draw nodes
  nodes.forEach((node, i) => {
    const isAccent = i === nodeCount - 1 || rng() > 0.7;
    const r = 3 + rng() * 2;
    if (isAccent) {
      paths += `<circle cx="${node.x}" cy="${node.y}" r="${r}" fill="${config.accent}" opacity="0.7"/>`;
    } else {
      paths += `<circle cx="${node.x}" cy="${node.y}" r="${r}" fill="#ffffff" opacity="0.25"/>`;
    }
    // Inner bright dot
    paths += `<circle cx="${node.x}" cy="${node.y}" r="${r * 0.35}" fill="#ffffff" opacity="0.5"/>`;
  });

  return paths;
}

function generateRaysMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const cx = w * 0.5;
  const cy = h * 0.55;
  const maxLen = Math.min(w, h) * 0.4;

  // Radiating lines from center
  const rayCount = 18 + Math.floor(rng() * 6);
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const length = maxLen * (0.4 + rng() * 0.6);
    const isAccent = rng() > 0.75;
    const opacity = isAccent ? 0.3 + rng() * 0.2 : 0.08 + rng() * 0.1;
    const color = isAccent ? config.accent : '#ffffff';
    const strokeW = isAccent ? 1.5 : 0.75;
    const x2 = cx + Math.cos(angle) * length;
    const y2 = cy + Math.sin(angle) * length;
    paths += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeW}" opacity="${opacity}" stroke-linecap="round"/>`;
  }

  // Central glow (accent)
  paths += `<circle cx="${cx}" cy="${cy}" r="8" fill="${config.accent}" opacity="0.25"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="3" fill="${config.accent}" opacity="0.6"/>`;

  return paths;
}

function generateGridMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const cols = 8;
  const rows = 4;
  const margin = Math.min(w, h) * 0.12;
  const cellW = (w - margin * 2) / cols;
  const cellH = (h - margin * 2) / rows;

  // Thin grid lines
  for (let i = 0; i <= cols; i++) {
    const x = margin + i * cellW;
    paths += `<line x1="${x}" y1="${margin}" x2="${x}" y2="${h - margin}" stroke="#ffffff" stroke-width="0.5" opacity="0.08"/>`;
  }
  for (let j = 0; j <= rows; j++) {
    const y = margin + j * cellH;
    paths += `<line x1="${margin}" y1="${y}" x2="${w - margin}" y2="${y}" stroke="#ffffff" stroke-width="0.5" opacity="0.08"/>`;
  }

  // Highlighted cells (few, deliberate)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() > 0.2) continue;
      const x = margin + i * cellW;
      const y = margin + j * cellH;
      const isAccent = rng() > 0.5;
      const fill = isAccent ? config.accentDim : '#ffffff10';
      paths += `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" fill="${fill}"/>`;
      if (isAccent) {
        paths += `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" fill="none" stroke="${config.accent}" stroke-width="0.5" opacity="0.4"/>`;
      }
    }
  }

  // Accent dot at one intersection
  const dotI = Math.floor(rng() * (cols - 1)) + 1;
  const dotJ = Math.floor(rng() * (rows - 1)) + 1;
  paths += `<circle cx="${margin + dotI * cellW}" cy="${margin + dotJ * cellH}" r="3" fill="${config.accent}" opacity="0.7"/>`;

  return paths;
}

function generateCircuitMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const margin = Math.min(w, h) * 0.12;
  const lineCount = 5 + Math.floor(rng() * 3);

  for (let i = 0; i < lineCount; i++) {
    const isAccent = i === 0 || rng() > 0.7;
    const color = isAccent ? config.accent : '#ffffff';
    const opacity = isAccent ? 0.4 : 0.12;
    const strokeW = isAccent ? 1.5 : 1;

    let x = margin + rng() * (w - margin * 2);
    let y = margin + rng() * (h - margin * 2);
    let d = `M ${x} ${y}`;
    const segments = 2 + Math.floor(rng() * 3);

    for (let s = 0; s < segments; s++) {
      const horizontal = s % 2 === 0;
      const length = 40 + rng() * 100;
      if (horizontal) {
        x += (rng() > 0.5 ? 1 : -1) * length;
      } else {
        y += (rng() > 0.5 ? 1 : -1) * length;
      }
      x = Math.max(margin, Math.min(w - margin, x));
      y = Math.max(margin, Math.min(h - margin, y));
      d += ` L ${x} ${y}`;
    }

    paths += `<path d="${d}" stroke="${color}" stroke-width="${strokeW}" fill="none" opacity="${opacity}" stroke-linecap="round"/>`;

    // Endpoint node
    if (isAccent) {
      paths += `<circle cx="${x}" cy="${y}" r="2.5" fill="${config.accent}" opacity="0.6"/>`;
    }
  }

  return paths;
}

function generateSpiralMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.min(w, h) * 0.35;

  // Single clean spiral
  const turns = 2 + rng() * 1.5;
  const steps = 80;
  let d = '';

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const r = t * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  // White spiral
  paths += `<path d="${d}" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.15" stroke-linecap="round"/>`;

  // Second spiral offset (accent)
  let d2 = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2 + Math.PI * 0.3;
    const r = t * maxR * 0.85;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    d2 += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  paths += `<path d="${d2}" stroke="${config.accent}" stroke-width="1.5" fill="none" opacity="0.35" stroke-linecap="round"/>`;

  // Outer endpoint dot
  const endAngle = turns * Math.PI * 2;
  paths += `<circle cx="${cx + Math.cos(endAngle) * maxR}" cy="${cy + Math.sin(endAngle) * maxR}" r="3" fill="${config.accent}" opacity="0.6"/>`;

  // Center dot
  paths += `<circle cx="${cx}" cy="${cy}" r="2" fill="#ffffff" opacity="0.3"/>`;

  return paths;
}

function generateWaveMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const waveCount = 4 + Math.floor(rng() * 2);

  for (let i = 0; i < waveCount; i++) {
    const t = i / (waveCount - 1);
    const baseY = h * (0.25 + t * 0.5);
    const amplitude = 10 + rng() * 20;
    const freq = 1.5 + rng() * 1.5;
    const phase = rng() * Math.PI * 2;
    const isAccent = i === Math.floor(waveCount / 2);
    const color = isAccent ? config.accent : '#ffffff';
    const opacity = isAccent ? 0.35 : 0.08 + rng() * 0.06;
    const strokeW = isAccent ? 1.5 : 1;

    let d = '';
    const steps = 50;
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * w;
      const y = baseY + Math.sin((s / steps) * Math.PI * freq + phase) * amplitude;
      d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    paths += `<path d="${d}" stroke="${color}" stroke-width="${strokeW}" fill="none" opacity="${opacity}" stroke-linecap="round"/>`;
  }

  return paths;
}

// --- Main Generator ---
const MOTIF_GENERATORS: Record<string, (rng: () => number, w: number, h: number, config: TagConfig) => string> = {
  clock: generateClockMotif,
  nodes: generateNodesMotif,
  rays: generateRaysMotif,
  grid: generateGridMotif,
  circuit: generateCircuitMotif,
  spiral: generateSpiralMotif,
  wave: generateWaveMotif,
};

export function generatePostSVG(
  title: string,
  tags: string[],
  size: 'full' | 'thumbnail' = 'full'
): string {
  const seed = hashString(title);
  const rng = createRng(seed);
  const config = getTagConfig(tags);

  const w = size === 'full' ? 1200 : 800;
  const h = size === 'full' ? 400 : 200;

  const generator = MOTIF_GENERATORS[config.motif] || MOTIF_GENERATORS.wave;
  const motifContent = generator(rng, w, h, config);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block">
  <rect width="${w}" height="${h}" fill="#0a0a0a"/>
  ${motifContent}
</svg>`;
}
