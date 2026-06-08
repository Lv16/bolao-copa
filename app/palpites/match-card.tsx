'use client';

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react';

type MatchCardProps = {
  action: (formData: FormData) => Promise<void>;
  matchId: string;
  matchNumber: number;
  startsAtLabel?: string | null;
  phase: string;
  homeName: string;
  awayName: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  finalHomeScore: string | number;
  finalAwayScore: string | number;
  predictionHomeScore?: number | null;
  predictionAwayScore?: number | null;
  predictionWinnerTeamId?: string | null;
  predictionPoints?: number | null;
  matchLocked: boolean;
  globalLocked: boolean;
};

function deriveWinnerTeamId(
  homeScore: string,
  awayScore: string,
  homeTeamId?: string | null,
  awayTeamId?: string | null
) {
  if (!homeTeamId || !awayTeamId || homeScore === '' || awayScore === '') {
    return '';
  }

  const home = Number(homeScore);
  const away = Number(awayScore);

  if (Number.isNaN(home) || Number.isNaN(away) || home === away) {
    return '';
  }

  return home > away ? homeTeamId : awayTeamId;
}

export function MatchCard({
  action,
  matchId,
  matchNumber,
  startsAtLabel,
  phase,
  homeName,
  awayName,
  homeFlag,
  awayFlag,
  homeTeamId,
  awayTeamId,
  finalHomeScore,
  finalAwayScore,
  predictionHomeScore,
  predictionAwayScore,
  predictionWinnerTeamId,
  predictionPoints,
  matchLocked,
  globalLocked,
}: MatchCardProps) {
  const [homeScore, setHomeScore] = useState(
    predictionHomeScore !== null && predictionHomeScore !== undefined
      ? String(predictionHomeScore)
      : ''
  );
  const [awayScore, setAwayScore] = useState(
    predictionAwayScore !== null && predictionAwayScore !== undefined
      ? String(predictionAwayScore)
      : ''
  );
  const [winnerTeamId, setWinnerTeamId] = useState(() => {
    if (predictionWinnerTeamId) {
      return predictionWinnerTeamId;
    }

    return deriveWinnerTeamId(
      predictionHomeScore !== null && predictionHomeScore !== undefined
        ? String(predictionHomeScore)
        : '',
      predictionAwayScore !== null && predictionAwayScore !== undefined
        ? String(predictionAwayScore)
        : '',
      homeTeamId,
      awayTeamId
    );
  });
  const [winnerWasAuto, setWinnerWasAuto] = useState(() => !predictionWinnerTeamId);
  const [selectionError, setSelectionError] = useState('');

  const isKnockout = phase !== 'GROUP';
  const isTie = useMemo(() => {
    if (homeScore === '' || awayScore === '') {
      return false;
    }

    return Number(homeScore) === Number(awayScore);
  }, [awayScore, homeScore]);

  function selectWinner(teamId: string | null | undefined) {
    if (!teamId || matchLocked || globalLocked) {
      return;
    }

    setWinnerTeamId(teamId);
    setWinnerWasAuto(false);
    setSelectionError('');
  }

  function syncWinner(nextHomeScore: string, nextAwayScore: string) {
    if (!isKnockout) {
      return;
    }

    if (nextHomeScore === '' || nextAwayScore === '') {
      setWinnerTeamId('');
      setWinnerWasAuto(true);
      return;
    }

    if (Number(nextHomeScore) === Number(nextAwayScore)) {
      if (winnerWasAuto) {
        setWinnerTeamId('');
      }
      return;
    }

    setWinnerTeamId(
      deriveWinnerTeamId(nextHomeScore, nextAwayScore, homeTeamId, awayTeamId)
    );
    setWinnerWasAuto(true);
    setSelectionError('');
  }

  function handleHomeScoreChange(value: string) {
    setHomeScore(value);
    syncWinner(value, awayScore);
  }

  function handleAwayScoreChange(value: string) {
    setAwayScore(value);
    syncWinner(homeScore, value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isKnockout || !isTie) {
      return;
    }

    if (!winnerTeamId) {
      event.preventDefault();
      setSelectionError('Empate no mata-mata: toque na selecao classificada antes de confirmar.');
    }
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="rounded-[2rem] bg-[#6f6f73] px-4 py-3 text-white shadow-[0_14px_32px_rgba(0,0,0,0.28)]"
    >
      <input type="hidden" name="matchId" value={matchId} />
      {isKnockout && <input type="hidden" name="winnerTeamId" value={winnerTeamId} />}

      <div className="mb-1 text-center text-[10px] text-white/70">
        Jogo {matchNumber}
        {startsAtLabel && <span className="ml-2">{startsAtLabel}</span>}
      </div>

      <div className="mx-auto mb-3 flex w-fit flex-col items-center rounded-md border border-white px-4 py-1 text-[10px] leading-none text-white">
        <span className="text-[8px] uppercase tracking-[0.04em] text-white/70">
          Resultado Final
        </span>
        <span className="mt-1 text-sm font-bold">
          {finalHomeScore} x {finalAwayScore}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-2">
        <div className="text-center">
          <div className="mx-auto min-h-[2.8rem] max-w-[6.4rem] text-[1.05rem] font-black leading-tight">
            {homeName}
          </div>
        </div>

        <div />

        <div className="text-center">
          <div className="mx-auto min-h-[2.8rem] max-w-[6.4rem] text-[1.05rem] font-black leading-tight">
            {awayName}
          </div>
        </div>

        <button
          type="button"
          onClick={() => selectWinner(homeTeamId)}
          disabled={!isKnockout || !isTie || matchLocked || globalLocked || !homeTeamId}
          className={`flex h-10 items-center justify-center rounded-xl transition ${
            isKnockout && isTie && winnerTeamId === homeTeamId
              ? 'bg-[#e1a81d]/25 ring-2 ring-[#e1a81d]'
              : ''
          }`}
          aria-label={`Selecionar ${homeName} como classificado`}
        >
          {homeFlag ? (
            <img
              src={homeFlag}
              alt={`Bandeira de ${homeName}`}
              className="h-8 w-12 object-contain"
            />
          ) : (
            <div className="h-8 w-12 rounded-sm border border-white/30" />
          )}
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <input
              name="homeScore"
              type="number"
              min="0"
              value={homeScore}
              onChange={(event) => handleHomeScoreChange(event.target.value)}
              disabled={matchLocked}
              className="h-9 w-10 rounded-[0.8rem] border border-[#2953d6] bg-[#ececec] text-center text-lg font-black text-[#1e2d6b] outline-none disabled:cursor-not-allowed disabled:opacity-60"
              required
            />
            <span className="text-2xl font-black text-white">X</span>
            <input
              name="awayScore"
              type="number"
              min="0"
              value={awayScore}
              onChange={(event) => handleAwayScoreChange(event.target.value)}
              disabled={matchLocked}
              className="h-9 w-10 rounded-[0.8rem] border border-[#2953d6] bg-[#ececec] text-center text-lg font-black text-[#1e2d6b] outline-none disabled:cursor-not-allowed disabled:opacity-60"
              required
            />
          </div>

          {isKnockout && isTie && (
            <div className="mt-3 text-center text-[10px] font-semibold text-white/90">
              Empate no mata-mata: toque na selecao classificada.
            </div>
          )}

          {selectionError && (
            <div className="mt-2 text-center text-[10px] font-semibold text-[#ffe38a]">
              {selectionError}
            </div>
          )}

          <button
            type="submit"
            disabled={matchLocked || globalLocked}
            className="mt-3 flex h-8 min-w-[6.2rem] items-center justify-center rounded-[0.8rem] border border-[#2953d6] bg-[#ececec] px-4 text-sm font-black text-[#3958c9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Confirmar
          </button>

          {predictionPoints !== null && predictionPoints !== undefined && (
            <div className="mt-2 text-[10px] text-white/80">
              Salvo • {predictionPoints} pts
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => selectWinner(awayTeamId)}
          disabled={!isKnockout || !isTie || matchLocked || globalLocked || !awayTeamId}
          className={`flex h-10 items-center justify-center rounded-xl transition ${
            isKnockout && isTie && winnerTeamId === awayTeamId
              ? 'bg-[#e1a81d]/25 ring-2 ring-[#e1a81d]'
              : ''
          }`}
          aria-label={`Selecionar ${awayName} como classificado`}
        >
          {awayFlag ? (
            <img
              src={awayFlag}
              alt={`Bandeira de ${awayName}`}
              className="h-8 w-12 object-contain"
            />
          ) : (
            <div className="h-8 w-12 rounded-sm border border-white/30" />
          )}
        </button>
      </div>
    </form>
  );
}
