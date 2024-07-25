import { ApiProperty } from '@nestjs/swagger';
import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Errors } from 'src/common/errors';
import { LIMIT_OF_CHARACTERS_FOR_ADDRESS } from 'src/config';

import { Order } from './order.entity';

@Entity('addresses')
export class Address {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the address',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'First address line of the user',
    type: String,
  })
  @MaxLength(LIMIT_OF_CHARACTERS_FOR_ADDRESS, {
    message: Errors.TOO_LONG_ADDRESS_LINE1,
  })
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  @IsNotEmpty({ message: Errors.ADDRESS_CANNOT_BE_EMPTY })
  addressLine1: string;

  @ApiProperty({
    example: 'Apt 101',
    description: 'Second address line of the user',
    type: String,
  })
  @MaxLength(LIMIT_OF_CHARACTERS_FOR_ADDRESS, {
    message: Errors.TOO_LONG_ADDRESS_LINE2,
  })
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  addressLine2: string;

  @ApiProperty({
    example: 'Canada',
    description: 'The user`s country',
    type: String,
  })
  @IsNotEmpty({ message: Errors.COUNTRY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.COUNTRY_IS_STRING })
  country: string;

  @ApiProperty({
    example: 'Nunavut',
    description: 'The user`s state',
    type: String,
  })
  @IsNotEmpty({ message: Errors.USERS_STATE_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_STATE_IS_STRING })
  state: string;

  @ApiProperty({
    example: 'Tuktoyaktuk',
    description: 'The user`s city',
    type: String,
  })
  @IsNotEmpty({ message: Errors.USERS_CITY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_CITY_IS_STRING })
  city: string;

  @OneToMany(() => Order, (order) => order.address)
  orders: Order[];
}
