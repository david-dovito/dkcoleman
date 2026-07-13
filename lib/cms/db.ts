import { getSql } from '@/lib/db';
import { Collection, Field } from './schema';

/**
 * Generic Neon CRUD driven by the CMS registry. Column identifiers come only
 * from the (trusted) registry and are double-quoted; all values are passed as
 * parameters. Reads exclude soft-deleted rows; deletes are soft; every mutation
 * writes an audit_log entry.
 */

const JSONB_TYPES = new Set(['tags', 'images']);

export class ValidationError extends Error {}
export class ConflictError extends Error {}

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
            return Array.isArray(raw)
                ? raw
                : String(raw)
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
        }
        default:
            return String(raw);
    }
}

/** Server-side validation: required fields present, select values in range. */
export function validate(c: Collection, body: Record<string, unknown>): void {
    for (const f of editableFields(c)) {
        const v = body[f.name];
        if (f.required && (v === undefined || v === null || String(v).trim() === '')) {
            throw new ValidationError(`${f.label} is required`);
        }
        if (f.type === 'select' && v && f.options && !f.options.includes(String(v))) {
            throw new ValidationError(`${f.label} must be one of: ${f.options.join(', ')}`);
        }
        if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
            throw new ValidationError(`${f.label} must be an ISO date (YYYY-MM-DD)`);
        }
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

async function audit(actor: string, action: string, c: Collection, id: unknown, detail?: unknown) {
    const sql = getSql();
    if (!sql) return;
    try {
        await sql`insert into public.audit_log (actor, action, entity, entity_id, detail)
            values (${actor}, ${action}, ${c.key}, ${String(id ?? '')}, ${detail ? JSON.stringify(detail) : null}::jsonb)`;
    } catch {
        /* audit is best-effort */
    }
}

export async function listRows(c: Collection): Promise<Record<string, unknown>[]> {
    const sql = getSql();
    if (!sql) return [];
    return (await sql.query(`select * from ${c.table} where deleted_at is null order by ${c.orderBy}`)) as Record<string, unknown>[];
}

export async function getRow(c: Collection, id: number | string): Promise<Record<string, unknown> | null> {
    const sql = getSql();
    if (!sql) return null;
    const rows = (await sql.query(`select * from ${c.table} where id = $1 and deleted_at is null`, [id])) as Record<string, unknown>[];
    return rows[0] ?? null;
}

function buildValues(c: Collection, body: Record<string, unknown>) {
    const data: Record<string, unknown> = {};
    for (const f of editableFields(c)) data[f.name] = coerce(f, body[f.name]);
    Object.assign(data, autoFields(c, data));
    return data;
}

function placeholder(idx: number, isJsonb: boolean) {
    return isJsonb ? `$${idx}::jsonb` : `$${idx}`;
}

function mapDbError(e: unknown): never {
    const err = e as { code?: string; message?: string };
    if (err.code === '23505') throw new ConflictError('That slug is already in use');
    throw new Error(err.message || 'Database error');
}

export async function createRow(c: Collection, body: Record<string, unknown>, actor = 'admin'): Promise<Record<string, unknown>> {
    const sql = getSql();
    if (!sql) throw new Error('no database');
    validate(c, body);
    const data = buildValues(c, body);
    const cols = Object.keys(data);
    const jsonb = new Set(c.fields.filter((f) => JSONB_TYPES.has(f.type)).map((f) => f.name));
    const params: unknown[] = [];
    const placeholders = cols.map((col, i) => {
        const isJ = jsonb.has(col);
        params.push(isJ ? JSON.stringify(data[col]) : data[col]);
        return placeholder(i + 1, isJ);
    });
    const colSql = cols.map((c2) => `"${c2}"`).join(', ');
    let rows: Record<string, unknown>[];
    try {
        rows = (await sql.query(`insert into ${c.table} (${colSql}) values (${placeholders.join(', ')}) returning *`, params)) as Record<string, unknown>[];
    } catch (e) {
        mapDbError(e);
    }
    await audit(actor, 'create', c, rows![0]?.id);
    return rows![0];
}

export async function updateRow(c: Collection, id: number | string, body: Record<string, unknown>, actor = 'admin'): Promise<Record<string, unknown> | null> {
    const sql = getSql();
    if (!sql) throw new Error('no database');
    validate(c, body);
    const data = buildValues(c, body);
    const jsonb = new Set(c.fields.filter((f) => JSONB_TYPES.has(f.type)).map((f) => f.name));
    const params: unknown[] = [];
    const sets = Object.keys(data).map((col, i) => {
        const isJ = jsonb.has(col);
        params.push(isJ ? JSON.stringify(data[col]) : data[col]);
        return `"${col}" = ${placeholder(i + 1, isJ)}`;
    });
    if (hasUpdatedAt(c)) sets.push('updated_at = now()');
    params.push(id);
    let rows: Record<string, unknown>[];
    try {
        rows = (await sql.query(`update ${c.table} set ${sets.join(', ')} where id = $${params.length} and deleted_at is null returning *`, params)) as Record<string, unknown>[];
    } catch (e) {
        mapDbError(e);
    }
    await audit(actor, 'update', c, id);
    return rows![0] ?? null;
}

/** Soft delete: mark deleted_at so the row leaves all reads but is recoverable. */
export async function deleteRow(c: Collection, id: number | string, actor = 'admin'): Promise<void> {
    const sql = getSql();
    if (!sql) throw new Error('no database');
    await sql.query(`update ${c.table} set deleted_at = now() where id = $1`, [id]);
    await audit(actor, 'delete', c, id);
}

export async function countRows(c: Collection): Promise<number> {
    const sql = getSql();
    if (!sql) return 0;
    const rows = (await sql.query(`select count(*)::int as n from ${c.table} where deleted_at is null`)) as { n: number }[];
    return rows[0]?.n ?? 0;
}
