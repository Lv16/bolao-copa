import { redirect } from 'next/navigation';

import { getCurrentSession } from '@/lib/auth';

export default async function EntryPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect('/inicio');
  }

  redirect('/login');
}
