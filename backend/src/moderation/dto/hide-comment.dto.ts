import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HideCommentDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
  
}
