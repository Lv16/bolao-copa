export type ThirdSlotSide = 'HOME' | 'AWAY';
export type KnockoutSlotSide = ThirdSlotSide;

export type ThirdSlotDefinition = {
  key: string;
  matchId: string;
  matchNumber: number;
  side: ThirdSlotSide;
  slotLabel: string;
  allowedGroupNames: string[];
};

export function parseThirdSlotGroups(slot: string | null) {
  if (!slot || !slot.startsWith('3') || !slot.includes('/')) {
    return [];
  }

  return slot
    .slice(1)
    .split('/')
    .map((groupName) => groupName.trim().toUpperCase())
    .filter(Boolean);
}

function normalizeAssignments(assignments: Record<string, string>) {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(assignments)) {
    const groupName = value.trim().toUpperCase();

    if (groupName) {
      normalized[key] = groupName;
    }
  }

  return normalized;
}

function backtrackAssignments(
  slots: ThirdSlotDefinition[],
  confirmedGroupNames: string[],
  usedGroupNames: Set<string>,
  assignments: Map<string, string>
): Map<string, string> | null {
  if (assignments.size === slots.length) {
    return assignments;
  }

  const remainingSlots = slots
    .filter((slot) => !assignments.has(slot.key))
    .map((slot) => ({
      slot,
      options: confirmedGroupNames.filter(
        (groupName) =>
          slot.allowedGroupNames.includes(groupName) &&
          !usedGroupNames.has(groupName)
      ),
    }))
    .sort((a, b) => a.options.length - b.options.length);

  const current = remainingSlots[0];

  if (!current || current.options.length === 0) {
    return null;
  }

  for (const groupName of current.options) {
    const nextAssignments = new Map(assignments);
    nextAssignments.set(current.slot.key, groupName);

    const nextUsed = new Set(usedGroupNames);
    nextUsed.add(groupName);

    const result = backtrackAssignments(slots, confirmedGroupNames, nextUsed, nextAssignments);

    if (result) {
      return result;
    }
  }

  return null;
}

export function buildSuggestedThirdSlotAssignments(
  slots: ThirdSlotDefinition[],
  confirmedGroupNames: string[]
) {
  const normalizedGroups = Array.from(
    new Set(confirmedGroupNames.map((groupName) => groupName.trim().toUpperCase()).filter(Boolean))
  );

  return (
    backtrackAssignments(slots, normalizedGroups, new Set<string>(), new Map<string, string>()) ??
    new Map<string, string>()
  );
}

export function validateThirdSlotAssignments(params: {
  slots: ThirdSlotDefinition[];
  confirmedGroupNames: string[];
  assignments: Record<string, string>;
}) {
  const confirmedGroupNames = new Set(
    params.confirmedGroupNames.map((groupName) => groupName.trim().toUpperCase()).filter(Boolean)
  );
  const normalizedAssignments = normalizeAssignments(params.assignments);
  const errors: string[] = [];
  const usedByGroup = new Map<string, string>();

  for (const slot of params.slots) {
    const selectedGroup = normalizedAssignments[slot.key];

    if (!selectedGroup) {
      continue;
    }

    if (!confirmedGroupNames.has(selectedGroup)) {
      errors.push(`O grupo ${selectedGroup} nao confirmado foi usado no slot ${slot.slotLabel}.`);
    }

    if (!slot.allowedGroupNames.includes(selectedGroup)) {
      errors.push(`O grupo ${selectedGroup} nao pertence aos grupos permitidos do slot ${slot.slotLabel}.`);
    }

    const duplicatedAt = usedByGroup.get(selectedGroup);
    if (duplicatedAt) {
      errors.push(`O grupo ${selectedGroup} foi repetido nos slots ${duplicatedAt} e ${slot.slotLabel}.`);
    } else {
      usedByGroup.set(selectedGroup, slot.slotLabel);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    assignments: normalizedAssignments,
  };
}
