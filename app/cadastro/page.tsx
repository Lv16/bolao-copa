import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

async function register(formData: FormData) {
  'use server';

  const name = String(formData.get('name')).trim();
  const email = String(formData.get('email')).toLowerCase().trim();
  const password = String(formData.get('password'));

  if (!name || !email || !password) {
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    const cookieStore = await cookies();

    cookieStore.set('bolao_user_id', existingUser.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    redirect('/minhas-ligas');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set('bolao_user_id', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/minhas-ligas');
}

export default function CadastroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
          Cadastro
        </p>

        <h1 className="text-3xl font-bold">
          Criar conta
        </h1>

        <p className="mt-2 text-zinc-400">
          Crie sua conta para montar uma liga ou participar de um bolão.
        </p>

        <form action={register} className="mt-6 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Nome
            </label>
            <input
              name="name"
              type="text"
              placeholder="Seu nome"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-green-400"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              placeholder="seuemail@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-green-400"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Senha
            </label>
            <input
              name="password"
              type="password"
              placeholder="Crie uma senha"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-green-400"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
          >
            Criar conta
          </button>
        </form>

        <div className="mt-5 flex justify-between text-sm">
          <a href="/login" className="text-zinc-400 hover:text-white">
            Já tenho conta
          </a>

          <a href="/" className="text-zinc-400 hover:text-white">
            Voltar
          </a>
        </div>
      </div>
    </main>
  );
}