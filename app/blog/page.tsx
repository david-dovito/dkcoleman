import { getAllPosts, getAllTags } from '@/lib/blog';
import { generatePostSVG } from '@/lib/svg-generator';
import BlogPageClient from './BlogPageClient';

export const revalidate = 3600;

export default async function BlogListPage() {
  const posts = await getAllPosts();
  const tags = await getAllTags();

  // Pre-generate SVG thumbnails server-side for client component
  const postSvgs: Record<string, string> = {};
  posts.forEach((post) => {
    postSvgs[post.id] = generatePostSVG(post.title, post.tags || [], 'thumbnail');
  });

  return <BlogPageClient initialPosts={posts} allTags={tags} postSvgs={postSvgs} />;
}
