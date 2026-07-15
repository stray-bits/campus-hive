import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

export class SuspendUserDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
  @IsOptional() @IsBoolean() permanent?: boolean;
}
