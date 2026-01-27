import { HttpException, HttpStatus } from '@nestjs/common';

export class CampaignNotActiveException extends HttpException {
  constructor(campaignId: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Campaign ${campaignId} is not active`,
        error: 'CampaignNotActive',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class VoteLimitExceededException extends HttpException {
  constructor(userId: string, limit: number) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `User has reached the vote limit of ${limit}`,
        error: 'VoteLimitExceeded',
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class InvalidSignatureException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Wallet signature verification failed',
        error: 'InvalidSignature',
      },
      HttpStatus.UNAUTHORIZED
    );
  }
}

export class VideoNotEligibleException extends HttpException {
  constructor(videoId: string, reason: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Video ${videoId} is not eligible: ${reason}`,
        error: 'VideoNotEligible',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class DuplicateVoteException extends HttpException {
  constructor(videoId: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Already voted for video ${videoId}`,
        error: 'DuplicateVote',
      },
      HttpStatus.CONFLICT
    );
  }
}

export class CampaignAlreadyExistsException extends HttpException {
  constructor(videoId: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `A campaign already exists for video ${videoId}`,
        error: 'CampaignAlreadyExists',
      },
      HttpStatus.CONFLICT
    );
  }
}
