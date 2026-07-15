import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function ensureUserNotSuspended(
  prisma: PrismaService,
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuspended: true },
  });
  if (!user) {
    throw new ForbiddenException('User not found');
  }
  if (user?.isSuspended) {
    throw new ForbiddenException('Your account has been suspended.');
  }
}
