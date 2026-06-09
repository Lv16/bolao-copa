import { redirect } from 'next/navigation';

import { getCurrentSession, getCurrentUser } from '@/lib/auth';

export default async function EntryPage() {
  const user = await getCurrentUser();
  const session = await getCurrentSession();

  if (session) {
    redirect('/inicio');
  }

  if (user) {
    redirect('/inicio');
  }

  redirect('/login');
}
