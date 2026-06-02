import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function togglePredictionsLock() {
  "use server";

  const session = await getCurrentSession();
  if (!session || !session.user.isSystemAdmin) {
    return;
  }

  const setting = await prisma.appSetting.findUnique({
    where: {
      key: "predictions_locked",
    },
  });

  const currentValue = setting?.value === "true";
  const newValue = currentValue ? "false" : "true";

  await prisma.appSetting.upsert({
    where: {
      key: "predictions_locked",
    },
    update: {
      value: newValue,
    },
    create: {
      key: "predictions_locked",
      value: newValue,
    },
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/palpites");
}

export default async function AdminConfiguracoesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isSystemAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="text-2xl font-bold text-red-300">Acesso negado</h1>

          <p className="mt-2 text-red-100/80">
            Apenas administradores podem acessar as configurações.
          </p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950"
          >
            Voltar para Home
          </a>
        </div>
      </main>
    );
  }

  const setting = await prisma.appSetting.findUnique({
    where: {
      key: "predictions_locked",
    },
  });

  const locked = setting?.value === "true";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Admin
            </p>

            <h1 className="text-4xl font-bold">Configurações</h1>

            <p className="mt-2 text-zinc-400">
              Controle geral da liga e bloqueio de palpites.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Home
            </a>

            <a
              href="/admin/resultados"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Resultados
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="mb-6 flex items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">Bloqueio de palpites</h2>

              <p className="mt-2 text-zinc-400">
                Quando bloqueado, nenhum participante poderá criar ou editar
                palpites.
              </p>
            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                locked
                  ? "bg-red-500/10 text-red-300"
                  : "bg-green-500/10 text-green-300"
              }`}
            >
              {locked ? "Bloqueado" : "Liberado"}
            </div>
          </div>

          <form action={togglePredictionsLock}>
            <button
              type="submit"
              className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                locked
                  ? "bg-green-500 text-zinc-950 hover:bg-green-400"
                  : "bg-red-500 text-white hover:bg-red-400"
              }`}
            >
              {locked ? "Liberar palpites" : "Bloquear palpites"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-400">
            Regra do sistema: quando a Copa começar, o admin pode clicar em
            <strong className="text-red-300"> Bloquear palpites</strong>. Depois
            disso, os usuários ainda conseguem visualizar seus palpites, mas não
            conseguem alterar.
          </div>
        </div>
      </section>
    </main>
  );
}
