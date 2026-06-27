import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsOptional() @IsString() content?: string;
  @IsString() categoryId: string;
}
