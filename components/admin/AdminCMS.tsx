'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BlogEditor } from './BlogEditor';
import { ResourcesEditor } from './ResourcesEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { AboutEditor } from './AboutEditor';
import { ResumeEditor } from './ResumeEditor';
import { NarrativeEditor } from './NarrativeEditor';

interface AdminCMSProps {
    token: string;
}

export function AdminCMS({ token }: AdminCMSProps) {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Content Management</h2>
            <Tabs defaultValue="blog" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="blog">Blog</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="resume">Resume</TabsTrigger>
                    <TabsTrigger value="narrative">Narrative</TabsTrigger>
                </TabsList>

                <TabsContent value="blog">
                    <BlogEditor token={token} />
                </TabsContent>

                <TabsContent value="resources">
                    <ResourcesEditor token={token} />
                </TabsContent>

                <TabsContent value="projects">
                    <ProjectsEditor token={token} />
                </TabsContent>

                <TabsContent value="about">
                    <AboutEditor token={token} />
                </TabsContent>

                <TabsContent value="resume">
                    <ResumeEditor token={token} />
                </TabsContent>

                <TabsContent value="narrative">
                    <NarrativeEditor token={token} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
