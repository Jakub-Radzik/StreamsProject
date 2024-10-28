import { Injectable } from '@nestjs/common';
import { PcapngRawDataType } from 'src/common/types/pcapng.models';
import { PcapngNetworkService } from './pcapng.network.service';
import { PortScanService } from 'src/detection/port-scan.service';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';

@Injectable()
export class ReceiverService {
  constructor(
    private readonly networkService: PcapngNetworkService,
    private readonly portScanService: PortScanService,
    private readonly elasticSearchService: ElasticsearchService,
  ) {}

  async handleNetworkData(jsonMessage: PcapngRawDataType) {
    const parsedData = await this.networkService.parseRawData(jsonMessage);
    this.portScanService.processPacket(parsedData);
    this.elasticSearchService.indexPacket(parsedData);
  }
}
