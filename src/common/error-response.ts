import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ example: 500, description: 'Error status code' })
  statusCode: number;

  @ApiProperty({
    description: 'Detailed description of the error',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiPropertyOptional({
    example: 'Internal server error',
    description: 'Brief description of the error',
  })
  error?: string;
}
