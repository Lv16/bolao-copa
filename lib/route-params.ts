export function getSingleParam(
  value: string | string[] | undefined,
  fallback: string
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}
