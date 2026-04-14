/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, Prisma } from '../generated/prisma';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}
  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────
  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return await this.prisma.post.create({
      data,
      include: {
        author: true,
        categories: true,
      },
    });
  }

  // ─────────────────────────────────────────
  // FIND ALL
  // ─────────────────────────────────────────
  async findAll(): Promise<Post[]> {
    return await this.prisma.post.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────
  async findOne(id: number): Promise<Post | null> {
    return await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        categories: true,
      },
    });
  }

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────
  async update(id: number, data: Prisma.PostUpdateInput): Promise<Post> {
    return await this.prisma.post.update({
      where: { id },
      data,
      include: { author: true },
    });
  }

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────
  async remove(id: number): Promise<Post> {
    return await this.prisma.post.delete({
      where: { id },
    });
  }

  // ─────────────────────────────────────────
  // BULK — createMany
  // ─────────────────────────────────────────
  async createMany(posts: Prisma.PostCreateManyInput[]) {
    return await this.prisma.post.createMany({
      data: posts,
      skipDuplicates: true,
    });
  }

  // ─────────────────────────────────────────
  // TRANSACTION — créer user + post ensemble
  // ─────────────────────────────────────────
  async createUserWithPost(
    email: string,
    firstName: string,
    postTitle: string,
  ) {
    return await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName: '',
        password: '',
        posts: {
          create: {
            title: postTitle,
            content: '',
          },
        },
      },
      include: { posts: true },
    });
  }

  // ─────────────────────────────────────────
  // INTERACTIVE TRANSACTION
  // ─────────────────────────────────────────
  async transferPost(postId: number, fromUserId: number, toUserId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.findFirst({
        where: { id: postId, authorId: fromUserId },
      });

      if (!post) {
        throw new Error('Post introuvable ou accès refusé');
      }

      const toUser = await tx.user.findUnique({
        where: { id: toUserId },
      });

      if (!toUser) {
        throw new Error('Utilisateur destinataire introuvable');
      }

      return await tx.post.update({
        where: { id: postId },
        data: { authorId: toUserId },
      });
    });
  }
}
