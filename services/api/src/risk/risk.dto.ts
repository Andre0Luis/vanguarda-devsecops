import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * DTOs com validação estrita (whitelist + forbidNonWhitelisted no ValidationPipe).
 * Limites de tamanho mitigam DoS por payload e ReDoS nas heurísticas.
 */
export class UrlCheckDto {
  @ApiProperty({ example: 'https://caixa-premio-resgate.top/pix' })
  @IsString()
  @MinLength(4)
  @MaxLength(2048)
  url!: string;
}

export class SmsCheckDto {
  @ApiProperty({ example: 'Oi mãe, troquei de número. Faz um pix urgente?' })
  @IsString()
  @MinLength(1)
  @MaxLength(1600)
  text!: string;
}

export class PixCheckDto {
  @ApiProperty({ enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'] })
  @IsIn(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'])
  keyType!: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

  @ApiProperty({ example: 150000, description: 'Valor em centavos' })
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  amountInCents!: number;

  @ApiProperty()
  @IsBoolean()
  firstTimeRecipient!: boolean;

  @ApiProperty({ minimum: 0, maximum: 23 })
  @IsInt()
  @Min(0)
  @Max(23)
  localHour!: number;

  @ApiProperty()
  @IsBoolean()
  originatedFromMessage!: boolean;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  reportedCount!: number;
}
