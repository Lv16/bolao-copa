'use client';

import { useMemo, useState } from 'react';

type MembershipCard = {
  id: string;
  leagueId: string;
  leagueName: string;
  membersCount: number;
  isActive: boolean;
};

type DiscoverLeagueCard = {
  id: string;
  name: string;
  inviteCode: string;
  membersCount: number;
  joined: boolean;
};

type InicioScreenProps = {
  memberships: MembershipCard[];
  discoverLeagues: DiscoverLeagueCard[];
  openLeagueAction: (formData: FormData) => Promise<void>;
  joinLeagueAction: (formData: FormData) => Promise<void>;
};

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function InicioScreen({
  memberships,
  discoverLeagues,
  openLeagueAction,
  joinLeagueAction,
}: InicioScreenProps) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredLeagues = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return discoverLeagues.filter((league) => {
      const name = league.name.toLowerCase();
      const code = league.inviteCode.toLowerCase();

      return name.includes(normalizedQuery) || code.includes(normalizedQuery);
    });
  }, [discoverLeagues, normalizedQuery]);

  return (
    <>
      <div className="mt-7 flex justify-center">
        <label className="relative block w-full max-w-[15.6rem]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Informe o codigo"
            className="h-11 w-full rounded-[1rem] border-2 border-[#d4a017] bg-[#d9d9d9] px-4 pr-12 text-sm font-medium text-black outline-none placeholder:text-black/45"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d4a017]">
            <SearchIcon />
          </span>
        </label>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {memberships.map((membership) => (
          <div
            key={membership.id}
            className="rounded-[1.8rem] border border-[#12338d] bg-[#102057] px-4 py-4 text-center shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
          >
            <h2 className="truncate text-left text-[0.95rem] font-black leading-tight text-white">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#36ff49]" />
              {membership.leagueName}
            </h2>

            <div className="mt-2 flex items-center justify-center gap-1 text-[8px] text-white/65">
              <span className="rounded-full bg-white/10 px-2 py-1">
                MEMBROS {membership.membersCount}
              </span>
              {membership.isActive && (
                <span className="rounded-full bg-[#36ff49]/15 px-2 py-1 text-[#8eff98]">
                  ATIVA
                </span>
              )}
            </div>

            <form action={openLeagueAction} className="mt-4">
              <input type="hidden" name="leagueId" value={membership.leagueId} />
              <button
                type="submit"
                className="mx-auto flex h-10 min-w-[5.3rem] items-center justify-center rounded-full border-2 border-white bg-transparent px-5 text-sm font-black text-white"
              >
                Entrar
              </button>
            </form>
          </div>
        ))}
      </div>

      {normalizedQuery && (
        <div className="mt-7 space-y-3">
          {filteredLeagues.length > 0 ? (
            filteredLeagues.map((league) => (
              <div
                key={league.id}
                className="mx-auto w-full max-w-[11rem] rounded-[1.8rem] border border-[#12338d] bg-[#102057] px-4 py-4 text-center shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
              >
                <h2 className="truncate text-left text-[0.95rem] font-black leading-tight text-white">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#36ff49]" />
                  {league.name}
                </h2>

                <div className="mt-1 text-[9px] text-white/55">
                  {league.inviteCode}
                </div>

                <div className="mt-1 flex items-center justify-center text-[8px] text-white/65">
                  <span className="rounded-full bg-white/10 px-2 py-1">
                    MEMBROS {league.membersCount}
                  </span>
                </div>

                <form
                  action={league.joined ? openLeagueAction : joinLeagueAction}
                  className="mt-4"
                >
                  <input type="hidden" name="leagueId" value={league.id} />
                  <button
                    type="submit"
                    className="mx-auto flex h-10 min-w-[5.3rem] items-center justify-center rounded-full border-2 border-white bg-transparent px-5 text-sm font-black text-white"
                  >
                    Entrar
                  </button>
                </form>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-white/55">
              Nenhuma liga encontrada.
            </div>
          )}
        </div>
      )}
    </>
  );
}
