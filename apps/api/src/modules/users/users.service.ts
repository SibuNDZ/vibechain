import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  USERNAME_COOLDOWN_MS,
  USERNAME_FORMAT_MESSAGE,
  USERNAME_HOLD_MS,
  isReservedUsername,
  isValidUsernameFormat,
} from "../../common/username/username-policy";

interface CreateUserData {
  email?: string;
  username: string;
  passwordHash?: string;
  walletAddress?: string;
  avatarUrl?: string | null;
  bio?: string | null;
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
    return this.prisma.user.findFirst({
      where: {
        walletAddress: {
          equals: walletAddress,
          mode: "insensitive",
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateUserData>) {
    const current = await this.prisma.user.findUnique({
      where: { id },
      select: { username: true, lastUsernameChangeAt: true },
    });
    if (!current) {
      throw new BadRequestException("User not found");
    }

    const updateData: Partial<CreateUserData> = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const isUsernameChange =
      data.username !== undefined && data.username !== current.username;

    if (!isUsernameChange) {
      return this.prisma.user.update({ where: { id }, data: updateData });
    }

    const newUsername = data.username as string;
    await this.assertUsernameChangeAllowed(
      id,
      newUsername,
      current.lastUsernameChangeAt
    );

    const now = new Date();
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { ...updateData, username: newUsername, lastUsernameChangeAt: now },
      }),
      this.prisma.usernameHistory.create({
        data: { userId: id, oldUsername: current.username, newUsername },
      }),
    ]);

    return updatedUser;
  }

  /**
   * Format/reserved/cooldown/hold checks for an EXISTING user renaming.
   * Reclaiming your own previously-released handle skips the hold (but not
   * the cooldown) -- see assertUsernameAvailableForRegistration for the
   * brand-new-account path, which has no "self" to exempt.
   */
  private async assertUsernameChangeAllowed(
    userId: string,
    newUsername: string,
    lastChangeAt: Date | null
  ) {
    if (!isValidUsernameFormat(newUsername)) {
      throw new BadRequestException(USERNAME_FORMAT_MESSAGE);
    }
    if (isReservedUsername(newUsername)) {
      throw new ConflictException("This username is reserved");
    }

    if (lastChangeAt) {
      const elapsedMs = Date.now() - lastChangeAt.getTime();
      if (elapsedMs < USERNAME_COOLDOWN_MS) {
        const nextEligible = new Date(lastChangeAt.getTime() + USERNAME_COOLDOWN_MS);
        throw new HttpException(
          `Username can only be changed once every 30 days. Next change available ${nextEligible.toISOString().slice(0, 10)}.`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    const takenByOther = await this.prisma.user.findFirst({
      where: { username: { equals: newUsername, mode: "insensitive" }, NOT: { id: userId } },
      select: { id: true },
    });
    if (takenByOther) {
      throw new ConflictException("Username is already taken");
    }

    const heldByOther = await this.prisma.usernameHistory.findFirst({
      where: {
        oldUsername: { equals: newUsername, mode: "insensitive" },
        changedAt: { gt: new Date(Date.now() - USERNAME_HOLD_MS) },
        NOT: { userId },
      },
      select: { id: true },
    });
    if (heldByOther) {
      throw new ConflictException(
        "This username was recently released by another account and is on hold for 30 days"
      );
    }
  }

  /** Same reserved/hold checks as above, for brand-new accounts (no "self" to exempt from the hold). */
  async assertUsernameAvailableForRegistration(username: string) {
    if (!isValidUsernameFormat(username)) {
      throw new BadRequestException(USERNAME_FORMAT_MESSAGE);
    }
    if (isReservedUsername(username)) {
      throw new ConflictException("This username is reserved");
    }

    const held = await this.prisma.usernameHistory.findFirst({
      where: {
        oldUsername: { equals: username, mode: "insensitive" },
        changedAt: { gt: new Date(Date.now() - USERNAME_HOLD_MS) },
      },
      select: { id: true },
    });
    if (held) {
      throw new ConflictException(
        "This username was recently released and is on hold for 30 days"
      );
    }
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
