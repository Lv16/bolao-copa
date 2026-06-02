import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

type PageProps = {
  params: Promise<{
    inviteCode: string;
  }>;
};

async function joinLeague(formData: FormData) {
  "use server";

  const inviteCode = String(formData.get("inviteCode"));
  const name = String(formData.get("name"));
  const email = String(formData.get("email")).toLowerCase().trim();
  const password = String(formData.get("password"));

  if (!inviteCode || !name || !email || !password) {
    return;
  }

  const league = await prisma.league.findUnique({
    where: {
      inviteCode,
    },
  });

  if (!league) {
    return;
  }

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
  }

  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      leagueId: league.id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  const cookieStore = await cookies();

  cookieStore.set("bolao_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  cookieStore.set("bolao_league_id", league.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/liga");
}

export default async function EntrarLigaPage({ params }: PageProps) {
  const { inviteCode } = await params;

  const league = await prisma.league.findUnique({
    where: {
      inviteCode,
    },
  });

  if (!league) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h1 className="text-2xl font-bold">Liga não encontrada</h1>
          <p className="mt-2 text-zinc-400">
            Verifique se o link de convite está correto.
          </p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950"
          >
            Voltar
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
          Convite
        </p>

        <h1 className="text-3xl font-bold">Entrar na liga</h1>

        <p className="mt-2 text-zinc-400">
          Você foi convidado para participar do bolão:
        </p>

        <div className="mt-5 rounded-2xl bg-green-500/10 p-4 text-green-300">
          <strong>{league.name}</strong>
          <div className="mt-1 text-sm">Código: {league.inviteCode}</div>
        </div>

        <form action={joinLeague} className="mt-6 grid gap-4">
          <input type="hidden" name="inviteCode" value={league.inviteCode} />

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
            Entrar na Liga
          </button>
        </form>

        <a
          href="/"
          className="mt-5 inline-flex text-sm text-zinc-400 hover:text-white"
        >
          Voltar para home
        </a>
      </div>
    </main>
  );
}
