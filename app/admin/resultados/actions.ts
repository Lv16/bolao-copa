'use server';

import { MatchStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth';
import { advanceKnockoutWinner, resolveSimpleKnockoutSlots } from '@/lib/knockout';
import { prisma } from '@/lib/prisma';
import {
  deleteKnockoutThirdSlotAssignment,
  getGroupStageSnapshot,
  getRoundOf32ThirdSlotsState,
  replaceConfirmedThirdPlaceGroupNames,
  replaceKnockoutThirdSlotAssignments,
  saveKnockoutThirdSlotAssignment,
} from '@/lib/third-place-admin';
import {
  buildSuggestedThirdSlotAssignments,
  type KnockoutSlotSide,
  validateThirdSlotAssignments,
} from '@/lib/third-slot-assignments';
import { validateConfirmedThirdPlaceGroups } from '@/lib/third-places';
import {
  calculateGroupPredictionPoints,
  calculateKnockoutPredictionPoints,
} from '@/lib/prediction-scoring';

type AdminActionResult = {
  ok: boolean;
  message: string;
  errors?: string[];
};

type MatchResultInput = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  winnerTeamId?: string | null;
};

async function requireSystemAdmin() {
  const user = await getCurrentUser();

  if (!user || !user.isSystemAdmin) {
    throw new Error('Apenas o administrador geral pode executar esta acao.');
  }

  return user;
}

function success(message: string): AdminActionResult {
  return { ok: true, message };
}

function failure(message: string, errors?: string[]): AdminActionResult {
  return { ok: false, message, errors };
}

function revalidateAdminViews() {
  revalidatePath('/');
  revalidatePath('/palpites');
  revalidatePath('/ranking');
  revalidatePath('/admin/resultados');
  revalidatePath('/admin/classificacao');
  revalidatePath('/admin/terceiros');
}

async function recalculatePredictions(matchId: string) {
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
    },
    include: {
      predictions: true,
    },
  });

  if (!match || match.homeScore === null || match.awayScore === null) {
    return;
  }

  const realHome = match.homeScore;
  const realAway = match.awayScore;

  for (const prediction of match.predictions) {
    let points = 0;

    if (match.phase !== 'GROUP') {
      const realWinnerTeamId =
        match.winnerTeamId ??
        (realHome > realAway
          ? match.homeTeamId
          : realAway > realHome
            ? match.awayTeamId
            : null);

      points = calculateKnockoutPredictionPoints({
        realHomeScore: realHome,
        realAwayScore: realAway,
        predictedHomeScore: prediction.homeScore,
        predictedAwayScore: prediction.awayScore,
        realWinnerTeamId,
        predictedWinnerTeamId: prediction.winnerTeamId,
      });
    } else {
      points = calculateGroupPredictionPoints({
        realHomeScore: realHome,
        realAwayScore: realAway,
        predictedHomeScore: prediction.homeScore,
        predictedAwayScore: prediction.awayScore,
      });
    }

    await prisma.prediction.update({
      where: {
        id: prediction.id,
      },
      data: {
        points,
      },
    });
  }
}

