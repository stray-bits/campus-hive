import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    return this.prisma.bookmark.create({
      data: { userId, postId },
    });
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
    return { message: 'Bookmark removed successfully' };
  }

  async getUserBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: { id: true, name: true },
            },
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
              select: { likes: true, comments: true, bookmarks: true },
            },
            likes: { where: { userId }, select: { id: true } },
            bookmarks: { where: { userId }, select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      post: {
        id: bookmark.post.id,
        content: bookmark.post.content,
        imageUrl: bookmark.post.imageUrl,
        createdAt: bookmark.post.createdAt,
        updatedAt: bookmark.post.updatedAt,
        category: bookmark.post.category,
        author: bookmark.post.author,
        counts: {
          likes: bookmark.post._count.likes,
          comments: bookmark.post._count.comments,
          bookmarks: bookmark.post._count.bookmarks,
        },
        likedByMe: bookmark.post.likes.length > 0,
        bookmarkedByMe: bookmark.post.bookmarks.length > 0,
      },
    }));
  }

  async isBookmarked(userId: string, postId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return { bookmarked: !!bookmark };
  }
}
