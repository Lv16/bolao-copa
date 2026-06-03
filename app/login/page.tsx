import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email")).toLowerCase().trim();
  const password = String(formData.get("password"));

  if (!email || !password) {
    return;
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
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return;
  }

  const cookieStore = await cookies();

    cookieStore.set('bolao_user_id', user.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    const membership = user.memberships[0];

    if (!membership) {
      redirect('/minhas-ligas');
    }

    cookieStore.set('bolao_league_id', membership.league.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

redirect('/minhas-ligas');

}


export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
          Login
        </p>

        <h1 className="text-3xl font-bold">Entrar no bolão</h1>

        <p className="mt-2 text-zinc-400">
          Acesse sua conta para continuar seus palpites.
        </p>

        <form action={login} className="mt-6 grid gap-4">
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
              placeholder="Sua senha"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-green-400"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
          >
            Entrar
          </button>
        </form>

        <div className="mt-5 flex justify-between text-sm">
          <a href="/entrar/COPA26" className="text-zinc-400 hover:text-white">
            Entrar por convite
          </a>

          <a href="/" className="text-zinc-400 hover:text-white">
            Voltar
          </a>
        </div>
      </div>
    </main>
  );
}
