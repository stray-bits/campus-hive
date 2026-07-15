import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ReportReason } from '../../common/enums/report-reason.enum';

export class CreateReportDto {
  @IsEnum(ReportReason) reason: ReportReason;

  @IsOptional() @IsString() details?: string;
}
