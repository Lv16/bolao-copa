type ResolveSessionMembershipParams<TMembership> = {
  leagueId?: string;
  userId: string;
  findMembership: (leagueId: string, userId: string) => Promise<TMembership | null>;
  findFallbackMembership: (userId: string) => Promise<TMembership | null>;
};

export async function resolveSessionMembership<TMembership>({
  leagueId,
  userId,
  findMembership,
  findFallbackMembership,
}: ResolveSessionMembershipParams<TMembership>) {
  if (leagueId) {
    const membership = await findMembership(leagueId, userId);

    if (membership) {
      return membership;
    }
  }

  return findFallbackMembership(userId);
}
