/* eslint-disable @next/next/no-img-element */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import logoImage from '@/app/img/logo.png';
import { ProtectedLink } from '@/app/protected-link';
import { requireSession } from '@/lib/require-session';
import { prisma } from '@/lib/prisma';
import { InviteLink } from './invite-link';

function ClassificationIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 text-[#e1a81d]" aria-hidden="true">
      <g fill="currentColor" stroke="#fff4c9" strokeWidth="1.5">
        <circle cx="20" cy="14" r="6" />
        <circle cx="44" cy="14" r="6" />
        <circle cx="32" cy="6" r="6" />
        <path d="M12 26c0-5 4-9 8-9s8 4 8 9v10H12V26Z" />
        <path d="M36 26c0-5 4-9 8-9s8 4 8 9v10H36V26Z" />
        <path d="M22 18c0-6 5-10 10-10s10 4 10 10v18H22V18Z" />
      </g>
    </svg>
  );
}

function PredictionIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 text-[#e1a81d]" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
        <path d="M32 10a22 22 0 1 0 22 22" />
        <path d="M32 20a12 12 0 1 0 12 12" />
        <circle cx="32" cy="32" r="4" fill="currentColor" stroke="none" />
        <path d="M32 32 46 18" />
        <path d="m44 10 10 2-2 10" />
      </g>
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 text-[#e1a81d]" aria-hidden="true">
      <g fill="currentColor" stroke="#fff4c9" strokeWidth="1.5">
        <circle cx="20" cy="22" r="7" />
        <circle cx="44" cy="22" r="7" />
        <circle cx="32" cy="16" r="8" />
        <path d="M10 44c0-7 5-12 12-12s12 5 12 12v6H10v-6Z" />
        <path d="M30 42c0-8 6-14 14-14s14 6 14 14v8H30v-8Z" />
        <path d="M18 40c0-8 6-14 14-14s14 6 14 14v10H18V40Z" />
      </g>
    </svg>
  );
}

type ActionCardProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

function ActionCard({ href, icon, label }: ActionCardProps) {
  return (
    <ProtectedLink
      href={href}
      className="flex min-h-[6.7rem] flex-col items-center justify-center rounded-[1.15rem] border border-white/45 bg-black px-4 py-6 text-center shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
    >
      {icon}
      <div className="mt-2 text-[1rem] font-black text-[#f0cc65] [text-shadow:0_2px_0_rgba(255,255,255,0.22)]">
        {label}
      </div>
    </ProtectedLink>
  );
}

export default async function LigaPage() {
  const session = await requireSession();

  const league = await prisma.league.findUnique({
    where: {
      id: session.league.id,
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!league) {
    redirect('/minhas-ligas');
  }

  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol =
    forwardedProto ??
    (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');

  const inviteUrl = `${protocol}://${host}/entrar/${league.inviteCode}`;
  const isLeagueAdmin = session.membership.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-12 pt-6 sm:max-w-lg sm:px-6">
        <div className="mb-6 flex justify-center">
          <img
            src={logoImage.src}
            alt="Logo Bolao Copa 2026"
            className="w-44 max-w-[72vw] sm:w-52"
          />
        </div>

        <div className="mx-auto w-full max-w-[15.8rem] rounded-[2rem] border border-[#12338d] bg-[#050812] px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
          <h1 className="truncate text-[1rem] font-black leading-tight text-white">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#36ff49]" />
            {league.name}
          </h1>
          <div className="mt-2 text-[10px] text-white/60">
            {isLeagueAdmin ? 'Administrador' : 'Participante'}
          </div>
          {isLeagueAdmin && (
            <div className="mt-2 flex justify-center">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[8px] text-white/70">
                Codigo: {league.inviteCode}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 px-1">
          <ProtectedLink
            href="/inicio"
            className="flex h-11 min-w-[6.4rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Pagina Inicial
          </ProtectedLink>

          <ProtectedLink
            href="/minhas-ligas"
            className="flex h-11 min-w-[6.4rem] items-center justify-center rounded-[1.1rem] border-2 border-white bg-[#e1a81d] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            Minhas ligas
          </ProtectedLink>
        </div>

        {isLeagueAdmin && <InviteLink inviteUrl={inviteUrl} />}

        <div className="mt-12 space-y-12">
          <ActionCard href="/ranking" icon={<ClassificationIcon />} label="Classificação" />
          <ActionCard href="/palpites" icon={<PredictionIcon />} label="Meus palpites" />
          <ActionCard href="/liga/membros" icon={<MembersIcon />} label="Membros" />
        </div>
      </section>
    </main>
  );
}
