import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePostDto {
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() categoryName?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() attachmentUrl?: string;
  @IsOptional() @IsBoolean() isAnonymous?: boolean;
}
