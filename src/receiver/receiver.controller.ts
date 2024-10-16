import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReceiverService } from './receiver.service';
import { RawDataType } from 'src/types/models';

@Controller('receiver')
export class ReceiverController {
  constructor(private readonly receiverService: ReceiverService) {}

  @MessagePattern('test')
  receiveNetworkRawData(@Payload() message: RawDataType) {
    this.receiverService.handleNetworkData(message);
  }
}
