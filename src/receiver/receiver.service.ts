import { Injectable } from '@nestjs/common';
import { PortScanService } from 'src/detection/port-scan.service';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';
import { PcapIncomingPacket } from 'src/common/types/pcap.models';
import { PcapNetworkService } from './pcap.network.service';
import { FloodDetectionService } from 'src/detection/flood-detection.service';

@Injectable()
export class ReceiverService {
  constructor(
    private readonly pcapNetworkService: PcapNetworkService,
    private readonly portScanService: PortScanService,
    private readonly elasticSearchService: ElasticsearchService,
    private readonly floodDetectionService: FloodDetectionService,
  ) {}

  async handlePcapNetworkData(jsonMessage: PcapIncomingPacket) {
    const parsedPacket =
      this.pcapNetworkService.parseIncomingPacket(jsonMessage);
    this.portScanService.processPcapPacket(parsedPacket);
    this.floodDetectionService.detectFlood(parsedPacket);
    this.elasticSearchService.indexPacket(parsedPacket);
  }
}
