import { MatchPhase } from '@prisma/client';

import { formatPhase, formatStatus } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-session';
import { getRoundOf32ThirdSlotsState } from '@/lib/third-place-admin';
import { AdminResultsWorkspace } from './workspace';

const phaseOrder: MatchPhase[] = [
  'GROUP',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
];

export default async function AdminResultadosPage() {
  const user = await requireUser();

  if (!user.isSystemAdmin) {
    return (
      <main className="min-h-screen bg-stone-950 text-white">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
            <h1 className="text-3xl font-black text-red-200">Acesso negado</h1>
            <p className="mt-3 text-sm text-red-100/80">
              Apenas o administrador geral pode editar resultados e montar os 16 avos.
            </p>
            <a
              href="/"
              className="mt-6 inline-flex rounded-2xl border border-red-200/20 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10"
            >
              Voltar para a home
            </a>
          </div>
        </section>
      </main>
    );
  }

  const [matches, roundOf32State] = await Promise.all([
    prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        number: 'asc',
      },
    }),
    getRoundOf32ThirdSlotsState(),
  ]);

  const phaseSections = phaseOrder
    .map((phase) => {
      const phaseMatches = matches.filter((match) => match.phase === phase);

      if (phaseMatches.length === 0) {
        return null;
      }

      const groupsMap = phaseMatches.reduce((acc, match) => {
        const groupKey = phase === 'GROUP' ? match.groupName ?? 'SEM_GRUPO' : 'FASE';

        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }

        acc[groupKey].push({
          id: match.id,
          number: match.number,
          phase: match.phase,
          phaseLabel: formatPhase(match.phase),
          groupName: match.groupName,
          homeTeamId: match.homeTeam?.id ?? null,
          awayTeamId: match.awayTeam?.id ?? null,
          homeTeamName: match.homeTeam?.name ?? match.homeSlot ?? 'A definir',
          awayTeamName: match.awayTeam?.name ?? match.awaySlot ?? 'A definir',
          homeSlot: match.homeSlot,
          awaySlot: match.awaySlot,
          startsAtLabel: match.startsAt
            ? match.startsAt.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : 'Sem data definida',
          status: match.status,
          statusLabel: formatStatus(match.status),
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          winnerTeamId: match.winnerTeamId,
          isFinished: match.status === 'FINISHED',
        });

        return acc;
      }, {} as Record<string, Array<{
        id: string;
        number: number;
        phase: MatchPhase;
        phaseLabel: string;
        groupName: string | null;
        homeTeamId: string | null;
        awayTeamId: string | null;
        homeTeamName: string;
        awayTeamName: string;
        homeSlot: string | null;
        awaySlot: string | null;
        startsAtLabel: string;
        status: string;
        statusLabel: string;
        homeScore: number | null;
        awayScore: number | null;
        winnerTeamId: string | null;
        isFinished: boolean;
      }>>);

      const groups = Object.entries(groupsMap).map(([groupKey, groupMatches]) => ({
        key: groupKey,
        label: phase === 'GROUP' ? `Grupo ${groupKey}` : formatPhase(phase),
        matches: groupMatches,
      }));

      return {
        phase,
        label: formatPhase(phase),
        groups,
      };
    })
    .filter((section): section is NonNullable<typeof section> => Boolean(section));

  const standingsGroups = Object.keys(roundOf32State.standingsByGroup)
    .sort()
    .map((groupName) => ({
      groupName,
      rows: roundOf32State.standingsByGroup[groupName].map((row, index) => ({
        ...row,
        position: index + 1,
      })),
    }));

  const thirdRanking = roundOf32State.thirdRows.map((row) => ({
    ...row,
    isSuggested: roundOf32State.suggestedGroupNames.includes(row.groupName),
    isConfirmed: roundOf32State.confirmedGroupNames.includes(row.groupName),
  }));

  const roundOf32MatchesById = new Map(
    roundOf32State.roundOf32Matches.map((match) => [match.id, match])
  );

  const complexSlots = roundOf32State.slots.map((slot) => {
    const match = roundOf32MatchesById.get(slot.matchId);

    return {
      key: slot.key,
      matchId: slot.matchId,
      matchNumber: slot.matchNumber,
      side: slot.side,
      slotLabel: slot.slotLabel,
      allowedGroupNames: slot.allowedGroupNames,
      currentGroupName: slot.currentGroupName,
      suggestedGroupName: slot.suggestedGroupName,
      selectedTeamName: slot.selectedRow?.teamName ?? null,
      suggestedTeamName: slot.suggestedRow?.teamName ?? null,
      opponentTeamName:
        slot.side === 'HOME'
          ? match?.awayTeam?.name ?? match?.awaySlot ?? 'A definir'
          : match?.homeTeam?.name ?? match?.homeSlot ?? 'A definir',
    };
  });

  return (
    <AdminResultsWorkspace
      phaseSections={phaseSections}
      standingsGroups={standingsGroups}
      thirdRanking={thirdRanking}
      confirmedGroupNames={roundOf32State.confirmedGroupNames}
      suggestedGroupNames={roundOf32State.suggestedGroupNames}
      confirmedValidationErrors={roundOf32State.confirmedValidation.errors}
      complexSlots={complexSlots}
      slotAssignmentErrors={roundOf32State.assignmentValidation.errors}
    />
  );
}
