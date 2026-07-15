import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HidePostDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
