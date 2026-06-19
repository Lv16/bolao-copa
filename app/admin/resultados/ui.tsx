import type { MatchPhase } from '@prisma/client';

import type { MatchTone } from '@/lib/admin-results-view';

import type {
  ComplexSlotView,
  Draft,
  FeedbackTone,
  MatchView,
  PhaseSection,
  StandingsGroup,
  ThirdRankingRow,
} from './types';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AdminResultsHeader(props: {
  currentPhaseLabel: string;
  visibleMatchCount: number;
  thirdSelectedCount: number;
  totalThirdCount: number;
  resolvedSlotsCount: number;
  totalSlotsCount: number;
}) {
  const selectionState =
    props.thirdSelectedCount === 8
      ? 'Pronto para confirmar'
      : props.thirdSelectedCount < 8
        ? `Faltam ${8 - props.thirdSelectedCount}`
        : `Remova ${props.thirdSelectedCount - 8}`;

  return (
    <section className="w-full max-w-full overflow-hidden rounded-[2rem] border border-[#dacdb7] bg-[linear-gradient(180deg,#fffdf7_0%,#f8f1e2_100%)] shadow-[0_22px_70px_rgba(59,41,13,0.08)]">
      <div className="border-b border-[#e8dcc7] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9a6b14]">
              Admin geral
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#23180d] sm:text-[2.6rem]">
              Resultados oficiais
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6b604f]">
              Lance placares, acompanhe a classificacao dos grupos e confirme os terceiros
              classificados sem perder o fluxo da operacao.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <NavLink href="/admin/classificacao" label="Classificacao" />
            <NavLink href="/admin/terceiros" label="Terceiros" />
            <NavLink href="/" label="Voltar" emphasis />
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        <StatCard
          label="Fase ativa"
          value={props.currentPhaseLabel}
          caption={`${props.visibleMatchCount} jogo(s) visiveis`}
        />
        <StatCard
          label="Terceiros"
          value={`${props.thirdSelectedCount}/8`}
          caption={selectionState}
          tone={props.thirdSelectedCount === 8 ? 'success' : 'warning'}
        />
        <StatCard
          label="Ranking atual"
          value={String(props.totalThirdCount)}
          caption="12 terceiros organizados"
        />
        <StatCard
          label="Slots complexos"
          value={`${props.resolvedSlotsCount}/${props.totalSlotsCount}`}
          caption="encaixes resolvidos"
        />
      </div>
    </section>
  );
}

export function PageNotice(props: {
  tone: FeedbackTone;
  text: string;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border px-4 py-3 text-sm font-semibold',
        props.tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-red-200 bg-red-50 text-red-900'
      )}
    >
      {props.text}
    </div>
  );
}

export function SectionCard(props: {
  title: string;
  description: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="w-full max-w-full overflow-hidden rounded-[1.9rem] border border-[#dacdb7] bg-[#fffdf8] p-4 shadow-[0_16px_50px_rgba(59,41,13,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[1.55rem] font-black tracking-tight text-[#23180d]">
            {props.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b604f]">
            {props.description}
          </p>
        </div>
        {props.aside}
      </div>
      <div className="mt-5">{props.children}</div>
    </section>
  );
}

