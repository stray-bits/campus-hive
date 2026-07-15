import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportStatusDto {
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export class ReviewReportDto {
  @IsEnum(ReportStatusDto) status: ReportStatusDto;
  @IsOptional() @IsString() resolutionNote?: string;
}
