import { redirect } from 'next/navigation';

import {
  applySuggestedThirdGroups,
  applySuggestedThirdSlotAssignments,
  saveConfirmedThirdGroups,
  saveThirdSlotAssignment,
} from '@/app/admin/resultados/actions';
import { requireUser } from '@/lib/require-session';
import { getRoundOf32ThirdSlotsState } from '@/lib/third-place-admin';
import type { KnockoutSlotSide } from '@/lib/third-slot-assignments';

async function confirmSuggestedThirdGroupsAction() {
  'use server';

  await applySuggestedThirdGroups();
  redirect('/admin/terceiros');
}

async function applySuggestedSlotsAction() {
  'use server';

  await applySuggestedThirdSlotAssignments();
  redirect('/admin/terceiros');
}

async function saveConfirmedGroupsAction(formData: FormData) {
  'use server';

  const values = formData.getAll('confirmedGroup').map((value) => String(value));
  await saveConfirmedThirdGroups(values);
  redirect('/admin/terceiros');
}

async function saveSlotAction(formData: FormData) {
  'use server';

  await saveThirdSlotAssignment({
    matchId: String(formData.get('matchId')),
    side: String(formData.get('side')) as KnockoutSlotSide,
    selectedGroupName: String(formData.get('selectedGroupName') || '') || null,
  });
  redirect('/admin/terceiros');
}

