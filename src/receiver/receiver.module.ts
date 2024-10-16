import { Module } from '@nestjs/common';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { NetworkService } from './network.service';

@Module({
  controllers: [ReceiverController],
  imports: [],
  providers: [ReceiverService, NetworkService],
})
export class ReceiverModule {}
