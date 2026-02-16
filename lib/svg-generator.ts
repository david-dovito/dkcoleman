// Deterministic SVG illustration generator for blog posts
// Generates unique visuals based on post title hash + primary tag motif

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

// --- Color Utilities ---
function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  s = s / 100;
  l = l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- Tag Configurations ---
interface TagConfig {
  hueRange: [number, number];
  satRange: [number, number];
  lightRange: [number, number];
  bgHue: number;
  bgSat: number;
  bgLight: number;
  motif: 'clock' | 'nodes' | 'rays' | 'grid' | 'circuit' | 'spiral' | 'wave';
}

const TAG_CONFIGS: Record<string, TagConfig> = {
  'The 1159': {
    hueRange: [220, 45],
    satRange: [60, 80],
    lightRange: [45, 65],
    bgHue: 225,
    bgSat: 35,
    bgLight: 8,
    motif: 'clock',
  },
  Leadership: {
    hueRange: [270, 290],
    satRange: [50, 70],
    lightRange: [40, 60],
    bgHue: 275,
    bgSat: 30,
    bgLight: 8,
    motif: 'nodes',
  },
  Faith: {
    hueRange: [40, 55],
    satRange: [70, 90],
    lightRange: [55, 75],
    bgHue: 35,
    bgSat: 25,
    bgLight: 8,
    motif: 'rays',
  },
  Business: {
    hueRange: [140, 175],
    satRange: [45, 65],
    lightRange: [35, 55],
    bgHue: 160,
    bgSat: 30,
    bgLight: 8,
    motif: 'grid',
  },
  Technology: {
    hueRange: [200, 220],
    satRange: [55, 75],
    lightRange: [45, 65],
    bgHue: 210,
    bgSat: 25,
    bgLight: 8,
    motif: 'circuit',
  },
  Growth: {
    hueRange: [25, 40],
    satRange: [65, 85],
    lightRange: [45, 65],
    bgHue: 30,
    bgSat: 30,
    bgLight: 8,
    motif: 'spiral',
  },
  Life: {
    hueRange: [330, 350],
    satRange: [50, 70],
    lightRange: [50, 70],
    bgHue: 340,
    bgSat: 25,
    bgLight: 8,
    motif: 'wave',
  },
};

const DEFAULT_CONFIG: TagConfig = {
  hueRange: [200, 260],
  satRange: [40, 60],
  lightRange: [40, 60],
  bgHue: 230,
  bgSat: 20,
  bgLight: 8,
  motif: 'wave',
};

function getTagConfig(tags: string[]): TagConfig {
  for (const tag of tags) {
    if (TAG_CONFIGS[tag]) return TAG_CONFIGS[tag];
  }
  return DEFAULT_CONFIG;
}

// --- Motif Generators ---
function generateClockMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.min(w, h) * 0.4;
  let paths = '';

  // Circular rays emanating from center (11:59 clock theme)
  const rayCount = 12 + Math.floor(rng() * 8);
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
    const innerR = maxR * (0.15 + rng() * 0.15);
    const outerR = maxR * (0.6 + rng() * 0.4);
    const thickness = 1 + rng() * 2.5;
    const t = i / rayCount;
    const hue = lerp(config.hueRange[0], config.hueRange[1], t);
    const sat = lerp(config.satRange[0], config.satRange[1], rng());
    const light = lerp(config.lightRange[0], config.lightRange[1], rng());
    const opacity = 0.3 + rng() * 0.5;
    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = cy + Math.sin(angle) * innerR;
    const x2 = cx + Math.cos(angle) * outerR;
    const y2 = cy + Math.sin(angle) * outerR;
    paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hslToHex(hue, sat, light)}" stroke-width="${thickness}" opacity="${opacity}" stroke-linecap="round"/>`;
  }

  // Clock hands pointing to 11:59
  const minuteAngle = (59 / 60) * Math.PI * 2 - Math.PI / 2;
  const hourAngle = (11 / 12 + 59 / 720) * Math.PI * 2 - Math.PI / 2;
  const handColor = hslToHex(config.hueRange[1], 80, 70);
  paths += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(minuteAngle) * maxR * 0.35}" y2="${cy + Math.sin(minuteAngle) * maxR * 0.35}" stroke="${handColor}" stroke-width="2.5" opacity="0.8" stroke-linecap="round"/>`;
  paths += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(hourAngle) * maxR * 0.22}" y2="${cy + Math.sin(hourAngle) * maxR * 0.22}" stroke="${handColor}" stroke-width="3.5" opacity="0.8" stroke-linecap="round"/>`;

  // Center dot
  paths += `<circle cx="${cx}" cy="${cy}" r="3" fill="${handColor}" opacity="0.9"/>`;

  // Scattered accent circles
  for (let i = 0; i < 6; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = maxR * (0.5 + rng() * 0.5);
    const r = 1.5 + rng() * 3;
    const hue = lerp(config.hueRange[0], config.hueRange[1], rng());
    paths += `<circle cx="${cx + Math.cos(angle) * dist}" cy="${cy + Math.sin(angle) * dist}" r="${r}" fill="${hslToHex(hue, 70, 60)}" opacity="${0.2 + rng() * 0.3}"/>`;
  }

  return paths;
}

function generateNodesMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const nodeCount = 8 + Math.floor(rng() * 6);
  const nodes: { x: number; y: number; r: number }[] = [];

  // Generate ascending nodes
  for (let i = 0; i < nodeCount; i++) {
    const progress = i / (nodeCount - 1);
    const x = w * (0.15 + rng() * 0.7);
    const y = h * (0.85 - progress * 0.7) + (rng() - 0.5) * h * 0.08;
    const r = 3 + rng() * 6;
    nodes.push({ x, y, r });
  }

  // Draw connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.35) {
        const t = i / nodes.length;
        const hue = lerp(config.hueRange[0], config.hueRange[1], t);
        const opacity = 0.1 + (1 - dist / (w * 0.35)) * 0.25;
        paths += `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="${hslToHex(hue, 50, 55)}" stroke-width="1" opacity="${opacity}"/>`;
      }
    }
  }

  // Draw nodes
  nodes.forEach((node, i) => {
    const t = i / nodes.length;
    const hue = lerp(config.hueRange[0], config.hueRange[1], t);
    const sat = lerp(config.satRange[0], config.satRange[1], rng());
    const light = lerp(config.lightRange[0], config.lightRange[1], rng());
    paths += `<circle cx="${node.x}" cy="${node.y}" r="${node.r}" fill="${hslToHex(hue, sat, light)}" opacity="${0.5 + rng() * 0.4}"/>`;
    paths += `<circle cx="${node.x}" cy="${node.y}" r="${node.r * 0.4}" fill="${hslToHex(hue, sat, light + 20)}" opacity="0.8"/>`;
  });

  return paths;
}

function generateRaysMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const cx = w * (0.3 + rng() * 0.4);
  const cy = h * (0.6 + rng() * 0.3);

  // Radiating light beams
  const rayCount = 16 + Math.floor(rng() * 12);
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const length = Math.min(w, h) * (0.3 + rng() * 0.5);
    const spread = (rng() - 0.5) * 0.15;
    const t = i / rayCount;
    const hue = lerp(config.hueRange[0], config.hueRange[1], t);
    const sat = lerp(config.satRange[0], config.satRange[1], rng());
    const light = lerp(config.lightRange[0], config.lightRange[1], rng());
    const opacity = 0.15 + rng() * 0.3;
    const x1 = cx;
    const y1 = cy;
    const x2 = cx + Math.cos(angle + spread) * length;
    const y2 = cy + Math.sin(angle + spread) * length;
    paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hslToHex(hue, sat, light)}" stroke-width="${1 + rng() * 3}" opacity="${opacity}" stroke-linecap="round"/>`;
  }

  // Central glow
  const glowColor = hslToHex(config.hueRange[0], 80, 75);
  paths += `<circle cx="${cx}" cy="${cy}" r="${12 + rng() * 8}" fill="${glowColor}" opacity="0.3"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="${6 + rng() * 4}" fill="${glowColor}" opacity="0.5"/>`;

  // Scattered dots
  for (let i = 0; i < 10; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 30 + rng() * Math.min(w, h) * 0.4;
    const hue = lerp(config.hueRange[0], config.hueRange[1], rng());
    paths += `<circle cx="${cx + Math.cos(angle) * dist}" cy="${cy + Math.sin(angle) * dist}" r="${1 + rng() * 2.5}" fill="${hslToHex(hue, 70, 65)}" opacity="${0.2 + rng() * 0.4}"/>`;
  }

  return paths;
}

function generateGridMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const cols = 6 + Math.floor(rng() * 4);
  const rows = 3 + Math.floor(rng() * 3);
  const cellW = w / (cols + 1);
  const cellH = h / (rows + 1);
  const offsetX = cellW;
  const offsetY = cellH;

  // Grid lines
  for (let i = 0; i <= cols; i++) {
    const x = offsetX + i * cellW * (0.9 + rng() * 0.2);
    const hue = lerp(config.hueRange[0], config.hueRange[1], i / cols);
    paths += `<line x1="${x}" y1="${offsetY * 0.5}" x2="${x}" y2="${h - offsetY * 0.5}" stroke="${hslToHex(hue, 40, 30)}" stroke-width="0.5" opacity="0.2"/>`;
  }
  for (let j = 0; j <= rows; j++) {
    const y = offsetY + j * cellH * (0.9 + rng() * 0.2);
    const hue = lerp(config.hueRange[0], config.hueRange[1], j / rows);
    paths += `<line x1="${offsetX * 0.5}" y1="${y}" x2="${w - offsetX * 0.5}" y2="${y}" stroke="${hslToHex(hue, 40, 30)}" stroke-width="0.5" opacity="0.2"/>`;
  }

  // Highlighted intersection nodes
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() > 0.5) continue;
      const x = offsetX + (i + 0.5) * cellW;
      const y = offsetY + (j + 0.5) * cellH;
      const t = (i + j) / (cols + rows);
      const hue = lerp(config.hueRange[0], config.hueRange[1], t);
      const sat = lerp(config.satRange[0], config.satRange[1], rng());
      const light = lerp(config.lightRange[0], config.lightRange[1], rng());
      const r = 2 + rng() * 5;
      paths += `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.3}" fill="${hslToHex(hue, sat, light)}" opacity="${0.3 + rng() * 0.4}"/>`;
    }
  }

  return paths;
}

function generateCircuitMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const lineCount = 10 + Math.floor(rng() * 8);

  for (let i = 0; i < lineCount; i++) {
    const t = i / lineCount;
    const hue = lerp(config.hueRange[0], config.hueRange[1], t);
    const sat = lerp(config.satRange[0], config.satRange[1], rng());
    const light = lerp(config.lightRange[0], config.lightRange[1], rng());
    const color = hslToHex(hue, sat, light);
    const opacity = 0.2 + rng() * 0.4;

    // Create circuit-like paths with right angles
    let x = rng() * w;
    let y = rng() * h;
    let d = `M ${x} ${y}`;
    const segments = 3 + Math.floor(rng() * 4);

    for (let s = 0; s < segments; s++) {
      const horizontal = s % 2 === 0;
      const length = 30 + rng() * 120;
      if (horizontal) {
        x += (rng() > 0.5 ? 1 : -1) * length;
      } else {
        y += (rng() > 0.5 ? 1 : -1) * length;
      }
      x = Math.max(10, Math.min(w - 10, x));
      y = Math.max(10, Math.min(h - 10, y));
      d += ` L ${x} ${y}`;
    }

    paths += `<path d="${d}" stroke="${color}" stroke-width="${1 + rng()}" fill="none" opacity="${opacity}" stroke-linecap="round"/>`;

    // Endpoint nodes
    paths += `<circle cx="${x}" cy="${y}" r="${2 + rng() * 3}" fill="${color}" opacity="${opacity + 0.1}"/>`;
  }

  // Data dots flowing along paths
  for (let i = 0; i < 8; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const hue = lerp(config.hueRange[0], config.hueRange[1], rng());
    paths += `<circle cx="${x}" cy="${y}" r="${1.5 + rng() * 2}" fill="${hslToHex(hue, 80, 70)}" opacity="${0.4 + rng() * 0.4}"/>`;
  }

  return paths;
}

function generateSpiralMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const cx = w * (0.4 + rng() * 0.2);
  const cy = h * (0.5 + rng() * 0.1);

  // Upward spiral
  const spirals = 1 + Math.floor(rng() * 2);
  for (let s = 0; s < spirals; s++) {
    const startAngle = rng() * Math.PI * 2;
    const turns = 1.5 + rng() * 2;
    const maxR = Math.min(w, h) * (0.25 + rng() * 0.15);
    let d = '';
    const steps = 60;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = startAngle + t * turns * Math.PI * 2;
      const r = t * maxR;
      const x = cx + Math.cos(angle) * r + s * 30;
      const y = cy + Math.sin(angle) * r * 0.6 - t * h * 0.15;
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    const hue = lerp(config.hueRange[0], config.hueRange[1], s / spirals);
    paths += `<path d="${d}" stroke="${hslToHex(hue, 65, 55)}" stroke-width="${1.5 + rng()}" fill="none" opacity="${0.4 + rng() * 0.3}" stroke-linecap="round"/>`;
  }

  // Branch-like elements
  for (let i = 0; i < 5 + Math.floor(rng() * 5); i++) {
    const x = w * (0.2 + rng() * 0.6);
    const y = h * (0.3 + rng() * 0.5);
    const length = 15 + rng() * 40;
    const angle = -Math.PI / 2 + (rng() - 0.5) * Math.PI * 0.6;
    const hue = lerp(config.hueRange[0], config.hueRange[1], rng());
    paths += `<line x1="${x}" y1="${y}" x2="${x + Math.cos(angle) * length}" y2="${y + Math.sin(angle) * length}" stroke="${hslToHex(hue, 60, 50)}" stroke-width="${1 + rng() * 2}" opacity="${0.25 + rng() * 0.3}" stroke-linecap="round"/>`;
    // Leaf node
    paths += `<circle cx="${x + Math.cos(angle) * length}" cy="${y + Math.sin(angle) * length}" r="${2 + rng() * 3}" fill="${hslToHex(hue, 70, 60)}" opacity="${0.3 + rng() * 0.3}"/>`;
  }

  return paths;
}

function generateWaveMotif(rng: () => number, w: number, h: number, config: TagConfig): string {
  let paths = '';
  const waveCount = 4 + Math.floor(rng() * 4);

  for (let i = 0; i < waveCount; i++) {
    const t = i / waveCount;
    const baseY = h * (0.2 + t * 0.6);
    const amplitude = 15 + rng() * 30;
    const freq = 2 + rng() * 3;
    const phase = rng() * Math.PI * 2;
    const hue = lerp(config.hueRange[0], config.hueRange[1], t);
    const sat = lerp(config.satRange[0], config.satRange[1], rng());
    const light = lerp(config.lightRange[0], config.lightRange[1], rng());

    let d = '';
    const steps = 50;
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * w;
      const y = baseY + Math.sin((s / steps) * Math.PI * freq + phase) * amplitude;
      d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    paths += `<path d="${d}" stroke="${hslToHex(hue, sat, light)}" stroke-width="${1.5 + rng() * 2}" fill="none" opacity="${0.25 + rng() * 0.35}" stroke-linecap="round"/>`;
  }

  // Organic floating dots
  for (let i = 0; i < 12; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 1.5 + rng() * 4;
    const hue = lerp(config.hueRange[0], config.hueRange[1], rng());
    paths += `<circle cx="${x}" cy="${y}" r="${r}" fill="${hslToHex(hue, 60, 60)}" opacity="${0.15 + rng() * 0.3}"/>`;
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

  const w = size === 'full' ? 1200 : 400;
  const h = size === 'full' ? 630 : 200;

  const bgColor = hslToHex(config.bgHue, config.bgSat, config.bgLight);
  const generator = MOTIF_GENERATORS[config.motif] || MOTIF_GENERATORS.wave;
  const motifContent = generator(rng, w, h, config);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bgColor}"/>
  ${motifContent}
</svg>`;
}
