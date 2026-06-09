import { LoginScreen } from './login-screen';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    recovery?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, recovery } = await searchParams;

  return <LoginScreen error={error} recovery={recovery} />;
}
