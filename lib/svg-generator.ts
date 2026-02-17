// Deterministic SVG illustration generator for blog posts
// Bold ink-wash style: dynamic black brush strokes on white, single accent color per tag

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
  accent: string;
  motif: 'ascend' | 'burst' | 'sweep' | 'shatter' | 'pulse' | 'rise' | 'flow';
}

const TAG_CONFIGS: Record<string, TagConfig> = {
  'The 1159': { accent: '#D4A853', motif: 'sweep' },
  Leadership: { accent: '#8B5CF6', motif: 'ascend' },
  Faith: { accent: '#E8B931', motif: 'burst' },
  Business: { accent: '#14B8A6', motif: 'shatter' },
  Technology: { accent: '#3B82F6', motif: 'pulse' },
  Growth: { accent: '#F59E0B', motif: 'rise' },
  Life: { accent: '#F43F5E', motif: 'flow' },
};

const DEFAULT_CONFIG: TagConfig = { accent: '#8B8B8B', motif: 'flow' };

function getTagConfig(tags: string[]): TagConfig {
  const themeTags = tags.filter(t => t !== 'The 1159');
  const tagsToCheck = themeTags.length > 0 ? themeTags : tags;
  for (const tag of tagsToCheck) {
    if (TAG_CONFIGS[tag]) return TAG_CONFIGS[tag];
  }
  return DEFAULT_CONFIG;
}

// --- Brush Stroke Primitives ---

/** Creates an organic bezier brush stroke between two points */
function brushStroke(
  rng: () => number,
  x1: number, y1: number,
  x2: number, y2: number,
  width: number,
  color: string,
  opacity: number
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular direction for organic bend
  const nx = -dy / len;
  const ny = dx / len;
  const bend = (rng() - 0.5) * len * 0.5;

  const cx1 = x1 + dx * 0.3 + nx * bend;
  const cy1 = y1 + dy * 0.3 + ny * bend;
  const cx2 = x1 + dx * 0.7 + nx * bend * 0.6;
  const cy2 = y1 + dy * 0.7 + ny * bend * 0.6;

  let svg = '';

  // Main bold stroke
  svg += `<path d="M${f(x1)},${f(y1)} C${f(cx1)},${f(cy1)} ${f(cx2)},${f(cy2)} ${f(x2)},${f(y2)}" stroke="${color}" stroke-width="${f(width)}" fill="none" opacity="${f(opacity)}" stroke-linecap="round"/>`;

  // Edge texture - thinner parallel stroke for depth
  if (width > 5) {
    const off = width * 0.3 * (rng() > 0.5 ? 1 : -1);
    svg += `<path d="M${f(x1 + nx * off)},${f(y1 + ny * off)} C${f(cx1 + nx * off * 0.7)},${f(cy1 + ny * off * 0.7)} ${f(cx2 + nx * off * 0.5)},${f(cy2 + ny * off * 0.5)} ${f(x2 + nx * off * 0.3)},${f(y2 + ny * off * 0.3)}" stroke="${color}" stroke-width="${f(width * 0.25)}" fill="none" opacity="${f(opacity * 0.35)}" stroke-linecap="round"/>`;
  }

  return svg;
}

/** Creates ink splatter dots around a point */
function inkSplatter(
  rng: () => number,
  cx: number, cy: number,
  spread: number,
  count: number,
  color: string,
  baseOpacity: number
): string {
  let svg = '';
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * spread;
    const r = 0.5 + rng() * 2.5;
    const opacity = baseOpacity * (0.3 + rng() * 0.7);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    svg += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}" opacity="${f(opacity)}"/>`;
  }
  return svg;
}

/** Creates a dry-brush drag effect (horizontal streaks) */
function dryBrush(
  rng: () => number,
  x: number, y: number,
  length: number,
  width: number,
  color: string,
  opacity: number
): string {
  let svg = '';
  const streakCount = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < streakCount; i++) {
    const yOff = (rng() - 0.5) * width;
    const xOff = rng() * length * 0.2;
    const sLen = length * (0.4 + rng() * 0.6);
    const sw = 0.5 + rng() * 1.5;
    svg += `<line x1="${f(x + xOff)}" y1="${f(y + yOff)}" x2="${f(x + xOff + sLen)}" y2="${f(y + yOff + (rng() - 0.5) * 4)}" stroke="${color}" stroke-width="${f(sw)}" opacity="${f(opacity * (0.2 + rng() * 0.5))}" stroke-linecap="round"/>`;
  }
  return svg;
}

// Format number to 1 decimal place
function f(n: number): string { return n.toFixed(1); }

