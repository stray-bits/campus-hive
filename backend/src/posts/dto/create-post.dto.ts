import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() categoryName?: string;
  @IsOptional() @IsString() imageUrl?: string;
}
