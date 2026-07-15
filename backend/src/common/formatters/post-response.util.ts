import { UserRole } from '../enums/user-role.enum';
import { isModerator } from '../utils/role.util';

type CurrentUser =
  | {
      userId?: string;
      role?: UserRole | string;
    }
  | undefined;

export function formatAuthor(
  author: any,
  options?: {
    anonymous?: boolean;
    canRevealAnonymousAuthor?: boolean;
  },
) {
  if (!author) return null;
  const anonymous = options?.anonymous ?? false;
  const canRevealAnonymousAuthor = options?.canRevealAnonymousAuthor ?? false;
  if (anonymous && !canRevealAnonymousAuthor) {
    return {
      id: null,
      firstName: null,
      lastName: null,
      username: null,
      avatarUrl: null,
      displayName: 'Anonymous',
      isAnonymous: true,
    };
  }
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    username: author.username,
    avatarUrl: author.avatarUrl,
    displayName: [author.firstName, author.lastName].filter(Boolean).join(' ') || author.username || 'User',
    isAnonymous: anonymous,
  };
}

export function formatComment(
  comment: any,
  mentions: {
    userId: string;
    username: string | null;
    displayName: string | null;
  }[] = [],
) {
  return {
    id: comment.id,
    content: comment.isHidden ? null : comment.content,
    createdAt: comment.createdAt,
    isHidden: !!comment.isHidden,
    hiddenReason: comment.isHidden ? comment.hiddenReason : null,
    author: formatAuthor(comment.author),
    mentions: comment.isHidden ? [] : mentions,
  };
}

export function formatPost(post: any, viewer?: CurrentUser) {
  return {
    id: post.id,
    content: post.isHidden ? null : post.content,
    imageUrl: post.isHidden ? null : post.imageUrl,
    videoUrl: post.isHidden ? null : post.videoUrl,
    attachment: post.isHidden ? null
      : post.attachmentUrl
        ? {
            url: post.attachmentUrl,
            name: post.attachmentName,
            type: post.attachmentMimeType,
          }
        : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isAnonymous: !!post.isAnonymous,
    isHidden: !!post.isHidden,
    hiddenReason: post.isHidden ? post.hiddenReason : null,
    category: post.category
      ? {
          id: post.category.id,
          name: post.category.name
        }
      : null,
    author: formatAuthor(post.author, { anonymous: !!post.isAnonymous, canRevealAnonymousAuthor: isModerator(viewer) ?? false,
    }),
    counts: post.isHidden
      ? {
          likes: 0,
          comments: 0,
          bookmarks: 0,
        }
      : {
          likes: post._count?.likes ?? 0,
          comments: post._count?.comments ?? 0,
          bookmarks: post._count?.bookmarks ?? 0,
        },
    likedByMe: viewer?.userId ? (post.likes?.length ?? 0) > 0 : false,
    bookmarkedByMe: viewer?.userId ? (post.bookmarks?.length ?? 0) > 0 : false,
    mentions: post.mentions?.map((mention: any) => ({
      userId: mention.user.id,
      username: mention.user.username,
      displayName:
        [mention.user.firstName, mention.user.lastName].filter(Boolean).join(' ') ||
        mention.user.username,
    })) ?? [],
    comments: post.comments
      ? post.comments.map((comment: any) => formatComment(
        comment,
        comment.mentions?.map((m: any) => ({
          userId: m.user.id,
          username: m.user.username,
          displayName: 
            [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') ||
            m.user.username,
        })) ?? [],
      ),
    )
    : undefined,
  };
}
