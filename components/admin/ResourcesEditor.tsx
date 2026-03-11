'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, Trash2, Pencil, X } from 'lucide-react';

interface Resource {
    id?: string;
    name: string;
    url: string;
    categories: string[];
    description: string;
    published: boolean;
}

interface ResourcesEditorProps {
    token: string;
}

const emptyResource: Resource = {
    name: '',
    url: '',
    categories: [],
    description: '',
    published: true,
};

const API_BASE = '/api/admin';

export function ResourcesEditor({ token }: ResourcesEditorProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Resource>({ ...emptyResource });
    const [categoriesInput, setCategoriesInput] = useState('');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchResources = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/resources`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch resources');
            const data = await res.json();
            setResources(data);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const resetForm = () => {
        setFormData({ ...emptyResource });
        setCategoriesInput('');
        setShowAddForm(false);
        setEditingId(null);
    };

    const startEdit = (resource: Resource) => {
        setFormData({ ...resource });
        setCategoriesInput((resource.categories || []).join(', '));
        setEditingId(resource.id || null);
        setShowAddForm(false);
        setMessage(null);
    };

    const startAdd = () => {
        resetForm();
        setShowAddForm(true);
        setEditingId(null);
        setMessage(null);
    };

    const handleCategoriesChange = (value: string) => {
        setCategoriesInput(value);
        const categories = value.split(',').map(c => c.trim()).filter(Boolean);
        setFormData({ ...formData, categories });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const isNew = !editingId;
            const url = isNew ? `${API_BASE}/resources` : `${API_BASE}/resources/${editingId}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to save resource');
            }

            setMessage({ type: 'success', text: isNew ? 'Resource added!' : 'Resource updated!' });
            resetForm();
            await fetchResources();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_BASE}/resources/${id}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to delete resource');
            }

            setMessage({ type: 'success', text: 'Resource deleted!' });
            if (editingId === id) resetForm();
            await fetchResources();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        }
    };

    const togglePublished = async (resource: Resource) => {
        try {
            const res = await fetch(`${API_BASE}/resources/${resource.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...resource, published: !resource.published }),
            });

            if (!res.ok) throw new Error('Failed to update resource');
            await fetchResources();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin h-4 w-4" /> Loading resources...
                </CardContent>
            </Card>
        );
    }

    const renderForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1">
                <Label htmlFor="res-name" className="text-xs">Name</Label>
                <Input
                    id="res-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Resource name"
                    className="h-8 text-sm"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="res-url" className="text-xs">URL</Label>
                <Input
                    id="res-url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    className="h-8 text-sm"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="res-categories" className="text-xs">Categories (comma-separated)</Label>
                <Input
                    id="res-categories"
                    value={categoriesInput}
                    onChange={(e) => handleCategoriesChange(e.target.value)}
                    placeholder="Development, AI"
                    className="h-8 text-sm"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="res-description" className="text-xs">Description</Label>
                <Input
                    id="res-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                    className="h-8 text-sm"
                />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        className="rounded border-border"
                    />
                    <span className="text-sm">Published</span>
                </label>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" onClick={resetForm}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    {editingId ? 'Update' : 'Add'}
                </Button>
            </div>
        </div>
    );

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Resources</CardTitle>
                <Button size="sm" onClick={startAdd} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Resource
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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

                {(showAddForm || editingId) && renderForm()}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium">Name</th>
                                <th className="text-left p-3 font-medium hidden md:table-cell">URL</th>
                                <th className="text-left p-3 font-medium hidden md:table-cell">Categories</th>
                                <th className="text-center p-3 font-medium">Status</th>
                                <th className="text-right p-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resources.map((resource) => (
                                <tr key={resource.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="p-3">
                                        <div className="font-medium">{resource.name}</div>
                                        <div className="text-xs text-muted-foreground md:hidden truncate">
                                            {resource.url}
                                        </div>
                                    </td>
                                    <td className="p-3 hidden md:table-cell">
                                        <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                                            {resource.url}
                                        </span>
                                    </td>
                                    <td className="p-3 hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {(resource.categories || []).map((cat) => (
                                                <Badge key={cat} variant="outline" className="text-[10px] px-1.5 py-0">
                                                    {cat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => togglePublished(resource)}
                                            className="cursor-pointer"
                                            title={resource.published ? 'Click to unpublish' : 'Click to publish'}
                                        >
                                            <Badge variant={resource.published ? 'default' : 'secondary'}>
                                                {resource.published ? 'Live' : 'Draft'}
                                            </Badge>
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => startEdit(resource)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(resource.id!, resource.name)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {resources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                        No resources yet. Click &quot;Add Resource&quot; to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
