import { Injectable } from '@nestjs/common';
import { RawDataType } from 'src/types/models';
import { NetworkService } from './network.service';

@Injectable()
export class ReceiverService {
  constructor(private readonly networkService: NetworkService) {}

  async handleNetworkData(jsonMessage: RawDataType) {
    // Parse data
    const parsedData = await this.networkService.parseRawData(jsonMessage);

    // Do some other logic with parsed data using imported modules
    console.log(parsedData);
  }
}
