'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';

interface AboutSection {
    key: string;
    title: string;
    content: string;
    order: number;
}

interface AboutEditorProps {
    token: string;
}

const SECTION_CONFIG = [
    { key: 'introduction', title: 'Introduction', order: 0 },
    { key: 'whatIDo', title: 'What I Do', order: 1 },
    { key: 'thisWebsite', title: 'This Website', order: 2 },
    { key: 'the1159', title: 'The 1159', order: 3 },
];

const API_BASE = '/api/admin';

export function AboutEditor({ token }: AboutEditorProps) {
    const [sections, setSections] = useState<AboutSection[]>(
        SECTION_CONFIG.map(s => ({ ...s, content: '' }))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchAbout = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/about`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch about content');
            const data = await res.json();

            // Merge fetched data with our known sections
            const merged = SECTION_CONFIG.map(config => {
                const found = (Array.isArray(data) ? data : []).find(
                    (s: AboutSection) => s.key === config.key
                );
                return {
                    key: config.key,
                    title: config.title,
                    content: found?.content || '',
                    order: config.order,
                };
            });
            setSections(merged);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAbout();
    }, [fetchAbout]);

    const handleContentChange = (key: string, content: string) => {
        setSections(prev =>
            prev.map(s => (s.key === key ? { ...s, content } : s))
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE}/about`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(sections),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to save about content');
            }

            setMessage({ type: 'success', text: 'About content saved successfully!' });
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
                    <Loader2 className="animate-spin h-4 w-4" /> Loading about content...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-lg">About Page Content</CardTitle>
                <CardDescription>Edit the sections that appear on the About page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {sections.map((section) => (
                    <div key={section.key} className="space-y-2">
                        <Label htmlFor={`about-${section.key}`}>{section.title}</Label>
                        <Textarea
                            id={`about-${section.key}`}
                            value={section.content}
                            onChange={(e) => handleContentChange(section.key, e.target.value)}
                            rows={4}
                            placeholder={`Enter content for ${section.title}...`}
                        />
                    </div>
                ))}

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

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save About Content
                </Button>
            </CardContent>
        </Card>
    );
}
