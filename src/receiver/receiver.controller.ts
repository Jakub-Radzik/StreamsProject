import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReceiverService } from './receiver.service';
import { RawDataType } from 'src/common/types/models';

@Controller('receiver')
export class ReceiverController {
  constructor(private readonly receiverService: ReceiverService) {}

  @MessagePattern('test2')
  receiveNetworkRawData(@Payload() message: RawDataType) {
    this.receiverService.handleNetworkData(message);
  }

  @MessagePattern('pcap')
  receivePcapPacket(@Payload() message: any) {
    console.log('message: ', message);
  }
}
