'use client';

import { useState } from 'react';

type InviteLinkProps = {
  inviteUrl: string;
};

export function InviteLink({ inviteUrl }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-full border border-[#12338d] bg-[#050812] px-4 py-2 text-sm text-white/80">
      <span className="font-medium text-white/70">Convite:</span>
      <a
        href={inviteUrl}
        className="min-w-0 flex-1 truncate text-sm text-white underline decoration-white/40 underline-offset-4"
        title={inviteUrl}
      >
        {inviteUrl}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-[#e1a81d]"
        aria-label="Copiar link da liga"
        title={copied ? 'Copiado' : 'Copiar link'}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M8 7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-1v-2h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1H8V7Zm-5 4a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7Zm3-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H6Z" />
        </svg>
      </button>
      {copied && (
        <span className="text-xs font-semibold text-[#e1a81d]">
          Copiado!
        </span>
      )}
    </div>
  );
}
