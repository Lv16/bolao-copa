const TEAM_FLAG_CODES: Record<string, string> = {
  alemanha: 'de',
  'arabia saudita': 'sa',
  argelia: 'dz',
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  belgica: 'be',
  bosnia: 'ba',
  brasil: 'br',
  'cabo verde': 'cv',
  canada: 'ca',
  colombia: 'co',
  'coreia do sul': 'kr',
  'costa do marfim': 'ci',
  croacia: 'hr',
  curacao: 'cw',
  egito: 'eg',
  equador: 'ec',
  escocia: 'gb-sct',
  espanha: 'es',
  'estados unidos': 'us',
  franca: 'fr',
  gana: 'gh',
  haiti: 'ht',
  holanda: 'nl',
  inglaterra: 'gb-eng',
  ira: 'ir',
  iraque: 'iq',
  japao: 'jp',
  jordania: 'jo',
  marrocos: 'ma',
  mexico: 'mx',
  noruega: 'no',
  'nova zelandia': 'nz',
  panama: 'pa',
  paraguai: 'py',
  portugal: 'pt',
  qatar: 'qa',
  'rd congo': 'cd',
  'republica tcheca': 'cz',
  senegal: 'sn',
  suecia: 'se',
  suica: 'ch',
  tunisia: 'tn',
  turquia: 'tr',
  uruguai: 'uy',
  uzbequistao: 'uz',
  'africa do sul': 'za',
};

function normalizeTeamName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getFlagUrl(teamName?: string | null) {
  if (!teamName) {
    return null;
  }

  const code = TEAM_FLAG_CODES[normalizeTeamName(teamName)];

  if (!code) {
    return null;
  }

  return `https://flagcdn.com/${code}.svg`;
}
