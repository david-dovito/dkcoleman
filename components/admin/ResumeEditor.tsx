'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';

interface ResumeEditorProps {
    token: string;
}

const API_BASE = '/api/admin';

export function ResumeEditor({ token }: ResumeEditorProps) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchResume = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/resume`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch resume');
            const data = await res.json();
            setContent(data.content || '');
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchResume();
    }, [fetchResume]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE}/resume`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ content }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to save resume');
            }

            setMessage({ type: 'success', text: 'Resume saved successfully!' });
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
                    <Loader2 className="animate-spin h-4 w-4" /> Loading resume...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-lg">Resume Content</CardTitle>
                <CardDescription>Edit resume content in markdown format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={24}
                    placeholder="Write your resume content in markdown..."
                    className="font-mono text-sm"
                />

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
                    Save Resume
                </Button>
            </CardContent>
        </Card>
    );
}
