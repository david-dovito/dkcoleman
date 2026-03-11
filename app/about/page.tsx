import { getAboutSections } from '@/lib/queries/about';
import AboutClient from '@/components/about/AboutClient';

export default async function AboutPage() {
  const data = await getAboutSections();

  return <AboutClient data={data} />;
}
