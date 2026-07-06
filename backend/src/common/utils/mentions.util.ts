import { PrismaService } from '../../prisma/prisma.service';

export function extractMentionUsernames(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) ?? [];
  const usernames = matches.map((match) => match.slice(1).toLowerCase());
  return [...new Set(usernames)];
}

export async function resolveMentions(
  prisma: PrismaService,
  text?: string | null,
) {
  const usernames = extractMentionUsernames(text);
  if (!usernames.length) return [];
  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames,
        mode: 'insensitive',
      } as any,
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });
  return users.map((user) => ({
    userId: user.id,
    username: user.username,
    displayName:
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
  }));
}
