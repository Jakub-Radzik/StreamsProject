import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReceiverService } from './receiver.service';
import { PcapngRawDataType } from 'src/common/types/pcapng.models';

@Controller('receiver')
export class ReceiverController {
  constructor(private readonly receiverService: ReceiverService) {}

  @MessagePattern('test2')
  receiveNetworkRawData(@Payload() message: PcapngRawDataType) {
    this.receiverService.handleNetworkData(message);
  }

  @MessagePattern('pcap')
  receivePcapPacket(@Payload() message: any) {
    console.log('message: ', JSON.stringify(message));
    console.log('message: ', JSON.stringify(message).length);
  }
}
