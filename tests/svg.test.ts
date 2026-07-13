import { describe, it, expect } from 'vitest';
import { generatePostSVG } from '@/lib/svg-generator';

describe('post cover SVG generator', () => {
    it('is deterministic for the same title + tags', () => {
        const a = generatePostSVG('On Vision', ['The 1159', 'Growth']);
        const b = generatePostSVG('On Vision', ['The 1159', 'Growth']);
        expect(a).toBe(b);
    });

    it('produces different art for different titles', () => {
        const a = generatePostSVG('On Vision', ['The 1159']);
        const b = generatePostSVG('Farming', ['The 1159']);
        expect(a).not.toBe(b);
    });

    it('returns an svg element', () => {
        expect(generatePostSVG('Test', ['Faith'])).toMatch(/^<svg/);
    });
});
