import { Injectable } from '@nestjs/common';
import { RawDataType } from 'src/common/types/models';
import { NetworkService } from './network.service';
import { PortScanService } from 'src/detection/port-scan.service';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';

@Injectable()
export class ReceiverService {
  constructor(
    private readonly networkService: NetworkService,
    private readonly portScanService: PortScanService,
    private readonly elasticSearchService: ElasticsearchService,
  ) {}

  async handleNetworkData(jsonMessage: RawDataType) {
    const parsedData = await this.networkService.parseRawData(jsonMessage);
    this.portScanService.processPacket(parsedData);
    this.elasticSearchService.indexPacket(parsedData);
  }
}
