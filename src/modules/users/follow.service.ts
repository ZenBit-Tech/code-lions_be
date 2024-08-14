import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';

import { User } from './user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async followVendor(buyerId: string, vendorId: string): Promise<User> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'following')
        .of(buyerId)
        .add(vendorId);

      const buyerWithFollowers = await this.userRepository
        .createQueryBuilder('buyer')
        .leftJoinAndSelect('buyer.following', 'following')
        .where('buyer.id = :buyerId', { buyerId })
        .getOne();

      if (!buyerWithFollowers) {
        throw new NotFoundException('Buyer not found');
      }

      return buyerWithFollowers;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_FOLLOW_VENDOR);
    }
  }

  async unfollowVendor(buyerId: string, vendorId: string): Promise<void> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'following')
        .of(buyerId)
        .remove(vendorId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UNFOLLOW_VENDOR);
    }
  }
}