// --- Motif Generators ---

/** Leadership: Bold diagonal strokes ascending from bottom-left to top-right */
function generateAscend(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';
  const margin = Math.min(w, h) * 0.1;

  // 3-4 bold ascending strokes
  const strokeCount = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < strokeCount; i++) {
    const progress = i / strokeCount;
    const x1 = margin + progress * w * 0.4 + rng() * w * 0.1;
    const y1 = h - margin - rng() * h * 0.15;
    const x2 = w * 0.4 + progress * w * 0.5 + rng() * w * 0.1;
    const y2 = margin + rng() * h * 0.25;
    const width = 6 + rng() * 12;
    const isAccent = i === strokeCount - 1;
    const color = isAccent ? config.accent : '#0a0a0a';
    const opacity = isAccent ? 0.85 : 0.6 + rng() * 0.3;

    svg += brushStroke(rng, x1, y1, x2, y2, width, color, opacity);

    // Splatter at stroke origin
    svg += inkSplatter(rng, x1, y1, 25 + rng() * 15, 4 + Math.floor(rng() * 4), '#0a0a0a', 0.5);
  }

  // Dry brush drag from the main composition
  svg += dryBrush(rng, w * 0.2, h * 0.6, w * 0.35, h * 0.15, '#0a0a0a', 0.25);

  // Few accent splatters near top
  svg += inkSplatter(rng, w * 0.7, h * 0.25, 40, 5, config.accent, 0.4);

  return svg;
}

/** Faith: Radiating burst of bold strokes from center-bottom */
function generateBurst(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';
  const cx = w * 0.5 + (rng() - 0.5) * w * 0.15;
  const cy = h * 0.65;

  // Bold radiating strokes (upper half fan)
  const rayCount = 7 + Math.floor(rng() * 4);
  for (let i = 0; i < rayCount; i++) {
    const angle = -Math.PI * 0.15 - (i / rayCount) * Math.PI * 0.7;
    const length = h * (0.35 + rng() * 0.35);
    const x2 = cx + Math.cos(angle) * length;
    const y2 = cy + Math.sin(angle) * length;
    const width = 3 + rng() * 10;
    const isAccent = i === Math.floor(rayCount / 2);
    const color = isAccent ? config.accent : '#0a0a0a';
    const opacity = isAccent ? 0.8 : 0.3 + rng() * 0.45;

    svg += brushStroke(rng, cx, cy, x2, y2, width, color, opacity);
  }

  // Heavy ink pool at origin
  svg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(12 + rng() * 8)}" ry="${f(8 + rng() * 5)}" fill="#0a0a0a" opacity="0.7"/>`;

  // Splatter around origin
  svg += inkSplatter(rng, cx, cy, 50, 10, '#0a0a0a', 0.45);

  // Light accent glow at origin
  svg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="5" ry="3" fill="${config.accent}" opacity="0.5"/>`;

  return svg;
}

/** The 1159: Sweeping horizontal strokes with circular energy */
function generateSweep(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';

  // 3-4 bold horizontal sweeping strokes
  for (let i = 0; i < 4; i++) {
    const baseY = h * (0.2 + i * 0.18) + (rng() - 0.5) * h * 0.08;
    const x1 = w * (0.05 + rng() * 0.15);
    const x2 = w * (0.7 + rng() * 0.25);
    const width = 5 + rng() * 14;
    const isAccent = i === 1;
    const color = isAccent ? config.accent : '#0a0a0a';
    const opacity = isAccent ? 0.75 : 0.35 + rng() * 0.4;

    svg += brushStroke(rng, x1, baseY, x2, baseY + (rng() - 0.5) * h * 0.12, width, color, opacity);

    // Dry brush trailing off the stroke
    if (rng() > 0.4) {
      svg += dryBrush(rng, x2 - w * 0.05, baseY, w * 0.2, h * 0.06, '#0a0a0a', 0.2);
    }
  }

  // One bold diagonal slash for energy
  svg += brushStroke(rng, w * 0.6, h * 0.1, w * 0.35, h * 0.85, 4 + rng() * 6, '#0a0a0a', 0.25);

  // Splatter cluster
  svg += inkSplatter(rng, w * 0.75, h * 0.4, 35, 7, '#0a0a0a', 0.35);
  svg += inkSplatter(rng, w * 0.3, h * 0.7, 20, 3, config.accent, 0.35);

  return svg;
}

/** Business: Angular intersecting strokes - structured energy */
function generateShatter(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';
  const cx = w * (0.45 + rng() * 0.1);
  const cy = h * (0.45 + rng() * 0.1);

  // Bold intersecting strokes radiating from an off-center point
  const strokeCount = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < strokeCount; i++) {
    const angle = rng() * Math.PI * 2;
    const length = Math.min(w, h) * (0.25 + rng() * 0.35);
    const x1 = cx + Math.cos(angle + Math.PI) * length * 0.3;
    const y1 = cy + Math.sin(angle + Math.PI) * length * 0.3;
    const x2 = cx + Math.cos(angle) * length;
    const y2 = cy + Math.sin(angle) * length;
    const width = 3 + rng() * 10;
    const isAccent = i === 0;
    const color = isAccent ? config.accent : '#0a0a0a';
    const opacity = isAccent ? 0.8 : 0.3 + rng() * 0.45;

    svg += brushStroke(rng, x1, y1, x2, y2, width, color, opacity);
  }

  // Heavy ink at intersection
  svg += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(6 + rng() * 4)}" fill="#0a0a0a" opacity="0.6"/>`;

  // Shatter fragments - small angular strokes
  for (let i = 0; i < 4; i++) {
    const fx = cx + (rng() - 0.5) * w * 0.5;
    const fy = cy + (rng() - 0.5) * h * 0.5;
    const flen = 15 + rng() * 30;
    const fangle = rng() * Math.PI * 2;
    svg += `<line x1="${f(fx)}" y1="${f(fy)}" x2="${f(fx + Math.cos(fangle) * flen)}" y2="${f(fy + Math.sin(fangle) * flen)}" stroke="#0a0a0a" stroke-width="${f(1 + rng() * 2)}" opacity="${f(0.2 + rng() * 0.2)}" stroke-linecap="round"/>`;
  }

  // Splatter
  svg += inkSplatter(rng, cx, cy, 60, 12, '#0a0a0a', 0.3);

  return svg;
}

