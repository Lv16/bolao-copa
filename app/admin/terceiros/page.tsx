import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateGroupStandings, getQualifiedSlots } from '@/lib/standings';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function isComplexThirdSlot(slot: string | null) {
  if (!slot) return false;

  return slot.startsWith('3') && slot.includes('/');
}

function getThirdSlotOptions(slot: string) {
  const groups = slot.replace('3', '').split('/');

  return groups.map((group) => `3${group}`);
}

async function resolveThirdSlot(formData: FormData) {
  'use server';

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.isSystemAdmin) {
    return;
  }

  const matchId = String(formData.get('matchId'));
  const side = String(formData.get('side'));
  const selectedSlot = String(formData.get('selectedSlot'));

  if (!matchId || !side || !selectedSlot) {
    return;
  }

  const groupMatches = await prisma.match.findMany({
    where: {
      phase: 'GROUP',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  const standingsByGroup = calculateGroupStandings(groupMatches);
  const qualifiedSlots = getQualifiedSlots(standingsByGroup);

  const selectedTeam = qualifiedSlots[selectedSlot];

  if (!selectedTeam) {
    return;
  }

  await prisma.match.update({
    where: {
      id: matchId,
    },
    data:
      side === 'HOME'
        ? {
            homeTeamId: selectedTeam.teamId,
          }
        : {
            awayTeamId: selectedTeam.teamId,
          },
  });

  revalidatePath('/admin/terceiros');
  revalidatePath('/admin/resultados');
  revalidatePath('/palpites');
  revalidatePath('/');
}

export default async function AdminTerceirosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.isSystemAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
          <h1 className="text-2xl font-bold text-red-300">
            Acesso negado
          </h1>

          <p className="mt-2 text-red-100/80">
            Apenas o admin do sistema pode definir os terceiros colocados.
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

  const groupMatches = await prisma.match.findMany({
    where: {
      phase: 'GROUP',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  const standingsByGroup = calculateGroupStandings(groupMatches);
  const qualifiedSlots = getQualifiedSlots(standingsByGroup);

  const knockoutMatches = await prisma.match.findMany({
    where: {
      phase: 'ROUND_OF_32',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      number: 'asc',
    },
  });

  const matchesWithThirdSlots = knockoutMatches.filter(
    (match) =>
      isComplexThirdSlot(match.homeSlot) ||
      isComplexThirdSlot(match.awaySlot)
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Admin
            </p>

            <h1 className="text-4xl font-bold">
              Terceiros colocados
            </h1>

            <p className="mt-2 text-zinc-400">
              Escolha manualmente qual 3º colocado entra nos slots complexos do mata-mata.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/classificacao"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              Classificação
            </a>

            <a
              href="/admin/resultados"
              className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
            >
              Resultados
            </a>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">
            Terceiros calculados pelo sistema
          </h2>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Object.entries(qualifiedSlots)
              .filter(([slot]) => slot.startsWith('3'))
              .map(([slot, team]) => (
                <div
                  key={slot}
                  className="rounded-2xl bg-zinc-950 p-4"
                >
                  <div className="text-sm font-bold text-yellow-300">
                    {slot}
                  </div>

                  <div className="mt-1 font-bold">
                    {team.teamName}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {team.points} pts • SG {team.goalDifference}
                  </div>
                </div>
              ))}

            {Object.entries(qualifiedSlots).filter(([slot]) =>
              slot.startsWith('3')
            ).length === 0 && (
              <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
                Ainda não há terceiros calculados. Lance os resultados da fase de grupos primeiro.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {matchesWithThirdSlots.map((match) => {
            const complexSide = isComplexThirdSlot(match.homeSlot)
              ? 'HOME'
              : 'AWAY';

            const complexSlot =
              complexSide === 'HOME' ? match.homeSlot! : match.awaySlot!;

            const options = getThirdSlotOptions(complexSlot);

            const selectedTeam =
              complexSide === 'HOME' ? match.homeTeam : match.awayTeam;

            return (
              <div
                key={match.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                      Jogo {match.number}
                    </span>

                    <span className="ml-2 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                      Slot: {complexSlot}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-500">
                    {selectedTeam
                      ? `Definido: ${selectedTeam.name}`
                      : 'Ainda não definido'}
                  </span>
                </div>

                <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl bg-zinc-950 p-5">
                  <div className="text-right">
                    <p className="font-bold">
                      {match.homeTeam?.name ?? match.homeSlot}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {match.homeSlot}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-800 px-4 py-2 font-bold">
                    x
                  </div>

                  <div>
                    <p className="font-bold">
                      {match.awayTeam?.name ?? match.awaySlot}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {match.awaySlot}
                    </p>
                  </div>
                </div>

                <form
                  action={resolveThirdSlot}
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="matchId" value={match.id} />
                  <input type="hidden" name="side" value={complexSide} />

                  <div className="min-w-72 flex-1">
                    <label className="mb-2 block text-sm font-semibold text-zinc-300">
                      Escolher terceiro colocado
                    </label>

                    <select
                      name="selectedSlot"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-green-400"
                      required
                    >
                      <option value="">Selecione...</option>

                      {options.map((slot) => {
                        const team = qualifiedSlots[slot];

                        return (
                          <option
                            key={slot}
                            value={slot}
                            disabled={!team}
                          >
                            {team
                              ? `${slot} - ${team.teamName}`
                              : `${slot} - aguardando classificação`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-green-400"
                  >
                    Salvar terceiro
                  </button>
                </form>
              </div>
            );
          })}

          {matchesWithThirdSlots.length === 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
              Nenhum jogo com slot complexo de terceiro foi encontrado.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
