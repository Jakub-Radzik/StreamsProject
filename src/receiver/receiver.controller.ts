import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReceiverService } from './receiver.service';
import { PcapIncomingPacket } from 'src/common/types/pcap.models';

@Controller('receiver')
export class ReceiverController {
  constructor(private readonly receiverService: ReceiverService) {}

  @MessagePattern('pcap')
  receivePcapPacket(@Payload() message: PcapIncomingPacket) {
    this.receiverService.handlePcapNetworkData(message);
  }
}
