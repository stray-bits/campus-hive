import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(30) username?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @Type(() => Number) @IsInt() graduationYear?: number;
}
