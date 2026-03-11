'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface NarrativeSection {
    id?: string;
    title: string;
    period: string;
    order: number;
    icon: string;
    iconType: string;
    content: string;
    published: boolean;
}

interface NarrativeEditorProps {
    token: string;
}

const emptySection: NarrativeSection = {
    title: '',
    period: '',
    order: 0,
    icon: '',
    iconType: 'lucide',
    content: '',
    published: true,
};

const API_BASE = '/api/admin';

export function NarrativeEditor({ token }: NarrativeEditorProps) {
    const [sections, setSections] = useState<NarrativeSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchSections = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/resume-narrative`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch narrative sections');
            const data = await res.json();
            // Sort by order
            const sorted = (data as NarrativeSection[]).sort((a, b) => a.order - b.order);
            setSections(sorted);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const handleAddSection = () => {
        const maxOrder = sections.reduce((max, s) => Math.max(max, s.order), -1);
        const newSection: NarrativeSection = {
            ...emptySection,
            order: maxOrder + 1,
            id: `new-${Date.now()}`,
        };
        setSections([...sections, newSection]);
        setExpandedId(newSection.id!);
        setMessage(null);
    };

    const handleFieldChange = (id: string, field: keyof NarrativeSection, value: any) => {
        setSections(prev =>
            prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSaveSection = async (section: NarrativeSection) => {
        const sectionId = section.id!;
        setSavingId(sectionId);
        setMessage(null);

        try {
            const isNew = sectionId.startsWith('new-');
            const url = isNew ? `${API_BASE}/resume-narrative` : `${API_BASE}/resume-narrative/${sectionId}`;
            const method = isNew ? 'POST' : 'PUT';

            // Remove temporary id for new sections
            const payload = { ...section };
            if (isNew) {
                delete payload.id;
            }

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to save section');
            }

            setMessage({ type: 'success', text: `"${section.title || 'Section'}" saved!` });
            await fetchSections();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSavingId(null);
        }
    };

    const handleDeleteSection = async (section: NarrativeSection) => {
        if (!window.confirm(`Delete "${section.title}"? This cannot be undone.`)) return;

        const sectionId = section.id!;

        // If it's a new unsaved section, just remove from state
        if (sectionId.startsWith('new-')) {
            setSections(prev => prev.filter(s => s.id !== sectionId));
            return;
        }

        setSavingId(sectionId);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE}/resume-narrative/${sectionId}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to delete section');
            }

            setMessage({ type: 'success', text: 'Section deleted!' });
            await fetchSections();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSavingId(null);
        }
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        // Swap order values
        const tempOrder = newSections[index].order;
        newSections[index].order = newSections[targetIndex].order;
        newSections[targetIndex].order = tempOrder;

        // Swap positions in array
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin h-4 w-4" /> Loading narrative sections...
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Resume Narrative</h3>
                    <p className="text-sm text-muted-foreground">Career timeline sections. Drag to reorder, save individually.</p>
                </div>
                <Button size="sm" onClick={handleAddSection} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Section
                </Button>
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

            <div className="space-y-3">
                {sections.map((section, index) => {
                    const isExpanded = expandedId === section.id;
                    const isSaving = savingId === section.id;

                    return (
                        <Card key={section.id} className={section.id?.startsWith('new-') ? 'border-primary/30' : ''}>
                            {/* Collapsed Header */}
                            <div
                                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : section.id!)}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                                        disabled={index === 0}
                                    >
                                        <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                                        disabled={index === sections.length - 1}
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground">#{section.order}</span>
                                        <span className="font-medium truncate">{section.title || 'Untitled Section'}</span>
                                    </div>
                                    {section.period && (
                                        <span className="text-xs text-muted-foreground">{section.period}</span>
                                    )}
                                </div>
                                <Badge variant={section.published ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                    {section.published ? 'Published' : 'Draft'}
                                </Badge>
                            </div>

                            {/* Expanded Form */}
                            {isExpanded && (
                                <CardContent className="border-t pt-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor={`narr-title-${section.id}`} className="text-xs">Title</Label>
                                            <Input
                                                id={`narr-title-${section.id}`}
                                                value={section.title}
                                                onChange={(e) => handleFieldChange(section.id!, 'title', e.target.value)}
                                                placeholder="Section title"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`narr-period-${section.id}`} className="text-xs">Period</Label>
                                            <Input
                                                id={`narr-period-${section.id}`}
                                                value={section.period}
                                                onChange={(e) => handleFieldChange(section.id!, 'period', e.target.value)}
                                                placeholder="2020 - Present"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor={`narr-order-${section.id}`} className="text-xs">Order</Label>
                                            <Input
                                                id={`narr-order-${section.id}`}
                                                type="number"
                                                value={section.order}
                                                onChange={(e) => handleFieldChange(section.id!, 'order', parseInt(e.target.value) || 0)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`narr-icon-${section.id}`} className="text-xs">Icon</Label>
                                            <Input
                                                id={`narr-icon-${section.id}`}
                                                value={section.icon}
                                                onChange={(e) => handleFieldChange(section.id!, 'icon', e.target.value)}
                                                placeholder="briefcase"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`narr-iconType-${section.id}`} className="text-xs">Icon Type</Label>
                                            <Input
                                                id={`narr-iconType-${section.id}`}
                                                value={section.iconType}
                                                onChange={(e) => handleFieldChange(section.id!, 'iconType', e.target.value)}
                                                placeholder="lucide"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor={`narr-content-${section.id}`} className="text-xs">Content (Markdown)</Label>
                                        <Textarea
                                            id={`narr-content-${section.id}`}
                                            value={section.content}
                                            onChange={(e) => handleFieldChange(section.id!, 'content', e.target.value)}
                                            placeholder="Section content in markdown..."
                                            rows={8}
                                            className="font-mono text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={section.published}
                                                onChange={(e) => handleFieldChange(section.id!, 'published', e.target.checked)}
                                                className="rounded border-border"
                                            />
                                            <span className="text-sm">Published</span>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSaveSection(section)}
                                            disabled={isSaving}
                                            className="gap-1"
                                        >
                                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                            Save Section
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteSection(section)}
                                            disabled={isSaving}
                                            className="gap-1"
                                        >
                                            <Trash2 className="h-3 w-3" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}

                {sections.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No narrative sections yet. Click &quot;Add Section&quot; to create one.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
