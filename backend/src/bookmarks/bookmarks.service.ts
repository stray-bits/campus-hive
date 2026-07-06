import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatPost } from '../common/formatters/post-response.util';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async addBookmark(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      throw new ConflictException('Post already bookmarked');
    }
    await this.prisma.bookmark.create({
      data: { userId, postId },
    });
    const bookmarksCount = await this.prisma.bookmark.count({
      where: { postId },
    });
    return {
      bookmarked: true,
      postId,
      counts: {
        bookmarks: bookmarksCount,
      },
    };
  }

  async removeBookmark(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }
    await this.prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
    const bookmarksCount = await this.prisma.bookmark.count({
      where: { postId },
    });
    return {
      bookmarked: false,
      postId,
      counts: {
        bookmarks: bookmarksCount,
      },
    };
  }

  async getUserBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                bookmarks: true,
              },
            },
            likes: {
              select: { userId: true },
            },
            bookmarks: {
              select: { userId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      post: formatPost(bookmark.post, userId),
    }));
  }

  async isBookmarked(userId: string, postId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return {
      bookmarked: !!bookmark,
    };
  }
}
