import {
  BadRequestException,
  ConflictException,
  HttpException,
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

  // Callers deliberately throw well-formed HTTP exceptions (e.g. NotFoundException
  // for "video not found") from inside the same try block this feeds -- those
  // aren't database errors and must pass through unchanged, not get masked as 500.
  if (error instanceof HttpException) {
    throw error;
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
