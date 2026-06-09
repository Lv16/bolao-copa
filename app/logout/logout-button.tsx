'use client';

import { usePathname } from 'next/navigation';

const HIDDEN_PREFIXES = ['/login', '/cadastro', '/entrar', '/recuperar-senha'];

export function LogoutButton() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <form action="/api/logout" method="post" className="fixed right-4 top-20 z-[9999] sm:right-6 sm:top-6">
      <button
        type="submit"
        className="flex h-8 min-w-[3.6rem] items-center justify-center rounded-full border-2 border-white bg-[#e1a81d] px-3 text-[0.72rem] font-black uppercase text-white shadow-[0_8px_18px_rgba(0,0,0,0.24)] [text-shadow:0_1px_0_rgba(255,255,255,0.18)]"
      >
        Sair
      </button>
    </form>
  );
}
