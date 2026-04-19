import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdoptionRequestsService } from './adoption-requests.service';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { UpdateAdoptionRequestStatusDto } from './dto/update-adoption-request-status.dto';

@Controller('adoption-requests')
@UseGuards(JwtAuthGuard)
export class AdoptionRequestsController {
  constructor(private readonly adoptionRequestsService: AdoptionRequestsService) {}

  @Post()
  create(
    @Req() req: any,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) createDto: CreateAdoptionRequestDto,
  ) {
    return this.adoptionRequestsService.create(req.user.id, createDto);
  }

  @Get('my')
  getMyRequests(@Req() req: any, @Query('postId') postId?: string) {
    return this.adoptionRequestsService.getMyRequests(req.user.id, postId);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) updateDto: UpdateAdoptionRequestStatusDto,
  ) {
    return this.adoptionRequestsService.updateStatus(req.user.id, id, updateDto);
  }
}
