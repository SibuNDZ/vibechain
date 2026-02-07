import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

const logger = new Logger("Database");

export function handleDatabaseError(error: unknown, context?: string): never {
  if (context) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${context}: ${message}`, error instanceof Error ? error.stack : undefined);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        throw new ConflictException("Resource already exists");
      case "P2025":
        throw new NotFoundException("Resource not found");
      case "P2003":
        throw new BadRequestException("Invalid relationship reference");
      default:
        break;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new BadRequestException("Invalid database input");
  }

  throw new InternalServerErrorException("Database error");
}