export default async function AdminTerceirosPage() {
  const user = await requireUser();

  if (!user.isSystemAdmin) {
    return (
      <main className="min-h-screen bg-stone-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-3xl font-black text-red-200">Acesso negado</h1>
          <p className="mt-3 text-sm text-red-100/80">Apenas o administrador geral pode acessar esta area.</p>
        </div>
      </main>
    );
  }

  const state = await getRoundOf32ThirdSlotsState();

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#1c1914]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#d6c9af] bg-[#fffaf0] p-6">
          <div className="flex flex-col gap-4 border-b border-[#eadfc9] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#9a6b14]">Admin geral</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2b2112] sm:text-4xl">
                Terceiros confirmados e slots dos 16 avos
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6c6255]">
                Primeiro confirme a lista oficial dos 8 terceiros classificados. Depois use apenas essa base
                para preencher os slots complexos dos 16 avos.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/admin/resultados"
                className="rounded-2xl bg-[#2f7d4b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#27673e]"
              >
                Resultados
              </a>
              <a
                href="/admin/classificacao"
                className="rounded-2xl border border-[#d6c9af] bg-white px-4 py-3 text-sm font-bold text-[#5a4630] transition hover:bg-[#f8f0df]"
              >
                Classificacao
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.6rem] border border-[#e5d9c0] bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b734a]">Terceiros no ranking</p>
              <p className="mt-2 text-3xl font-black text-[#2b2112]">{state.thirdRows.length}</p>
            </div>
            <div className="rounded-[1.6rem] border border-[#e5d9c0] bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b734a]">Confirmados</p>
              <p className="mt-2 text-3xl font-black text-[#2b2112]">{state.confirmedGroupNames.length}/8</p>
            </div>
            <div className="rounded-[1.6rem] border border-[#e5d9c0] bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b734a]">Slots complexos</p>
              <p className="mt-2 text-3xl font-black text-[#2b2112]">
                {state.slots.filter((slot) => slot.currentGroupName).length}/{state.slots.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="rounded-[1.7rem] border border-[#d6c9af] bg-[#fffaf0] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#2b2112]">Lista oficial dos 8 terceiros</h2>
                <p className="mt-2 text-sm leading-6 text-[#6c6255]">
                  A sugestao automatica serve como ponto de partida, mas a confirmacao manual e a fonte final.
                </p>
              </div>

              <form action={confirmSuggestedThirdGroupsAction}>
                <button
                  type="submit"
                  className="rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-black text-[#5f4d32] transition hover:bg-[#f8f0df]"
                >
                  Usar sugestao automatica
                </button>
              </form>
            </div>

            {state.confirmedValidation.errors.length > 0 && (
              <div className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
                {state.confirmedValidation.errors.join(' ')}
              </div>
            )}

            <form action={saveConfirmedGroupsAction} className="mt-5">
              <div className="space-y-3">
                {state.thirdRows.map((row) => {
                  const checked = state.confirmedGroupNames.includes(row.groupName);
                  const suggested = state.suggestedGroupNames.includes(row.groupName);

                  return (
                    <label
                      key={row.teamId}
                      className={`flex cursor-pointer items-start gap-3 rounded-[1.5rem] border px-4 py-4 ${
                        checked ? 'border-[#2f7d4b] bg-[#edf7f1]' : 'border-[#e5d9c0] bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="confirmedGroup"
                        value={row.groupName}
                        defaultChecked={checked}
                        className="mt-1 h-4 w-4 rounded border-[#b49c74] text-[#2f7d4b] focus:ring-[#2f7d4b]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#2b2112] px-2.5 py-1 text-[11px] font-black text-white">
                            #{row.rank}
                          </span>
                          <span className="rounded-full bg-[#f3ead8] px-2.5 py-1 text-[11px] font-black text-[#735c39]">
                            3{row.groupName}
                          </span>
                          {suggested && (
                            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-black text-sky-900">
                              Sugestao
                            </span>
                          )}
                        </div>
                        <p className="mt-2 font-black text-[#2b2112]">{row.teamName}</p>
                        <p className="mt-1 text-sm text-[#6c6255]">
                          {row.points} pts • SG {row.goalDifference} • GP {row.goalsFor}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <button
                type="submit"
                className="mt-5 rounded-2xl bg-[#2f7d4b] px-4 py-3 text-sm font-black text-white transition hover:bg-[#27673e]"
              >
                Confirmar lista oficial
              </button>
            </form>
          </section>

          <section className="rounded-[1.7rem] border border-[#d6c9af] bg-[#fffaf0] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#2b2112]">Slots complexos dos 16 avos</h2>
                <p className="mt-2 text-sm leading-6 text-[#6c6255]">
                  Cada slot aceita apenas grupos permitidos pelo CSV e nunca pode repetir um terceiro ja usado.
                </p>
              </div>

              <form action={applySuggestedSlotsAction}>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#c88719] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ae7415]"
                >
                  Aplicar sugestao de encaixe
                </button>
              </form>
            </div>

            {state.assignmentValidation.errors.length > 0 && (
              <div className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
                {state.assignmentValidation.errors.join(' ')}
              </div>
            )}

            <div className="mt-5 space-y-4">
              {state.slots.map((slot) => {
                const confirmedAllowedGroups = state.confirmedGroupNames
                  .filter((groupName: string) => slot.allowedGroupNames.includes(groupName))
                  .sort();

                return (
                  <form
                    key={slot.key}
                    action={saveSlotAction}
                    className="rounded-[1.5rem] border border-[#e5d9c0] bg-white p-4"
                  >
                    <input type="hidden" name="matchId" value={slot.matchId} />
                    <input type="hidden" name="side" value={slot.side} />

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#2b2112] px-3 py-1 text-xs font-black text-white">
                        Jogo {slot.matchNumber}
                      </span>
                      <span className="rounded-full bg-[#f3ead8] px-3 py-1 text-xs font-black text-[#735c39]">
                        {slot.side === 'HOME' ? 'Mandante' : 'Visitante'}
                      </span>
                      <span className="rounded-full bg-[#fff7d8] px-3 py-1 text-xs font-black text-[#8c6b0e]">
                        {slot.slotLabel}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#6c6255]">
                      Grupos permitidos: <strong>{slot.allowedGroupNames.join(', ')}</strong>. Confirmados nessa
                      janela: <strong>{confirmedAllowedGroups.join(', ') || 'nenhum'}</strong>.
                    </p>

                    <select
                      name="selectedGroupName"
                      defaultValue={slot.currentGroupName ?? ''}
                      className="mt-4 w-full rounded-2xl border border-[#d8cab0] bg-white px-4 py-3 text-sm font-semibold text-[#2b2112] outline-none transition focus:border-[#2f7d4b]"
                    >
                      <option value="">Aguardando definicao</option>
                      {confirmedAllowedGroups.map((groupName: string) => {
                        const row = state.thirdRows.find((entry) => entry.groupName === groupName);

                        return (
                          <option key={groupName} value={groupName}>
                            {`3${groupName} - ${row?.teamName ?? 'A definir'}`}
                          </option>
                        );
                      })}
                    </select>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-[#edf7f1] px-3 py-1 text-[#2f7d4b]">
                        Atual: {slot.currentGroupName ? `3${slot.currentGroupName} • ${slot.selectedRow?.teamName}` : 'Nao resolvido'}
                      </span>
                      <span className="rounded-full bg-[#ebf4ff] px-3 py-1 text-[#235f9c]">
                        Sugestao: {slot.suggestedGroupName ? `3${slot.suggestedGroupName} • ${slot.suggestedRow?.teamName}` : 'Sem sugestao'}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 rounded-2xl bg-[#2f7d4b] px-4 py-3 text-sm font-black text-white transition hover:bg-[#27673e]"
                    >
                      Salvar slot
                    </button>
                  </form>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