async function applySingleMatchResult(input: MatchResultInput) {
  const match = await prisma.match.findUnique({
    where: {
      id: input.matchId,
    },
    select: {
      id: true,
      phase: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });

  if (!match) {
    throw new Error('Jogo nao encontrado.');
  }

  const winnerTeamId =
    match.phase === 'GROUP'
      ? null
      : input.winnerTeamId && [match.homeTeamId, match.awayTeamId].includes(input.winnerTeamId)
        ? input.winnerTeamId
        : input.homeScore === input.awayScore
          ? null
          : input.homeScore > input.awayScore
            ? match.homeTeamId
            : match.awayTeamId;

  await prisma.match.update({
    where: {
      id: input.matchId,
    },
    data: {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      status: MatchStatus.FINISHED,
      winnerTeamId,
    },
  });

  await recalculatePredictions(input.matchId);
  await resolveSimpleKnockoutSlots();

  if (match.phase !== 'GROUP') {
    await advanceKnockoutWinner(input.matchId);
  }
}

export async function saveMatchResult(input: MatchResultInput): Promise<AdminActionResult> {
  try {
    await requireSystemAdmin();

    if (!input.matchId || Number.isNaN(input.homeScore) || Number.isNaN(input.awayScore)) {
      return failure('Resultado invalido.', ['Preencha um placar valido.']);
    }

    await applySingleMatchResult(input);
    revalidateAdminViews();

    return success('Resultado salvo com sucesso.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar resultado.';
    return failure('Nao foi possivel salvar o resultado.', [message]);
  }
}

export async function saveBatchMatchResults(inputs: MatchResultInput[]): Promise<AdminActionResult> {
  try {
    await requireSystemAdmin();

    const validInputs = inputs.filter(
      (input) =>
        input.matchId &&
        Number.isFinite(input.homeScore) &&
        Number.isFinite(input.awayScore)
    );

    if (validInputs.length === 0) {
      return failure('Nenhum jogo valido para salvar.', ['Preencha ao menos um placar.']);
    }

    for (const input of validInputs) {
      await applySingleMatchResult(input);
    }

    revalidateAdminViews();
    return success(`${validInputs.length} jogo(s) salvo(s) com sucesso.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar resultados em lote.';
    return failure('Nao foi possivel salvar os resultados em lote.', [message]);
  }
}

export async function saveConfirmedThirdGroups(groupNames: string[]): Promise<AdminActionResult> {
  try {
    await requireSystemAdmin();

    const snapshot = await getGroupStageSnapshot();
    const validation = validateConfirmedThirdPlaceGroups(snapshot.thirdRows, groupNames);

    if (!validation.isValid) {
      return failure('A lista oficial dos terceiros ainda esta invalida.', validation.errors);
    }

    await replaceConfirmedThirdPlaceGroupNames(validation.confirmedGroupNames);
    await resolveSimpleKnockoutSlots();
    revalidateAdminViews();

    return success('Lista oficial dos 8 terceiros confirmada.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao confirmar terceiros.';
    return failure('Nao foi possivel confirmar os terceiros.', [message]);
  }
}

export async function applySuggestedThirdGroups(): Promise<AdminActionResult> {
  try {
    await requireSystemAdmin();

    const snapshot = await getGroupStageSnapshot();
    await replaceConfirmedThirdPlaceGroupNames(snapshot.suggestedGroupNames);
    await resolveSimpleKnockoutSlots();
    revalidateAdminViews();

    return success('Sugestao automatica aplicada aos terceiros classificados.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao aplicar sugestao automatica.';
    return failure('Nao foi possivel aplicar a sugestao automatica.', [message]);
  }
}

export async function saveThirdSlotAssignment(input: {
  matchId: string;
  side: KnockoutSlotSide;
  selectedGroupName: string | null;
}): Promise<AdminActionResult> {
  try {
    await requireSystemAdmin();

    const state = await getRoundOf32ThirdSlotsState();
    const definition = state.definitions.find(
      (slot) => slot.matchId === input.matchId && slot.side === input.side
    );

    if (!definition) {
      return failure('Slot complexo nao encontrado.', ['O confronto informado nao possui slot complexo.']);
    }

    if (!input.selectedGroupName) {
      await deleteKnockoutThirdSlotAssignment(input.matchId, input.side);
      await resolveSimpleKnockoutSlots();
      revalidateAdminViews();

      return success('Atribuicao do slot removida.');
    }

    const nextAssignments = {
      ...state.assignments,
      [`${input.matchId}:${input.side}`]: input.selectedGroupName,
    };
    const validation = validateThirdSlotAssignments({
      slots: state.definitions,
      confirmedGroupNames: state.confirmedValidation.confirmedGroupNames,
      assignments: nextAssignments,
    });

    if (!validation.isValid) {
      return failure('A atribuicao do slot ficou inconsistente.', validation.errors);
    }

    await saveKnockoutThirdSlotAssignment({
      matchId: input.matchId,
      side: input.side,
      selectedGroupName: input.selectedGroupName,
    });
    await resolveSimpleKnockoutSlots();
    revalidateAdminViews();

    return success('Slot complexo atualizado.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar slot complexo.';
    return failure('Nao foi possivel atualizar o slot complexo.', [message]);
  }
}

export async function applySuggestedThirdSlotAssignments(): Promise<AdminActionResult> {
  try {
    await requireSystemAdmin();

    const state = await getRoundOf32ThirdSlotsState();

    if (!state.confirmedValidation.isValid) {
      return failure('Confirme exatamente 8 terceiros antes de montar os 16 avos.', state.confirmedValidation.errors);
    }

    const suggestedAssignments = buildSuggestedThirdSlotAssignments(
      state.definitions,
      state.confirmedValidation.confirmedGroupNames
    );

    if (suggestedAssignments.size !== state.definitions.length) {
      return failure('Nao foi possivel resolver todos os slots automaticamente.', [
        'A sugestao automatica nao encontrou encaixe completo para todos os slots complexos.',
      ]);
    }

    await replaceKnockoutThirdSlotAssignments(
      state.definitions.map((definition) => ({
        matchId: definition.matchId,
        side: definition.side,
        selectedGroupName: suggestedAssignments.get(definition.key)!,
      }))
    );
    await resolveSimpleKnockoutSlots();
    revalidateAdminViews();

    return success('Slots complexos dos 16 avos atualizados com a sugestao automatica.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao aplicar sugestao de slots.';
    return failure('Nao foi possivel atualizar os slots complexos.', [message]);
  }
}
