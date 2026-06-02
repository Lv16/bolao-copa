import { MatchPhase, MatchStatus } from '@prisma/client';

export function formatPhase(phase: MatchPhase) {
  const phases: Record<MatchPhase, string> = {
    GROUP: 'Fase de Grupos',
    ROUND_OF_32: '16 avos de Final',
    ROUND_OF_16: 'Oitavas de Final',
    QUARTER_FINAL: 'Quartas de Final',
    SEMI_FINAL: 'Semifinal',
    THIRD_PLACE: 'Disputa de 3º Lugar',
    FINAL: 'Final',
  };

  return phases[phase];
}

export function formatStatus(status: MatchStatus) {
  const statuses: Record<MatchStatus, string> = {
    SCHEDULED: 'Agendado',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Finalizado',
  };

  return statuses[status];
}