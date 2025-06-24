import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [ClinicService, PrismaService],
})
export class ClinicModule {}
