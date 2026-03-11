import { PreapprovedMeet } from './PreapprovedMeet';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet | David Coleman',
  description: "You've been invited to schedule a meeting with David Coleman.",
};

export default async function PreapprovedMeetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PreapprovedMeet token={token} />;
}
