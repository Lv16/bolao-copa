import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { LoginScreen } from './login-screen';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    recovery?: string;
  }>;
};

async function login(formData: FormData) {
  'use server';

  const email = String(formData.get('email')).toLowerCase().trim();
  const password = String(formData.get('password'));

  if (!email || !password) {
    redirect('/login?error=missing_fields');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          league: true,
        },
      },
    },
  });

  if (!user) {
    redirect('/login?error=invalid_credentials');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    redirect('/login?error=invalid_credentials');
  }

  const cookieStore = await cookies();

  cookieStore.set('bolao_user_id', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  if (user.isSystemAdmin) {
    redirect('/admin/resultados');
  }

  const membership = user.memberships[0];

  if (!membership) {
    redirect('/inicio');
  }

  cookieStore.set('bolao_league_id', membership.league.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/inicio');
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, recovery } = await searchParams;

  return <LoginScreen error={error} recovery={recovery} loginAction={login} />;
}
