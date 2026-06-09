import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionCookieName } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete(sessionCookieName);

  redirect('/login');
}