export function PhaseTabs(props: {
  sections: PhaseSection[];
  selectedPhase: MatchPhase;
  onChange: (phase: MatchPhase) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#856f50]">
          Fase
        </label>
        <select
          value={props.selectedPhase}
          onChange={(event) => props.onChange(event.target.value as MatchPhase)}
          className="min-h-11 w-full rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-black text-[#23180d] outline-none transition focus:border-[#1f6b43]"
        >
          {props.sections.map((section) => (
            <option key={section.phase} value={section.phase}>
              {section.label}
            </option>
          ))}
        </select>
      </div>

      <div className="-mx-1 hidden max-w-full gap-2 overflow-x-auto whitespace-nowrap px-1 pb-1 md:flex">
        {props.sections.map((section) => (
          <button
            key={section.phase}
            type="button"
            onClick={() => props.onChange(section.phase)}
            className={cx(
              'shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-black transition',
              props.selectedPhase === section.phase
                ? 'border-[#1f6b43] bg-[#1f6b43] text-white'
                : 'border-[#d9ccb7] bg-white text-[#5f5342] hover:bg-[#f7efdf]'
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GroupFilterTabs(props: {
  groups: string[];
  selectedGroup: string;
  onChange: (group: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#856f50]">
          Grupo
        </label>
        <select
          value={props.selectedGroup}
          onChange={(event) => props.onChange(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-black text-[#23180d] outline-none transition focus:border-[#1f6b43]"
        >
          <option value="ALL">Todos os grupos</option>
          {props.groups.map((groupName) => (
            <option key={groupName} value={groupName}>
              {`Grupo ${groupName}`}
            </option>
          ))}
        </select>
      </div>

      <div className="-mx-1 hidden max-w-full gap-2 overflow-x-auto whitespace-nowrap px-1 pb-1 md:flex">
        <button
          type="button"
          onClick={() => props.onChange('ALL')}
          className={cx(
            'shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition',
            props.selectedGroup === 'ALL'
              ? 'border-[#342819] bg-[#342819] text-white'
              : 'border-[#d9ccb7] bg-white text-[#6c604e] hover:bg-[#f7efdf]'
          )}
        >
          Todos
        </button>
        {props.groups.map((groupName) => (
          <button
            key={groupName}
            type="button"
            onClick={() => props.onChange(groupName)}
            className={cx(
              'shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition',
              props.selectedGroup === groupName
                ? 'border-[#342819] bg-[#342819] text-white'
                : 'border-[#d9ccb7] bg-white text-[#6c604e] hover:bg-[#f7efdf]'
            )}
          >
            Grupo {groupName}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResultsToolbar(props: {
  currentPhaseLabel: string;
  visibleMatchCount: number;
  selectedGroupLabel: string | null;
  isSavingBatch: boolean;
  onSaveBatch: () => void;
}) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-[#e8dcc7] bg-[#fbf5e8] p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <MetaChip label={props.currentPhaseLabel} />
          {props.selectedGroupLabel ? <MetaChip label={props.selectedGroupLabel} subtle /> : null}
          <MetaChip label={`${props.visibleMatchCount} jogo(s)`} subtle />
        </div>

        <button
          type="button"
          onClick={props.onSaveBatch}
          disabled={props.isSavingBatch}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#c88719] px-4 py-3 text-sm font-black text-white transition hover:bg-[#af7414] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {props.isSavingBatch ? 'Salvando fase...' : 'Salvar fase visivel'}
        </button>
      </div>
    </div>
  );
}

export function MatchGroupSection(props: {
  label: string;
  matchCount: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-black text-[#23180d]">{props.label}</h3>
        <span className="rounded-full bg-[#f1e6d0] px-3 py-1 text-xs font-bold text-[#7a6746]">
          {props.matchCount} jogo(s)
        </span>
      </div>
      <div className="grid gap-3">{props.children}</div>
    </section>
  );
}

export function MatchResultCard(props: {
  match: MatchView;
  draft: Draft;
  tone: MatchTone;
  message: { tone: FeedbackTone; text: string } | undefined;
  isBusy: boolean;
  onHomeScoreChange: (value: string) => void;
  onAwayScoreChange: (value: string) => void;
  onWinnerTeamChange: (value: string) => void;
  onSave: () => void;
}) {
  const statusText = props.message?.text ?? getMatchToneLabel(props.tone, props.match.isFinished);

  return (
    <article
      className={cx(
        'w-full max-w-full min-w-0 overflow-hidden rounded-[1.7rem] border p-4 shadow-[0_10px_30px_rgba(59,41,13,0.04)] transition sm:p-5',
        toneClasses(props.tone)
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge label={`Jogo ${props.match.number}`} strong />
            <Badge label={props.match.statusLabel} tone={props.match.isFinished ? 'success' : 'neutral'} />
            {props.match.groupName ? <Badge label={`Grupo ${props.match.groupName}`} tone="accent" /> : null}
            {!props.match.groupName ? <Badge label={props.match.phaseLabel} tone="neutral" /> : null}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#856f50]">
              {props.match.phaseLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#5e5344]">
              {props.match.startsAtLabel}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)] md:items-center">
            <TeamStack label="Mandante" name={props.match.homeTeamName} slot={props.match.homeSlot} align="right" />
            <ScoreEditor
              homeScore={props.draft.homeScore}
              awayScore={props.draft.awayScore}
              onHomeScoreChange={props.onHomeScoreChange}
              onAwayScoreChange={props.onAwayScoreChange}
            />
            <TeamStack label="Visitante" name={props.match.awayTeamName} slot={props.match.awaySlot} align="left" />
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            {props.match.phase !== 'GROUP' ? (
              <div className="min-w-0">
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#856f50]">
                  Vencedor
                </label>
                <select
                  value={props.draft.winnerTeamId}
                  onChange={(event) => props.onWinnerTeamChange(event.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-semibold text-[#23180d] outline-none transition focus:border-[#1f6b43]"
                >
                  <option value="">Automatico pelo placar</option>
                  {props.match.homeTeamId ? (
                    <option value={props.match.homeTeamId}>{props.match.homeTeamName}</option>
                  ) : null}
                  {props.match.awayTeamId ? (
                    <option value={props.match.awayTeamId}>{props.match.awayTeamName}</option>
                  ) : null}
                </select>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#dacdb7] bg-[#fffdf8] px-4 py-3 text-sm text-[#756954]">
                A classificacao do grupo e recalculada automaticamente ao finalizar este jogo.
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-2 lg:items-end">
              <div
                className={cx(
                  'inline-flex min-h-11 w-full min-w-0 items-center rounded-2xl px-3 py-2 text-sm font-semibold lg:w-auto',
                  props.message?.tone === 'error'
                    ? 'bg-red-100 text-red-900'
                    : props.message?.tone === 'success'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-white/80 text-[#5f5342]'
                )}
              >
                {statusText}
              </div>
              <button
                type="button"
                onClick={props.onSave}
                disabled={props.isBusy}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#1f6b43] px-5 py-3 text-sm font-black text-white transition hover:bg-[#175436] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                {props.isBusy ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function StandingsGrid(props: {
  groups: StandingsGroup[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {props.groups.map((group) => (
        <div
          key={group.groupName}
          className="overflow-hidden rounded-[1.6rem] border border-[#e8dcc7] bg-white"
        >
          <div className="flex items-center justify-between bg-[#f7efdf] px-4 py-3">
            <h3 className="text-base font-black text-[#23180d]">Grupo {group.groupName}</h3>
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a734f]">
              {group.rows.length} selecoes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#fffaf1] text-[#826d4d]">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Selecao</th>
                  <th className="px-3 py-2 text-center">P</th>
                  <th className="px-3 py-2 text-center">J</th>
                  <th className="px-3 py-2 text-center">SG</th>
                  <th className="px-3 py-2 text-center">GP</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.teamId} className="border-t border-[#f1e7d5]">
                    <td className="px-3 py-2 font-black text-[#23180d]">{row.position}</td>
                    <td className="px-3 py-2 font-semibold text-[#3f3325]">{row.teamName}</td>
                    <td className="px-3 py-2 text-center font-black text-[#1f6b43]">{row.points}</td>
                    <td className="px-3 py-2 text-center">{row.played}</td>
                    <td className="px-3 py-2 text-center">{row.goalDifference}</td>
                    <td className="px-3 py-2 text-center">{row.goalsFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThirdPlacePanel(props: {
  selectedCount: number;
  selectedGroups: string[];
  totalRows: number;
  suggestedGroupNames: string[];
  validationMessage: string | null;
  isApplyingSuggestion: boolean;
  isSaving: boolean;
  rows: ThirdRankingRow[];
  onApplySuggestion: () => void;
  onSave: () => void;
  onToggleGroup: (groupName: string) => void;
}) {
  const counterTone =
    props.selectedCount === 8 ? 'success' : props.selectedCount < 8 ? 'warning' : 'error';

  return (
    <SectionCard
      title="Melhores terceiros"
      description="Escolha a lista oficial dos 8 terceiros classificados. A sugestao automatica acelera, mas a confirmacao manual continua sendo a fonte final."
      aside={
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <button
            type="button"
            onClick={props.onApplySuggestion}
            disabled={props.isApplyingSuggestion}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-black text-[#5c4e39] transition hover:bg-[#f8f0df] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.isApplyingSuggestion ? 'Aplicando...' : 'Usar sugestao'}
          </button>
          <button
            type="button"
            onClick={props.onSave}
            disabled={props.isSaving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#1f6b43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#175436] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.isSaving ? 'Confirmando...' : 'Confirmar classificados'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <div
            className={cx(
              'flex min-h-[7.5rem] flex-col justify-center rounded-[1.6rem] border px-4 py-4',
              counterTone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : counterTone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-red-200 bg-red-50 text-red-900'
            )}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">
              Selecionados
            </span>
            <span className="mt-2 text-4xl font-black">{props.selectedCount}/8</span>
          </div>

          <div className="min-w-0 rounded-[1.6rem] border border-[#e8dcc7] bg-[#fbf5e8] px-4 py-4">
            <p className="text-sm font-semibold text-[#564a37]">
              {props.selectedCount === 8
                ? 'Lista pronta para confirmacao.'
                : props.selectedCount < 8
                  ? `Selecione mais ${8 - props.selectedCount} grupo(s).`
                  : `Remova ${props.selectedCount - 8} grupo(s) para voltar ao limite de 8.`}
            </p>
            <p className="mt-2 text-sm text-[#6d624f]">
              Sugestao atual:{' '}
              <strong>{props.suggestedGroupNames.map((groupName) => `3${groupName}`).join(', ')}</strong>
            </p>
            {props.selectedGroups.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {props.selectedGroups.map((groupName) => (
                  <Badge key={groupName} label={`3${groupName}`} tone="accent" />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {props.validationMessage ? <InlineNotice tone="error" text={props.validationMessage} /> : null}

        <div className="space-y-2">
          {props.rows.map((row) => (
            <ThirdPlaceListItem
              key={row.teamId}
              row={row}
              checked={props.selectedGroups.includes(row.groupName)}
              onToggle={() => props.onToggleGroup(row.groupName)}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function SlotAssignmentsPanel(props: {
  slots: ComplexSlotView[];
  selectedThirdGroups: string[];
  thirdRanking: ThirdRankingRow[];
  slotSelections: Record<string, string>;
  slotMessages: Record<string, { tone: FeedbackTone; text: string }>;
  busyKeys: Record<string, boolean>;
  isApplyingSuggestion: boolean;
  validationMessage: string | null;
  onApplySuggestion: () => void;
  onSelectionChange: (slotKey: string, groupName: string) => void;
  onSaveSlot: (slot: ComplexSlotView) => void;
}) {
  const resolvedCount = props.slots.filter((slot) => slot.currentGroupName).length;

  return (
    <details className="group w-full max-w-full overflow-hidden rounded-[1.9rem] border border-[#dacdb7] bg-[#fffdf8] open:shadow-[0_16px_50px_rgba(59,41,13,0.05)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-[1.35rem] font-black tracking-tight text-[#23180d]">
            Slots complexos dos 16 avos
          </h2>
          <p className="mt-1 text-sm text-[#6b604f]">
            Secao secundaria para encaixar os terceiros confirmados nos confrontos que aceitam combinacoes de grupos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={`${resolvedCount}/${props.slots.length} resolvidos`} tone="neutral" />
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8a734f] transition group-open:rotate-180">
            v
          </span>
        </div>
      </summary>

      <div className="border-t border-[#eadfc9] px-4 pb-4 pt-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#6b604f]">
            Cada slot aceita apenas grupos previstos no CSV e apenas entre os terceiros oficialmente confirmados.
          </p>
          <button
            type="button"
            onClick={props.onApplySuggestion}
            disabled={props.isApplyingSuggestion}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#c88719] px-4 py-3 text-sm font-black text-white transition hover:bg-[#af7414] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {props.isApplyingSuggestion ? 'Montando...' : 'Aplicar sugestao'}
          </button>
        </div>

        {props.validationMessage ? (
          <div className="mt-4">
            <InlineNotice tone="error" text={props.validationMessage} />
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {props.slots.map((slot) => {
            const allowedConfirmedGroups = props.selectedThirdGroups
              .filter((groupName) => slot.allowedGroupNames.includes(groupName))
              .sort();

            return (
              <div
                key={slot.key}
                className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-[#e8dcc7] bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={`Jogo ${slot.matchNumber}`} strong />
                  <Badge label={slot.side === 'HOME' ? 'Mandante' : 'Visitante'} tone="neutral" />
                  <Badge label={slot.slotLabel} tone="warning" />
                </div>

                <p className="mt-3 text-sm leading-6 text-[#5f5342]">
                  Permitidos: <strong>{slot.allowedGroupNames.join(', ')}</strong>. Outro lado do
                  confronto: <strong>{slot.opponentTeamName}</strong>.
                </p>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="min-w-0">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#856f50]">
                      Terceiro encaixado
                    </label>
                    <select
                      value={props.slotSelections[slot.key] ?? slot.currentGroupName ?? ''}
                      onChange={(event) => props.onSelectionChange(slot.key, event.target.value)}
                      className="min-h-11 w-full rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-semibold text-[#23180d] outline-none transition focus:border-[#1f6b43]"
                    >
                      <option value="">Aguardando definicao</option>
                      {allowedConfirmedGroups.map((groupName) => {
                        const row = props.thirdRanking.find((entry) => entry.groupName === groupName);

                        return (
                          <option key={groupName} value={groupName}>
                            {`3${groupName} - ${row?.teamName ?? 'A definir'}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => props.onSaveSlot(slot)}
                    disabled={props.busyKeys[slot.key]}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#1f6b43] px-4 py-3 text-sm font-black text-white transition hover:bg-[#175436] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                  >
                    {props.busyKeys[slot.key] ? 'Salvando...' : 'Salvar slot'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    label={
                      slot.currentGroupName
                        ? `Atual: 3${slot.currentGroupName} • ${slot.selectedTeamName}`
                        : 'Atual: nao resolvido'
                    }
                    tone="success"
                  />
                  <Badge
                    label={
                      slot.suggestedGroupName
                        ? `Sugestao: 3${slot.suggestedGroupName} • ${slot.suggestedTeamName}`
                        : 'Sugestao: sem sugestao'
                    }
                    tone="info"
                  />
                </div>

                {props.slotMessages[slot.key] ? (
                  <div className="mt-3">
                    <InlineNotice
                      tone={props.slotMessages[slot.key].tone}
                      text={props.slotMessages[slot.key].text}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function NavLink(props: {
  href: string;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <a
      href={props.href}
      className={cx(
        'inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black transition sm:w-auto',
        props.emphasis
          ? 'bg-[#1f6b43] text-white hover:bg-[#175436]'
          : 'border border-[#d9ccb7] bg-white text-[#5d503b] hover:bg-[#f7efdf]'
      )}
    >
      {props.label}
    </a>
  );
}

function StatCard(props: {
  label: string;
  value: string;
  caption: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div
      className={cx(
        'rounded-[1.45rem] border px-4 py-4',
        props.tone === 'success'
          ? 'border-emerald-200 bg-emerald-50'
          : props.tone === 'warning'
            ? 'border-amber-200 bg-amber-50'
            : 'border-[#e8dcc7] bg-white'
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a734f]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[#23180d]">{props.value}</p>
      <p className="mt-1 text-sm text-[#675b49]">{props.caption}</p>
    </div>
  );
}

function MetaChip(props: {
  label: string;
  subtle?: boolean;
}) {
  return (
    <span
      className={cx(
        'rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em]',
        props.subtle
          ? 'bg-white text-[#77674d]'
          : 'bg-[#efe1c1] text-[#795b1b]'
      )}
    >
      {props.label}
    </span>
  );
}

function Badge(props: {
  label: string;
  strong?: boolean;
  tone?: 'neutral' | 'success' | 'accent' | 'warning' | 'info';
}) {
  return (
    <span
      className={cx(
        'max-w-full rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]',
        props.strong && 'bg-[#23180d] text-white',
        !props.strong &&
          props.tone === 'neutral' &&
          'bg-[#f3ead8] text-[#735c39]',
        !props.strong &&
          props.tone === 'success' &&
          'bg-[#dff2e7] text-[#1f6b43]',
        !props.strong &&
          props.tone === 'accent' &&
          'bg-[#e9f2ff] text-[#245a9c]',
        !props.strong &&
          props.tone === 'warning' &&
          'bg-[#fff3cf] text-[#8d6a09]',
        !props.strong &&
          props.tone === 'info' &&
          'bg-[#eef4ff] text-[#285a94]',
        !props.strong &&
          !props.tone &&
          'bg-[#f3ead8] text-[#735c39]'
      )}
    >
      {props.label}
    </span>
  );
}

function TeamStack(props: {
  label: string;
  name: string;
  slot: string | null;
  align: 'left' | 'right';
}) {
  return (
    <div className={cx('min-w-0', props.align === 'right' ? 'text-left md:text-right' : 'text-left')}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#856f50]">
        {props.label}
      </p>
      <p className="mt-2 break-words text-base font-black leading-tight text-[#23180d]">
        {props.name}
      </p>
      <p className="mt-1 break-words text-xs leading-5 text-[#786c58]">{props.slot ?? 'Slot livre'}</p>
    </div>
  );
}

function ScoreEditor(props: {
  homeScore: string;
  awayScore: string;
  onHomeScoreChange: (value: string) => void;
  onAwayScoreChange: (value: string) => void;
}) {
  return (
    <div className="w-full max-w-full rounded-[1.4rem] border border-[#e4d7c2] bg-white px-3 py-3">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <ScoreInput value={props.homeScore} onChange={props.onHomeScoreChange} label="Mandante" />
        <span className="text-lg font-black text-[#8d7a5d]">x</span>
        <ScoreInput value={props.awayScore} onChange={props.onAwayScoreChange} label="Visitante" />
      </div>
    </div>
  );
}

function ScoreInput(props: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col items-center gap-1">
      <span className="sr-only">{props.label}</span>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        type="number"
        min="0"
        inputMode="numeric"
        className="h-12 w-full min-w-0 rounded-2xl border border-[#d8cab0] bg-[#fffdfa] px-2 text-center text-2xl font-black text-[#23180d] outline-none transition focus:border-[#1f6b43]"
      />
    </label>
  );
}

function ThirdPlaceListItem(props: {
  row: ThirdRankingRow;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-[1.45rem] border px-4 py-3.5 transition',
        props.checked
          ? 'border-[#1f6b43] bg-[#edf7f1]'
          : 'border-[#e8dcc7] bg-white hover:bg-[#fff9ef]'
      )}
    >
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onToggle}
        className="mt-1 h-4 w-4 rounded border-[#b49c74] text-[#1f6b43] focus:ring-[#1f6b43]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={`#${props.row.rank}`} strong />
          <Badge label={`3${props.row.groupName}`} tone="neutral" />
          {props.row.isSuggested ? <Badge label="Sugestao" tone="info" /> : null}
          {props.checked ? <Badge label="Selecionado" tone="success" /> : null}
        </div>
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-black text-[#23180d]">{props.row.teamName}</p>
          <p className="text-sm text-[#655946]">
            {props.row.points} pts • SG {props.row.goalDifference} • GP {props.row.goalsFor}
          </p>
        </div>
      </div>
    </label>
  );
}

function InlineNotice(props: {
  tone: FeedbackTone;
  text: string;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border px-4 py-3 text-sm font-semibold',
        props.tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-red-200 bg-red-50 text-red-900'
      )}
    >
      {props.text}
    </div>
  );
}

function toneClasses(tone: MatchTone) {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50';
    case 'warning':
      return 'border-amber-200 bg-amber-50';
    case 'partial':
      return 'border-sky-200 bg-sky-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-[#e8dcc7] bg-white';
  }
}

function getMatchToneLabel(tone: MatchTone, isFinished: boolean) {
  if (isFinished) {
    return 'Resultado finalizado';
  }

  switch (tone) {
    case 'warning':
      return 'Pronto para salvar';
    case 'partial':
      return 'Preencha os dois placares';
    case 'error':
      return 'Revise o resultado';
    default:
      return 'Sem alteracoes';
  }
}
