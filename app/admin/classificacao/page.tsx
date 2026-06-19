import { requireUser } from '@/lib/require-session';
import { getGroupStageSnapshot } from '@/lib/third-place-admin';

export default async function AdminClassificacaoPage() {
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

  const snapshot = await getGroupStageSnapshot();
  const groups = Object.keys(snapshot.standingsByGroup).sort();

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#1c1914]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#d6c9af] bg-[#fffaf0] p-6">
          <div className="flex flex-col gap-4 border-b border-[#eadfc9] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#9a6b14]">Admin geral</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2b2112] sm:text-4xl">
                Classificacao dos grupos
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6c6255]">
                A classificacao e recalculada a partir dos resultados oficiais ja finalizados.
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
                href="/admin/terceiros"
                className="rounded-2xl border border-[#d6c9af] bg-white px-4 py-3 text-sm font-bold text-[#5a4630] transition hover:bg-[#f8f0df]"
              >
                Terceiros
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.6rem] border border-[#e5d9c0] bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b734a]">Grupos com tabela</p>
              <p className="mt-2 text-3xl font-black text-[#2b2112]">{groups.length}</p>
            </div>
            <div className="rounded-[1.6rem] border border-[#e5d9c0] bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b734a]">Terceiros no ranking</p>
              <p className="mt-2 text-3xl font-black text-[#2b2112]">{snapshot.thirdRows.length}</p>
            </div>
            <div className="rounded-[1.6rem] border border-[#e5d9c0] bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b734a]">Confirmados</p>
              <p className="mt-2 text-3xl font-black text-[#2b2112]">{snapshot.confirmedGroupNames.length}/8</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <section className="grid gap-4 xl:grid-cols-2">
            {groups.map((groupName) => {
              const rows = snapshot.standingsByGroup[groupName];

              return (
                <div key={groupName} className="overflow-hidden rounded-[1.7rem] border border-[#d6c9af] bg-[#fffaf0]">
                  <div className="flex items-center justify-between bg-[#f7efdf] px-4 py-3">
                    <h2 className="text-lg font-black text-[#2b2112]">Grupo {groupName}</h2>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b734a]">
                      {rows.length} selecoes
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white text-[#8b734a]">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Selecao</th>
                          <th className="px-3 py-2 text-center">P</th>
                          <th className="px-3 py-2 text-center">J</th>
                          <th className="px-3 py-2 text-center">V</th>
                          <th className="px-3 py-2 text-center">E</th>
                          <th className="px-3 py-2 text-center">D</th>
                          <th className="px-3 py-2 text-center">SG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={row.teamId} className="border-t border-[#f0e7d5]">
                            <td className="px-3 py-2 font-black text-[#2b2112]">{index + 1}</td>
                            <td className="px-3 py-2 font-bold text-[#3d3224]">{row.teamName}</td>
                            <td className="px-3 py-2 text-center font-black text-[#2f7d4b]">{row.points}</td>
                            <td className="px-3 py-2 text-center">{row.played}</td>
                            <td className="px-3 py-2 text-center">{row.wins}</td>
                            <td className="px-3 py-2 text-center">{row.draws}</td>
                            <td className="px-3 py-2 text-center">{row.losses}</td>
                            <td className="px-3 py-2 text-center">{row.goalDifference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="rounded-[1.7rem] border border-[#d6c9af] bg-[#fffaf0] p-5">
            <h2 className="text-2xl font-black tracking-tight text-[#2b2112]">Ranking dos terceiros</h2>
            <p className="mt-2 text-sm leading-6 text-[#6c6255]">
              A lista abaixo mostra os 12 terceiros colocados e destaca os 8 grupos oficialmente confirmados.
            </p>

            <div className="mt-5 space-y-3">
              {snapshot.thirdRows.map((row) => {
                const confirmed = snapshot.confirmedGroupNames.includes(row.groupName);
                const suggested = snapshot.suggestedGroupNames.includes(row.groupName);

                return (
                  <div
                    key={row.teamId}
                    className={`rounded-[1.4rem] border px-4 py-4 ${
                      confirmed
                        ? 'border-[#2f7d4b] bg-[#edf7f1]'
                        : 'border-[#e5d9c0] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#2b2112] px-2.5 py-1 text-[11px] font-black text-white">
                        #{row.rank}
                      </span>
                      <span className="rounded-full bg-[#f3ead8] px-2.5 py-1 text-[11px] font-black text-[#735c39]">
                        3{row.groupName}
                      </span>
                      {confirmed && (
                        <span className="rounded-full bg-[#dff2e7] px-2.5 py-1 text-[11px] font-black text-[#2f7d4b]">
                          Confirmado
                        </span>
                      )}
                      {suggested && !confirmed && (
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
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
