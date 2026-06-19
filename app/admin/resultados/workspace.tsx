'use client';

import { startTransition, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { MatchPhase } from '@prisma/client';

import { getMatchTone, getVisibleGroups } from '@/lib/admin-results-view';
import type { KnockoutSlotSide } from '@/lib/third-slot-assignments';
import {
  applySuggestedThirdGroups,
  applySuggestedThirdSlotAssignments,
  saveBatchMatchResults,
  saveConfirmedThirdGroups,
  saveMatchResult,
  saveThirdSlotAssignment,
} from './actions';
import {
  AdminResultsHeader,
  GroupFilterTabs,
  MatchGroupSection,
  MatchResultCard,
  PageNotice,
  PhaseTabs,
  ResultsToolbar,
  SectionCard,
  SlotAssignmentsPanel,
  StandingsGrid,
  ThirdPlacePanel,
} from './ui';
import type {
  ComplexSlotView,
  Draft,
  FeedbackTone,
  MatchView,
  Props,
} from './types';

export function AdminResultsWorkspace(props: Props) {
  const router = useRouter();
  const [selectedPhase, setSelectedPhase] = useState<MatchPhase>(props.phaseSections[0]?.phase ?? 'GROUP');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedThirdGroups, setSelectedThirdGroups] = useState<string[]>(props.confirmedGroupNames);
  const [slotSelections, setSlotSelections] = useState<Record<string, string>>(
    Object.fromEntries(
      props.complexSlots
        .filter((slot) => slot.currentGroupName)
        .map((slot) => [slot.key, slot.currentGroupName!])
    )
  );
  const [pageMessage, setPageMessage] = useState<{ tone: FeedbackTone; text: string } | null>(null);
  const [matchMessages, setMatchMessages] = useState<
    Record<string, { tone: FeedbackTone; text: string }>
  >({});
  const [slotMessages, setSlotMessages] = useState<
    Record<string, { tone: FeedbackTone; text: string }>
  >({});
  const [busyKeys, setBusyKeys] = useState<Record<string, boolean>>({});

  const currentPhase = props.phaseSections.find((section) => section.phase === selectedPhase);
  const visibleGroups = useMemo(
    () => getVisibleGroups(props.phaseSections, selectedPhase, selectedGroup),
    [props.phaseSections, selectedGroup, selectedPhase]
  );
  const availableGroupFilters =
    currentPhase?.phase === 'GROUP' ? currentPhase.groups.map((group) => group.key).sort() : [];
  const visibleMatchCount = visibleGroups.reduce((total, group) => total + group.matches.length, 0);
  const selectedCount = selectedThirdGroups.length;
  const resolvedSlotsCount = props.complexSlots.filter((slot) => slot.currentGroupName).length;

  function setBusy(key: string, value: boolean) {
    setBusyKeys((current) => ({ ...current, [key]: value }));
  }

  function getDraft(match: MatchView): Draft {
    return drafts[match.id] ?? {
      homeScore: match.homeScore?.toString() ?? '',
      awayScore: match.awayScore?.toString() ?? '',
      winnerTeamId: match.winnerTeamId ?? '',
    };
  }

  function updateDraft(match: MatchView, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [match.id]: {
        homeScore: current[match.id]?.homeScore ?? (match.homeScore ?? '').toString(),
        awayScore: current[match.id]?.awayScore ?? (match.awayScore ?? '').toString(),
        winnerTeamId: current[match.id]?.winnerTeamId ?? (match.winnerTeamId ?? ''),
        ...patch,
      },
    }));

    if (matchMessages[match.id]) {
      setMatchMessages((current) => {
        const next = { ...current };
        delete next[match.id];
        return next;
      });
    }
  }

  function toggleConfirmedGroup(groupName: string) {
    setSelectedThirdGroups((current) =>
      current.includes(groupName)
        ? current.filter((item) => item !== groupName)
        : [...current, groupName].sort()
    );
  }

  function refreshWithMessage(tone: FeedbackTone, text: string) {
    setPageMessage({ tone, text });
    router.refresh();
  }

  async function handleSaveMatch(match: MatchView) {
    const draft = getDraft(match);

    if (draft.homeScore === '' || draft.awayScore === '') {
      setMatchMessages((current) => ({
        ...current,
        [match.id]: { tone: 'error', text: 'Preencha os dois placares.' },
      }));
      return;
    }

    setBusy(match.id, true);

    startTransition(async () => {
      const result = await saveMatchResult({
        matchId: match.id,
        homeScore: Number(draft.homeScore),
        awayScore: Number(draft.awayScore),
        winnerTeamId: draft.winnerTeamId || null,
      });

      setBusy(match.id, false);

      if (!result.ok) {
        setMatchMessages((current) => ({
          ...current,
          [match.id]: { tone: 'error', text: result.errors?.join(' ') ?? result.message },
        }));
        return;
      }

      setMatchMessages((current) => ({
        ...current,
        [match.id]: { tone: 'success', text: result.message },
      }));
      refreshWithMessage('success', result.message);
    });
  }

  async function handleSaveVisibleBatch() {
    const matches = visibleGroups.flatMap((group) => group.matches);
    const payload = matches
      .map((match) => {
        const draft = getDraft(match);

        if (draft.homeScore === '' || draft.awayScore === '') {
          return null;
        }

        return {
          matchId: match.id,
          homeScore: Number(draft.homeScore),
          awayScore: Number(draft.awayScore),
          winnerTeamId: draft.winnerTeamId || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (payload.length === 0) {
      setPageMessage({ tone: 'error', text: 'Nenhum placar preenchido para salvar em lote.' });
      return;
    }

    setBusy('batch', true);

    startTransition(async () => {
      const result = await saveBatchMatchResults(payload);

      setBusy('batch', false);

      if (!result.ok) {
        setPageMessage({ tone: 'error', text: result.errors?.join(' ') ?? result.message });
        return;
      }

      refreshWithMessage('success', result.message);
    });
  }

  async function handleApplySuggestedThirdGroups() {
    setBusy('third-suggest', true);

    startTransition(async () => {
      const result = await applySuggestedThirdGroups();
      setBusy('third-suggest', false);

      if (!result.ok) {
        setPageMessage({ tone: 'error', text: result.errors?.join(' ') ?? result.message });
        return;
      }

      setSelectedThirdGroups(props.suggestedGroupNames);
      refreshWithMessage('success', result.message);
    });
  }

  async function handleSaveConfirmedThirdGroups() {
    setBusy('third-save', true);

    startTransition(async () => {
      const result = await saveConfirmedThirdGroups(selectedThirdGroups);
      setBusy('third-save', false);

      if (!result.ok) {
        setPageMessage({ tone: 'error', text: result.errors?.join(' ') ?? result.message });
        return;
      }

      refreshWithMessage('success', result.message);
    });
  }

  async function handleApplySuggestedSlots() {
    setBusy('slot-suggest', true);

    startTransition(async () => {
      const result = await applySuggestedThirdSlotAssignments();
      setBusy('slot-suggest', false);

      if (!result.ok) {
        setPageMessage({ tone: 'error', text: result.errors?.join(' ') ?? result.message });
        return;
      }

      refreshWithMessage('success', result.message);
    });
  }

  async function handleSaveSlot(slot: ComplexSlotView) {
    const selectedGroupName = slotSelections[slot.key] ?? '';

    setBusy(slot.key, true);

    startTransition(async () => {
      const result = await saveThirdSlotAssignment({
        matchId: slot.matchId,
        side: slot.side as KnockoutSlotSide,
        selectedGroupName: selectedGroupName || null,
      });

      setBusy(slot.key, false);

      if (!result.ok) {
        setSlotMessages((current) => ({
          ...current,
          [slot.key]: { tone: 'error', text: result.errors?.join(' ') ?? result.message },
        }));
        return;
      }

      setSlotMessages((current) => ({
        ...current,
        [slot.key]: { tone: 'success', text: result.message },
      }));
      refreshWithMessage('success', result.message);
    });
  }

  const thirdValidationMessage =
    props.confirmedValidationErrors[0] ??
    (selectedCount === 8
      ? null
      : selectedCount < 8
        ? `A lista oficial precisa de exatamente 8 terceiros. Faltam ${8 - selectedCount}.`
        : `A lista oficial precisa de exatamente 8 terceiros. Remova ${selectedCount - 8}.`);

  const slotValidationMessage = props.slotAssignmentErrors[0] ?? null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f1e8] text-[#1c1914]">
      <section className="mx-auto w-full max-w-screen-xl overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-5">
          <AdminResultsHeader
            currentPhaseLabel={currentPhase?.label ?? '-'}
            visibleMatchCount={visibleMatchCount}
            thirdSelectedCount={selectedCount}
            totalThirdCount={props.thirdRanking.length}
            resolvedSlotsCount={resolvedSlotsCount}
            totalSlotsCount={props.complexSlots.length}
          />

          {pageMessage ? <PageNotice tone={pageMessage.tone} text={pageMessage.text} /> : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="min-w-0 space-y-5">
              <SectionCard
                title="Lancar resultados"
                description="Troque de fase, filtre por grupo quando necessario e salve jogo a jogo ou em lote sem sair da mesma tela."
              >
                <div className="space-y-4">
                  <PhaseTabs
                    sections={props.phaseSections}
                    selectedPhase={selectedPhase}
                    onChange={(phase) => {
                      setSelectedPhase(phase);
                      setSelectedGroup('ALL');
                    }}
                  />

                  {selectedPhase === 'GROUP' && availableGroupFilters.length > 0 ? (
                    <GroupFilterTabs
                      groups={availableGroupFilters}
                      selectedGroup={selectedGroup}
                      onChange={setSelectedGroup}
                    />
                  ) : null}

                  <ResultsToolbar
                    currentPhaseLabel={currentPhase?.label ?? '-'}
                    visibleMatchCount={visibleMatchCount}
                    selectedGroupLabel={
                      selectedPhase === 'GROUP' && selectedGroup !== 'ALL'
                        ? `Grupo ${selectedGroup}`
                        : null
                    }
                    isSavingBatch={Boolean(busyKeys.batch)}
                    onSaveBatch={handleSaveVisibleBatch}
                  />

                  <div className="space-y-5">
                    {visibleGroups.map((group) => (
                      <MatchGroupSection
                        key={group.key}
                        label={group.label}
                        matchCount={group.matches.length}
                      >
                        {group.matches.map((match) => {
                          const draft = getDraft(match);
                          const tone = getMatchTone({
                            isFinished: match.isFinished,
                            draft,
                            messageTone: matchMessages[match.id]?.tone ?? null,
                          });

                          return (
                            <MatchResultCard
                              key={match.id}
                              match={match}
                              draft={draft}
                              tone={tone}
                              message={matchMessages[match.id]}
                              isBusy={Boolean(busyKeys[match.id])}
                              onHomeScoreChange={(value) => updateDraft(match, { homeScore: value })}
                              onAwayScoreChange={(value) => updateDraft(match, { awayScore: value })}
                              onWinnerTeamChange={(value) =>
                                updateDraft(match, { winnerTeamId: value })
                              }
                              onSave={() => handleSaveMatch(match)}
                            />
                          );
                        })}
                      </MatchGroupSection>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Classificacao dos grupos"
                description="Leitura rapida da tabela oficial recalculada a partir dos resultados ja finalizados."
              >
                <StandingsGrid groups={props.standingsGroups} />
              </SectionCard>
            </div>

            <div className="min-w-0 space-y-5">
              <ThirdPlacePanel
                selectedCount={selectedCount}
                selectedGroups={[...selectedThirdGroups].sort()}
                totalRows={props.thirdRanking.length}
                suggestedGroupNames={props.suggestedGroupNames}
                validationMessage={thirdValidationMessage}
                isApplyingSuggestion={Boolean(busyKeys['third-suggest'])}
                isSaving={Boolean(busyKeys['third-save'])}
                rows={props.thirdRanking}
                onApplySuggestion={handleApplySuggestedThirdGroups}
                onSave={handleSaveConfirmedThirdGroups}
                onToggleGroup={toggleConfirmedGroup}
              />

              <SlotAssignmentsPanel
                slots={props.complexSlots}
                selectedThirdGroups={selectedThirdGroups}
                thirdRanking={props.thirdRanking}
                slotSelections={slotSelections}
                slotMessages={slotMessages}
                busyKeys={busyKeys}
                isApplyingSuggestion={Boolean(busyKeys['slot-suggest'])}
                validationMessage={slotValidationMessage}
                onApplySuggestion={handleApplySuggestedSlots}
                onSelectionChange={(slotKey, groupName) =>
                  setSlotSelections((current) => ({
                    ...current,
                    [slotKey]: groupName,
                  }))
                }
                onSaveSlot={handleSaveSlot}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
