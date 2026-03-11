'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface BlogPost {
    id?: string;
    title: string;
    slug: string;
    date: string;
    excerpt: string;
    author: string;
    tags: string[];
    featured: boolean;
    published: boolean;
    content: string;
}

interface BlogEditorProps {
    token: string;
}

const emptyPost: BlogPost = {
    title: '',
    slug: '',
    date: new Date().toISOString().split('T')[0],
    excerpt: '',
    author: '',
    tags: [],
    featured: false,
    published: false,
    content: '',
};

const API_BASE = '/api/admin';

export function BlogEditor({ token }: BlogEditorProps) {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [tagsInput, setTagsInput] = useState('');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/blog`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch posts');
            const data = await res.json();
            setPosts(data);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const selectPost = (post: BlogPost) => {
        setSelectedPost({ ...post });
        setTagsInput((post.tags || []).join(', '));
        setMessage(null);
    };

    const handleNewPost = () => {
        setSelectedPost({ ...emptyPost });
        setTagsInput('');
        setMessage(null);
    };

    const handleFieldChange = (field: keyof BlogPost, value: any) => {
        if (!selectedPost) return;
        setSelectedPost({ ...selectedPost, [field]: value });
    };

    const handleTagsChange = (value: string) => {
        setTagsInput(value);
        const tags = value.split(',').map(t => t.trim()).filter(Boolean);
        if (selectedPost) {
            setSelectedPost({ ...selectedPost, tags });
        }
    };

    const handleSave = async () => {
        if (!selectedPost) return;
        setSaving(true);
        setMessage(null);

        try {
            const isNew = !selectedPost.id;
            const url = isNew ? `${API_BASE}/blog` : `${API_BASE}/blog/${selectedPost.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(selectedPost),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to save post');
            }

            const saved = await res.json();
            setMessage({ type: 'success', text: isNew ? 'Post created successfully!' : 'Post updated successfully!' });

            if (isNew) {
                setSelectedPost(saved);
            }
            await fetchPosts();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPost?.id) return;
        if (!window.confirm(`Are you sure you want to delete "${selectedPost.title}"? This cannot be undone.`)) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE}/blog/${selectedPost.id}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to delete post');
            }

            setMessage({ type: 'success', text: 'Post deleted successfully!' });
            setSelectedPost(null);
            await fetchPosts();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin h-4 w-4" /> Loading posts...
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Left Sidebar - Post List */}
            <div className="md:col-span-1 space-y-2">
                <Button onClick={handleNewPost} className="w-full gap-2" size="sm">
                    <Plus className="h-4 w-4" /> New Post
                </Button>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {posts.map((post) => (
                        <button
                            key={post.id || post.slug}
                            onClick={() => selectPost(post)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                                selectedPost?.id === post.id ? 'bg-accent border-primary' : 'border-border'
                            }`}
                        >
                            <div className="font-medium text-sm truncate">{post.title || 'Untitled'}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{post.date}</span>
                                <Badge
                                    variant={post.published ? 'default' : 'secondary'}
                                    className="text-[10px] px-1.5 py-0"
                                >
                                    {post.published ? 'Published' : 'Draft'}
                                </Badge>
                            </div>
                        </button>
                    ))}
                    {posts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No posts yet.</p>
                    )}
                </div>
            </div>

            {/* Right Panel - Editor */}
            <div className="md:col-span-2">
                {selectedPost ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {selectedPost.id ? 'Edit Post' : 'New Post'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="post-title">Title</Label>
                                    <Input
                                        id="post-title"
                                        value={selectedPost.title}
                                        onChange={(e) => handleFieldChange('title', e.target.value)}
                                        placeholder="Post title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="post-slug">Slug</Label>
                                    <Input
                                        id="post-slug"
                                        value={selectedPost.slug}
                                        onChange={(e) => handleFieldChange('slug', e.target.value)}
                                        placeholder="post-url-slug"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="post-date">Date</Label>
                                    <Input
                                        id="post-date"
                                        type="date"
                                        value={selectedPost.date}
                                        onChange={(e) => handleFieldChange('date', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="post-author">Author</Label>
                                    <Input
                                        id="post-author"
                                        value={selectedPost.author}
                                        onChange={(e) => handleFieldChange('author', e.target.value)}
                                        placeholder="Author name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="post-excerpt">Excerpt</Label>
                                <Textarea
                                    id="post-excerpt"
                                    value={selectedPost.excerpt}
                                    onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                                    placeholder="Brief description of the post"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="post-tags">Tags (comma-separated)</Label>
                                <Input
                                    id="post-tags"
                                    value={tagsInput}
                                    onChange={(e) => handleTagsChange(e.target.value)}
                                    placeholder="Technology, Growth, Life"
                                />
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPost.featured}
                                        onChange={(e) => handleFieldChange('featured', e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm">Featured</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPost.published}
                                        onChange={(e) => handleFieldChange('published', e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm">Published</span>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="post-content">Content (Markdown)</Label>
                                <Textarea
                                    id="post-content"
                                    value={selectedPost.content}
                                    onChange={(e) => handleFieldChange('content', e.target.value)}
                                    placeholder="Write your post content in markdown..."
                                    rows={16}
                                    className="font-mono text-sm"
                                />
                            </div>

                            {message && (
                                <div
                                    className={`p-3 rounded text-sm ${
                                        message.type === 'success'
                                            ? 'bg-green-500/10 border border-green-500/20 text-green-600'
                                            : 'bg-red-500/10 border border-red-500/20 text-red-600'
                                    }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Post
                                </Button>
                                {selectedPost.id && (
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            Select a post from the list or create a new one.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
