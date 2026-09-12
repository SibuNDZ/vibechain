export function parseAdminUserIds(raw?: string | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUser(
  userId: string | undefined,
  rawAdminIds?: string | null,
  nodeEnv?: string
): boolean {
  const adminIds = parseAdminUserIds(rawAdminIds);
  if (adminIds.length === 0) {
    return nodeEnv !== "production";
  }
  return !!userId && adminIds.includes(userId);
}
