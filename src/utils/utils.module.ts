import { Module } from '@nestjs/common';
import { NetworkService } from './network.service';

@Module({
  exports: [NetworkService],
  providers: [NetworkService],
})
export class UtilsModule {}
