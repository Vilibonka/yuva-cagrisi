import { IsIn, IsOptional, IsString } from 'class-validator';

const REVIEWABLE_REQUEST_STATUSES = ['APPROVED', 'REJECTED'] as const;

export class UpdateAdoptionRequestStatusDto {
  @IsIn(REVIEWABLE_REQUEST_STATUSES)
  status!: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  note?: string;
}
