import { LoginScreen } from './login-screen';
import { getSingleParam } from '@/lib/route-params';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    recovery?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = getSingleParam(resolvedSearchParams.error, '');
  const recovery = getSingleParam(resolvedSearchParams.recovery, '');

  return <LoginScreen error={error} recovery={recovery} />;
}
