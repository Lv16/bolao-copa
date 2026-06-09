import { redirect } from 'next/navigation';

import { getCurrentSession, getCurrentUser } from '@/lib/auth';

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireSession() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const session = await getCurrentSession();

  if (!session) {
    redirect('/minhas-ligas');
  }

  return session;
}
