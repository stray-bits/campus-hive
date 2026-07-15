import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePostDto {
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() attachmentUrl?: string;
  @IsOptional() @IsBoolean() isAnonymous?: boolean;
}
