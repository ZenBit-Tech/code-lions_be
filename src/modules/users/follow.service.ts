import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';

import { FollowVendorDto } from './dto/follow.dto';
import { User } from './user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async followVendor(followDto: FollowVendorDto): Promise<User> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'following')
        .of(followDto.buyerId)
        .add(followDto.vendorId);

      const buyerWithFollowers = await this.userRepository
        .createQueryBuilder('buyer')
        .leftJoinAndSelect('buyer.following', 'following')
        .where('buyer.id = :buyerId', { buyerId: followDto.buyerId })
        .getOne();

      if (!buyerWithFollowers) {
        throw new NotFoundException('Buyer not found');
      }

      return buyerWithFollowers;
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_FOLLOW_VENDOR);
    }
  }

  async unfollowVendor(followDto: FollowVendorDto): Promise<void> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .relation(User, 'following')
        .of(followDto.buyerId)
        .remove(followDto.vendorId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UNFOLLOW_VENDOR);
    }
  }
}
