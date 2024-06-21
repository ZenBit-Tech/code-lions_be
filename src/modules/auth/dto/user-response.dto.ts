import { ApiProperty } from '@nestjs/swagger';

import { RoleForUser } from 'src/modules/roles/role-user.enum';
import { Role } from 'src/modules/roles/role.enum';

export class UserResponseDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
  })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  name: string;

  @ApiProperty({
    example: 'example@example.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiProperty({
    example: 'buyer',
    description: 'The role of the user',
  })
  role: Role | RoleForUser;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is verified',
  })
  isEmailVerified: boolean;

  @ApiProperty({
    example: 'file-1718301871158-882823500.jpg',
    description: 'The users profile photo',
  })
  photoUrl: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the user',
  })
  phoneNumber: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Address line 1 of the user',
  })
  addressLine1: string;

  @ApiProperty({
    example: 'Apt 101',
    description: 'Address line 2 of the user',
  })
  addressLine2: string;

  @ApiProperty({
    example: 'Canada',
    description: 'Country of the user',
  })
  country: string;

  @ApiProperty({
    example: 'Ontario',
    description: 'State of the user',
  })
  state: string;

  @ApiProperty({
    example: 'Toronto',
    description: 'City of the user',
  })
  city: string;

  @ApiProperty({
    example: 'L',
    description: 'Clothes size of the user',
  })
  clothesSize: string;

  @ApiProperty({
    example: 'W 27 H 33',
    description: 'Jeans size of the user',
  })
  jeansSize: string;

  @ApiProperty({
    example: '10',
    description: 'Shoes size of the user',
  })
  shoesSize: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the users profile is active',
  })
  isAccountActive: boolean;

  @ApiProperty({
    example: new Date(),
    description: 'The creation date of the user',
  })
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The last update date of the user',
  })
  lastUpdatedAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The deletion date of the user',
  })
  deletedAt: Date;

  @ApiProperty({
    example: '1',
    description:
      'Indicates how many steps user completed filling shipping profile',
  })
  onboardingSteps: string;
}
