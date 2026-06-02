import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

async function createLeague(formData: FormData) {
  "use server";

  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const name = String(formData.get("name")).trim();

  if (!name) {
    return;
  }

  let inviteCode = generateInviteCode();

  let existingLeague = await prisma.league.findUnique({
    where: {
      inviteCode,
    },
  });

  while (existingLeague) {
    inviteCode = generateInviteCode();

    existingLeague = await prisma.league.findUnique({
      where: {
        inviteCode,
      },
    });
  }

  const league = await prisma.league.create({
    data: {
      name,
      inviteCode,
      ownerId: session.user.id,
    },
  });

  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  const cookieStore = await cookies();

  cookieStore.set("bolao_league_id", league.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/liga");
}

export default async function CriarLigaPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
          Liga
        </p>

        <h1 className="text-3xl font-bold">Criar nova liga</h1>

        <p className="mt-2 text-zinc-400">
          Você será o administrador dessa liga e poderá convidar outros
          participantes.
        </p>

        <form action={createLeague} className="mt-6 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Nome da liga
            </label>

            <input
              name="name"
              type="text"
              placeholder="Ex: Bolão da Firma"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-green-400"
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
          >
            Criar Liga
          </button>
        </form>

        <a
          href="/"
          className="mt-5 inline-flex text-sm text-zinc-400 hover:text-white"
        >
          Voltar
        </a>
      </div>
    </main>
  );
}
