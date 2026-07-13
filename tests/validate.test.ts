import { describe, it, expect } from 'vitest';
import { validate, ValidationError } from '@/lib/cms/db';
import { collection } from '@/lib/cms/schema';

const listings = collection('listings')!;
const blog = collection('blog')!;

describe('CMS server-side validation', () => {
    it('rejects a missing required field', () => {
        expect(() => validate(listings, { slug: 'x', kind: 'sale', status: 'active' })).toThrow(ValidationError);
    });

    it('rejects an out-of-range select value', () => {
        expect(() => validate(listings, { title: 'A', slug: 'a', kind: 'banana', status: 'active' })).toThrow(/For must be one of/);
    });

    it('rejects a non-ISO date', () => {
        expect(() => validate(blog, { title: 'A', slug: 'a', date: 'Jan 2025' })).toThrow(/ISO date/);
    });

    it('accepts a valid payload', () => {
        expect(() => validate(listings, { title: 'A', slug: 'a', kind: 'rent', status: 'active' })).not.toThrow();
    });
});
