import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete('bolao_user_id');
  cookieStore.delete('bolao_league_id');

  redirect('/login');
}