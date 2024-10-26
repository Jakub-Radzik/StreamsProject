import { Module } from '@nestjs/common';
import { PortScanService } from './port-scan.service';

@Module({
  exports: [PortScanService],
  providers: [PortScanService],
})
export class DetectionModule {}
