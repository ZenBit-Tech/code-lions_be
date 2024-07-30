import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';

import { FollowDto } from './dto/follow.dto';
import { User } from './user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async followVendor(followDto: FollowDto): Promise<User> {
    try {
      const buyer = await this.userRepository.findOne({
        where: { id: followDto.buyerId },
        relations: ['following'],
      });

      const vendor = await this.userRepository.findOne({
        where: { id: followDto.vendorId },
      });

      if (!buyer || !vendor) {
        throw new NotFoundException('Invalid buyer or vendor ID');
      }

      buyer.following.push(vendor);

      vendor.isFollowed = true;

      return this.userRepository.save(buyer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_FOLLOW_VENDOR);
    }
  }

  async unfollowVendor(followDto: FollowDto): Promise<void> {
    try {
      const buyer = await this.userRepository.findOne({
        where: { id: followDto.buyerId },
        relations: ['following'],
      });

      const vendor = await this.userRepository.findOne({
        where: { id: followDto.vendorId },
      });

      if (!buyer || !vendor) {
        throw new NotFoundException('Invalid buyer or vendor ID');
      }

      buyer.following = buyer.following.filter(
        (followedVendor) => followedVendor.id !== vendor.id,
      );

      vendor.isFollowed = false;

      await this.userRepository.save(buyer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UNFOLLOW_VENDOR);
    }
  }
}
