import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { LocationService } from './location.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [ClinicService, LocationService, PrismaService],
  exports: [ClinicService, LocationService],
})
export class ClinicModule {}
