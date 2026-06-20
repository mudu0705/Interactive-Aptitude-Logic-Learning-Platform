import { Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createPostSchema, createCommentSchema } from 'shared';

export const getPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const userId = req.user?.id;

    const posts = await prisma.forumPost.findMany({
      where: category ? { category: String(category) } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true },
        },
        likes: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      authorId: post.authorId,
      authorName: post.author.name,
      createdAt: post.createdAt.toISOString(),
      likesCount: post.likes.length,
      commentsCount: post._count.comments,
      isLikedByUser: userId ? post.likes.some((like) => like.userId === userId) : false,
    }));

    return res.json({ success: true, posts: formattedPosts });
  } catch (error) {
    next(error);
  }
};

export const getPostDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } },
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { name: true } },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Forum post not found' });
    }

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      authorId: post.authorId,
      authorName: post.author.name,
      createdAt: post.createdAt.toISOString(),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      isLikedByUser: userId ? post.likes.some((like) => like.userId === userId) : false,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.author.name,
        createdAt: comment.createdAt.toISOString(),
      })),
    };

    return res.json({ success: true, post: formattedPost });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const data = createPostSchema.parse(req.body);

    const post = await prisma.forumPost.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        authorId: userId,
      },
    });

    return res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

export const toggleLikePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;

    const existingLike = await prisma.forumLike.findFirst({
      where: {
        postId: id,
        userId,
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.forumLike.delete({
        where: { id: existingLike.id },
      });
      return res.json({ success: true, liked: false });
    } else {
      // Like
      await prisma.forumLike.create({
        data: {
          postId: id,
          userId,
        },
      });
      return res.json({ success: true, liked: true });
    }
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const data = createCommentSchema.parse(req.body);

    const comment = await prisma.forumComment.create({
      data: {
        content: data.content,
        postId: id,
        authorId: userId,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.author.name,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
