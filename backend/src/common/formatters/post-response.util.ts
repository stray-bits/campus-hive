export function formatAuthor(author: any) {
  if (!author) return null;
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    username: author.username,
    avatarUrl: author.avatarUrl,
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
    content: comment.content,
    createdAt: comment.createdAt,
    author: formatAuthor(comment.author),
    mentions,
  };
}

export function formatPost(post: any, currentUserId?: string) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    attachment: post.attachmentUrl
      ? {
          url: post.attachmentUrl,
          name: post.attachmentName,
          type: post.attachmentMimeType,
        }
      : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,

    category: post.category
      ? {
          id: post.category.id,
          name: post.category.name
        }
      : null,
    author: formatAuthor(post.author),
    counts: {
      likes: post._count?.likes ?? 0,
      comments: post._count?.comments ?? 0,
      bookmarks: post._count?.bookmarks ?? 0,
    },
    likedByMe: currentUserId ? (post.likes?.length ?? 0) > 0 : false,
    bookmarkedByMe: currentUserId ? (post.bookmarks?.length ?? 0) > 0 : false,
    mentions: post.mentions?.map((mention: any) => ({
      userId: mention.user.id,
      username: mention.user.username,
      displayName:
        [mention.user.firstName, mention.user.lastName].filter(Boolean).join(' ') ||
        mention.user.username,
    })) ?? [],
    comments: post.comments
      ? post.comments.map((comment: any) => formatComment(comment))
      : undefined,
  };
}
