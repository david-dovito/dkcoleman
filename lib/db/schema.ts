import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  serial,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  excerpt: text('excerpt').default(''),
  author: text('author').default('David Coleman'),
  tags: jsonb('tags').$type<string[]>().default([]),
  published: boolean('published').default(false),
  featured: boolean('featured').default(false),
  content: text('content').default(''),
  wordCount: integer('word_count').default(0),
  readingTime: integer('reading_time').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('blog_posts_slug_idx').on(table.slug),
]);

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  categories: jsonb('categories').$type<string[]>().default([]),
  description: text('description').default(''),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  url: text('url').default(''),
  tech: jsonb('tech').$type<string[]>().default([]),
  date: text('date').default(''),
  published: boolean('published').default(false),
  photo: text('photo').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aboutSections = pgTable('about_sections', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  order: integer('order').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('about_sections_key_idx').on(table.key),
]);

export const resume = pgTable('resume', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default('Resume'),
  content: text('content').notNull().default(''),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

export const resumeNarrative = pgTable('resume_narrative', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  period: text('period').default(''),
  order: integer('order').default(0),
  icon: text('icon').default('📌'),
  iconType: text('icon_type').$type<'emoji' | 'image'>().default('emoji'),
  content: text('content').default(''),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const meetingRequests = pgTable('meeting_requests', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').default(''),
  reason: text('reason').notNull(),
  preferredTimeframe: text('preferred_timeframe').default(''),
  additionalContext: text('additional_context').default(''),
  source: text('source').$type<'new' | 'preapproved'>().default('new'),
  tokenId: integer('token_id'),
  status: text('status').$type<'pending' | 'processing' | 'aligned' | 'not_aligned' | 'scheduled' | 'declined'>().default('pending'),
  aiResponse: jsonb('ai_response').$type<Record<string, unknown>>(),
  notifiedAt: timestamp('notified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const meetingTokens = pgTable('meeting_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  label: text('label').default(''),
  used: boolean('used').default(false),
  usedAt: timestamp('used_at'),
  usedByRequestId: integer('used_by_request_id'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('meeting_tokens_token_idx').on(table.token),
]);

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  contentType: text('content_type').default(''),
  size: integer('size').default(0),
  entityType: text('entity_type').default(''),
  entityId: integer('entity_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
