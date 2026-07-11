import { getSql } from '@/lib/db';
import { Collection, Field } from './schema';

/**
 * Generic Neon CRUD driven by the CMS registry. Column identifiers come only
 * from the (trusted) registry and are double-quoted; all values are passed as
 * parameters, so there is no SQL injection surface from request bodies.
 */

const JSONB_TYPES = new Set(['tags', 'images']);

function editableFields(c: Collection): Field[] {
    return c.fields.filter((f) => !f.auto);
}

function coerce(field: Field, raw: unknown): unknown {
    if (raw === undefined || raw === null || raw === '') {
        return field.type === 'boolean' ? false : JSONB_TYPES.has(field.type) ? [] : null;
    }
    switch (field.type) {
        case 'number': {
            const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
            return Number.isFinite(n) ? n : null;
        }
        case 'boolean':
            return raw === true || raw === 'true' || raw === 'on' || raw === 1 || raw === '1';
        case 'tags':
        case 'images': {
            const arr = Array.isArray(raw)
                ? raw
                : String(raw)
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
            return arr;
        }
        default:
            return String(raw);
    }
}

function autoFields(c: Collection, data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (c.table.endsWith('blog_posts')) {
        const content = String(data.content ?? '');
        const wc = content.split(/\s+/).filter(Boolean).length;
        out.word_count = wc;
        out.reading_time = Math.max(1, Math.ceil(wc / 200));
    }
    return out;
}

const hasUpdatedAt = (c: Collection) => !c.table.endsWith('public.resume');

export async function listRows(c: Collection): Promise<Record<string, unknown>[]> {
    const sql = getSql();
    if (!sql) return [];
    return (await sql.query(`select * from ${c.table} order by ${c.orderBy}`)) as Record<string, unknown>[];
}

export async function getRow(c: Collection, id: number | string): Promise<Record<string, unknown> | null> {
    const sql = getSql();
    if (!sql) return null;
    const rows = (await sql.query(`select * from ${c.table} where id = $1`, [id])) as Record<string, unknown>[];
    return rows[0] ?? null;
}

function buildValues(c: Collection, body: Record<string, unknown>) {
    const data: Record<string, unknown> = {};
    for (const f of editableFields(c)) data[f.name] = coerce(f, body[f.name]);
    Object.assign(data, autoFields(c, data));
    return data;
}

function placeholder(col: string, idx: number, isJsonb: boolean) {
    return isJsonb ? `$${idx}::jsonb` : `$${idx}`;
}

export async function createRow(c: Collection, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sql = getSql();
    if (!sql) throw new Error('no database');
    const data = buildValues(c, body);
    const cols = Object.keys(data);
    const jsonb = new Set(c.fields.filter((f) => JSONB_TYPES.has(f.type)).map((f) => f.name));
    const params: unknown[] = [];
    const placeholders = cols.map((col, i) => {
        const isJ = jsonb.has(col);
        params.push(isJ ? JSON.stringify(data[col]) : data[col]);
        return placeholder(col, i + 1, isJ);
    });
    const colSql = cols.map((c2) => `"${c2}"`).join(', ');
    const rows = (await sql.query(
        `insert into ${c.table} (${colSql}) values (${placeholders.join(', ')}) returning *`,
        params,
    )) as Record<string, unknown>[];
    return rows[0];
}

export async function updateRow(c: Collection, id: number | string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const sql = getSql();
    if (!sql) throw new Error('no database');
    const data = buildValues(c, body);
    const jsonb = new Set(c.fields.filter((f) => JSONB_TYPES.has(f.type)).map((f) => f.name));
    const params: unknown[] = [];
    const sets = Object.keys(data).map((col, i) => {
        const isJ = jsonb.has(col);
        params.push(isJ ? JSON.stringify(data[col]) : data[col]);
        return `"${col}" = ${placeholder(col, i + 1, isJ)}`;
    });
    if (hasUpdatedAt(c)) sets.push('updated_at = now()');
    params.push(id);
    const rows = (await sql.query(
        `update ${c.table} set ${sets.join(', ')} where id = $${params.length} returning *`,
        params,
    )) as Record<string, unknown>[];
    return rows[0] ?? null;
}

export async function deleteRow(c: Collection, id: number | string): Promise<void> {
    const sql = getSql();
    if (!sql) throw new Error('no database');
    await sql.query(`delete from ${c.table} where id = $1`, [id]);
}

export async function countRows(c: Collection): Promise<number> {
    const sql = getSql();
    if (!sql) return 0;
    const rows = (await sql.query(`select count(*)::int as n from ${c.table}`)) as { n: number }[];
    return rows[0]?.n ?? 0;
}