/** Technology: Sharp geometric paths with pulse energy */
function generatePulse(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';
  const cy = h * 0.5;

  // Main pulse line - bold horizontal with sharp peaks
  let d = `M${f(0)},${f(cy)}`;
  const segments = 12 + Math.floor(rng() * 6);
  const segW = w / segments;
  for (let i = 1; i <= segments; i++) {
    const x = i * segW;
    const isPeak = rng() > 0.6;
    const y = isPeak ? cy + (rng() > 0.5 ? -1 : 1) * h * (0.15 + rng() * 0.25) : cy + (rng() - 0.5) * h * 0.06;
    d += ` L${f(x)},${f(y)}`;
  }
  svg += `<path d="${d}" stroke="#0a0a0a" stroke-width="8" fill="none" opacity="0.7" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Ghost echo of the pulse (thinner, offset)
  svg += `<path d="${d}" stroke="#0a0a0a" stroke-width="3" fill="none" opacity="0.15" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,8)"/>`;

  // Accent pulse line
  let d2 = `M${f(w * 0.1)},${f(cy + h * 0.08)}`;
  for (let i = 1; i <= 8; i++) {
    const x = w * 0.1 + i * (w * 0.8 / 8);
    const isPeak = rng() > 0.55;
    const y = cy + h * 0.08 + (isPeak ? (rng() > 0.5 ? -1 : 1) * h * (0.1 + rng() * 0.15) : (rng() - 0.5) * h * 0.04);
    d2 += ` L${f(x)},${f(y)}`;
  }
  svg += `<path d="${d2}" stroke="${config.accent}" stroke-width="4" fill="none" opacity="0.6" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Splatter at peak points
  svg += inkSplatter(rng, w * 0.5, cy, 40, 6, '#0a0a0a', 0.3);

  // A few horizontal dry brush streaks
  svg += dryBrush(rng, w * 0.05, h * 0.15, w * 0.3, h * 0.08, '#0a0a0a', 0.15);
  svg += dryBrush(rng, w * 0.6, h * 0.8, w * 0.35, h * 0.06, '#0a0a0a', 0.12);

  return svg;
}

/** Growth: Upward sweeping curves, organic ascending energy */
function generateRise(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';

  // Main rising curve - bold upward sweep from bottom-left
  const curveCount = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < curveCount; i++) {
    const spread = i * 0.12;
    const x1 = w * (0.05 + spread + rng() * 0.08);
    const y1 = h * (0.85 - spread * 0.3 + rng() * 0.08);
    const x2 = w * (0.6 + i * 0.08 + rng() * 0.15);
    const y2 = h * (0.1 + rng() * 0.15);

    const cpx1 = x1 + (x2 - x1) * 0.3 + (rng() - 0.5) * w * 0.15;
    const cpy1 = y1 - h * 0.2 + (rng() - 0.5) * h * 0.1;
    const cpx2 = x1 + (x2 - x1) * 0.7 + (rng() - 0.5) * w * 0.1;
    const cpy2 = y2 + h * 0.15 + (rng() - 0.5) * h * 0.1;

    const width = 6 + rng() * 12;
    const isAccent = i === curveCount - 1;
    const color = isAccent ? config.accent : '#0a0a0a';
    const opacity = isAccent ? 0.75 : 0.35 + rng() * 0.4;

    svg += `<path d="M${f(x1)},${f(y1)} C${f(cpx1)},${f(cpy1)} ${f(cpx2)},${f(cpy2)} ${f(x2)},${f(y2)}" stroke="${color}" stroke-width="${f(width)}" fill="none" opacity="${f(opacity)}" stroke-linecap="round"/>`;

    // Trailing dry brush at base
    if (i === 0) {
      svg += dryBrush(rng, x1 - 10, y1, w * 0.2, h * 0.08, '#0a0a0a', 0.2);
    }
  }

  // Ink pool at base
  svg += `<ellipse cx="${f(w * 0.12)}" cy="${f(h * 0.85)}" rx="${f(15 + rng() * 10)}" ry="${f(6 + rng() * 4)}" fill="#0a0a0a" opacity="0.5"/>`;

  // Splatter trail upward
  svg += inkSplatter(rng, w * 0.4, h * 0.5, 45, 8, '#0a0a0a', 0.3);
  svg += inkSplatter(rng, w * 0.65, h * 0.2, 25, 4, config.accent, 0.35);

  return svg;
}

/** Life: Flowing horizontal wave strokes with organic movement */
function generateFlow(rng: () => number, w: number, h: number, config: TagConfig): string {
  let svg = '';

  // 3-4 flowing wave strokes
  const waveCount = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < waveCount; i++) {
    const baseY = h * (0.25 + i * 0.18 + (rng() - 0.5) * 0.06);
    const amplitude = h * (0.06 + rng() * 0.1);
    const freq = 1.5 + rng() * 2;
    const phase = rng() * Math.PI * 2;
    const isAccent = i === Math.floor(waveCount / 2);
    const color = isAccent ? config.accent : '#0a0a0a';
    const width = 4 + rng() * 12;
    const opacity = isAccent ? 0.7 : 0.25 + rng() * 0.4;

    // Build smooth curve through wave points
    const points: { x: number; y: number }[] = [];
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = t * w;
      const y = baseY + Math.sin(t * Math.PI * freq + phase) * amplitude;
      points.push({ x, y });
    }

    // Convert to smooth bezier
    let d = `M${f(points[0].x)},${f(points[0].y)}`;
    for (let s = 1; s < points.length; s++) {
      const prev = points[s - 1];
      const curr = points[s];
      const cpx = (prev.x + curr.x) / 2;
      d += ` Q${f(prev.x + (curr.x - prev.x) * 0.5)},${f(prev.y)} ${f(cpx)},${f((prev.y + curr.y) / 2)}`;
    }
    // Final segment
    const last = points[points.length - 1];
    d += ` L${f(last.x)},${f(last.y)}`;

    svg += `<path d="${d}" stroke="${color}" stroke-width="${f(width)}" fill="none" opacity="${f(opacity)}" stroke-linecap="round"/>`;

    // Trailing texture
    if (width > 8) {
      svg += dryBrush(rng, w * 0.7, baseY, w * 0.25, amplitude, '#0a0a0a', 0.15);
    }
  }

  // Ink splatters
  svg += inkSplatter(rng, w * 0.2, h * 0.5, 35, 6, '#0a0a0a', 0.3);
  svg += inkSplatter(rng, w * 0.8, h * 0.45, 25, 4, config.accent, 0.3);

  return svg;
}

// --- Main Generator ---
const MOTIF_GENERATORS: Record<string, (rng: () => number, w: number, h: number, config: TagConfig) => string> = {
  ascend: generateAscend,
  burst: generateBurst,
  sweep: generateSweep,
  shatter: generateShatter,
  pulse: generatePulse,
  rise: generateRise,
  flow: generateFlow,
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

  const generator = MOTIF_GENERATORS[config.motif] || MOTIF_GENERATORS.flow;
  const motifContent = generator(rng, w, h, config);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block">
  <rect width="${w}" height="${h}" fill="#fafafa"/>
  ${motifContent}
</svg>`;
}
