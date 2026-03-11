'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, Trash2, Pencil, X } from 'lucide-react';

interface Project {
    id?: string;
    name: string;
    description: string;
    url: string;
    tech: string[];
    date: string;
    published: boolean;
    photo: string;
}

interface ProjectsEditorProps {
    token: string;
}

const emptyProject: Project = {
    name: '',
    description: '',
    url: '',
    tech: [],
    date: new Date().toISOString().split('T')[0],
    published: true,
    photo: '',
};

const API_BASE = '/api/admin';

export function ProjectsEditor({ token }: ProjectsEditorProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [techInput, setTechInput] = useState('');
    const [isNew, setIsNew] = useState(false);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/projects`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch projects');
            const data = await res.json();
            setProjects(data);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const startEdit = (project: Project) => {
        setEditingProject({ ...project });
        setTechInput((project.tech || []).join(', '));
        setIsNew(false);
        setMessage(null);
    };

    const startAdd = () => {
        setEditingProject({ ...emptyProject });
        setTechInput('');
        setIsNew(true);
        setMessage(null);
    };

    const cancelEdit = () => {
        setEditingProject(null);
        setTechInput('');
        setIsNew(false);
    };

    const handleTechChange = (value: string) => {
        setTechInput(value);
        const tech = value.split(',').map(t => t.trim()).filter(Boolean);
        if (editingProject) {
            setEditingProject({ ...editingProject, tech });
        }
    };

    const handleFieldChange = (field: keyof Project, value: any) => {
        if (!editingProject) return;
        setEditingProject({ ...editingProject, [field]: value });
    };

    const handleSave = async () => {
        if (!editingProject) return;
        setSaving(true);
        setMessage(null);

        try {
            const url = isNew ? `${API_BASE}/projects` : `${API_BASE}/projects/${editingProject.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(editingProject),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to save project');
            }

            setMessage({ type: 'success', text: isNew ? 'Project created!' : 'Project updated!' });
            cancelEdit();
            await fetchProjects();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || 'Failed to delete project');
            }

            setMessage({ type: 'success', text: 'Project deleted!' });
            if (editingProject?.id === id) cancelEdit();
            await fetchProjects();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin h-4 w-4" /> Loading projects...
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Projects</h3>
                <Button size="sm" onClick={startAdd} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Project
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

            {/* Edit / Add Form */}
            {editingProject && (
                <Card className="border-primary/30">
                    <CardHeader>
                        <CardTitle className="text-base">{isNew ? 'New Project' : 'Edit Project'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="proj-name" className="text-xs">Name</Label>
                                <Input
                                    id="proj-name"
                                    value={editingProject.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    placeholder="Project name"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="proj-url" className="text-xs">URL</Label>
                                <Input
                                    id="proj-url"
                                    value={editingProject.url}
                                    onChange={(e) => handleFieldChange('url', e.target.value)}
                                    placeholder="https://..."
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="proj-description" className="text-xs">Description</Label>
                            <Textarea
                                id="proj-description"
                                value={editingProject.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                placeholder="Project description"
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="proj-tech" className="text-xs">Tech Tags (comma-separated)</Label>
                                <Input
                                    id="proj-tech"
                                    value={techInput}
                                    onChange={(e) => handleTechChange(e.target.value)}
                                    placeholder="React, TypeScript, Node.js"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="proj-photo" className="text-xs">Photo URL</Label>
                                <Input
                                    id="proj-photo"
                                    value={editingProject.photo}
                                    onChange={(e) => handleFieldChange('photo', e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingProject.published}
                                    onChange={(e) => handleFieldChange('published', e.target.checked)}
                                    className="rounded border-border"
                                />
                                <span className="text-sm">Published</span>
                            </label>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {isNew ? 'Create' : 'Update'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                    <Card key={project.id} className="overflow-hidden">
                        {project.photo && (
                            <div className="h-32 overflow-hidden bg-muted">
                                <img
                                    src={project.photo}
                                    alt={project.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-base">{project.name}</CardTitle>
                                    {project.url && (
                                        <CardDescription className="text-xs truncate max-w-[250px]">
                                            {project.url}
                                        </CardDescription>
                                    )}
                                </div>
                                <Badge variant={project.published ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                    {project.published ? 'Live' : 'Draft'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                            )}
                            {(project.tech || []).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {project.tech.map((t) => (
                                        <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                                            {t}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                                <Button size="sm" variant="outline" onClick={() => startEdit(project)} className="gap-1 h-7 text-xs">
                                    <Pencil className="h-3 w-3" /> Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(project.id!, project.name)}
                                    className="gap-1 h-7 text-xs text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {projects.length === 0 && (
                    <Card className="md:col-span-2">
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No projects yet. Click &quot;Add Project&quot; to create one.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
