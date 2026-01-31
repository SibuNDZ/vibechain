import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

interface CreateUserData {
  email?: string;
  username: string;
  passwordHash?: string;
  walletAddress?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByWallet(walletAddress: string) {
    return this.prisma.user.findUnique({
      where: { walletAddress },
    });
  }

  async update(id: string, data: Partial<CreateUserData>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            videos: true,
            votes: true,
            contributions: true,
          },
        },
      },
    });
  }

  async searchByUsername(query: string, limit = 10) {
    if (!query || query.length < 1) {
      return { data: [] };
    }

    const users = await this.prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
      take: Math.min(limit, 20),
      orderBy: {
        username: "asc",
      },
    });

    return { data: users };
  }
}
