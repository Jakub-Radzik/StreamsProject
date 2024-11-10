import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MY_IP_ADDRESS } from 'src/common/constants';
import {
  PcapParsedPacket,
  TransportPayload,
} from 'src/common/types/pcap.models';
import { IPProtocol } from 'src/common/types/ip.protocols';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';

@Injectable()
export class PortScanService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async processPcapPacket(parsedPacket: PcapParsedPacket) {
    const { ethernetPayload, timestamp } = parsedPacket;

    if (!ethernetPayload.ipPayload) return;

    const { src_ip_addr, protocol_number } = ethernetPayload.ipPayload;

    if (src_ip_addr === MY_IP_ADDRESS) return;

    let dstPort: number | undefined;
    let tcp: TransportPayload | undefined;
    let udp: TransportPayload | undefined;

    if (protocol_number === IPProtocol.TCP) {
      tcp = ethernetPayload.ipPayload.transportPayload;
      if (tcp.flags?.ack) return; // Ignore ACK packets
      dstPort = tcp.dport;
    } else if (protocol_number === IPProtocol.UDP) {
      udp = ethernetPayload.ipPayload.transportPayload;
      dstPort = udp.dport;
    } else {
      return;
    }

    const timeWindowKey = `${src_ip_addr}:recent`;

    let scanData = (await this.cacheManager.get<{
      ports: Set<number>;
      count: number;
    }>(timeWindowKey)) || { ports: new Set(), count: 0 };

    scanData.ports.add(dstPort);
    scanData.count++;

    await this.cacheManager.set(timeWindowKey, scanData, 10_000);

    const uniquePortsCount = scanData.ports.size;
    const connectionCount = scanData.count;

    const UNIQUE_PORTS_THRESHOLD = 50;
    const CONNECTIONS_THRESHOLD = 50;

    const flaggedKey = `flagged:${src_ip_addr}`;

    if (
      uniquePortsCount > UNIQUE_PORTS_THRESHOLD &&
      connectionCount > CONNECTIONS_THRESHOLD
    ) {
      await this.cacheManager.set(
        flaggedKey,
        {
          srcIp: src_ip_addr,
          uniquePortsCount,
          connectionCount,
          timestamp,
        },
        200_000,
      );
    }
  }

  async saveToElasticsearch(scanData: {
    srcIp: string;
    uniquePortsCount: number;
    connectionCount: number;
    timestamp: number;
  }) {
    try {
      await this.elasticsearchService.update({
        index: 'port-scanning-events',
        id: `${scanData.srcIp}-${scanData.timestamp}`,
        body: {
          doc: {
            srcIp: scanData.srcIp,
            uniquePortsCount: scanData.uniquePortsCount,
            connectionCount: scanData.connectionCount,
            timestamp: new Date(scanData.timestamp).toISOString(),
          },
          doc_as_upsert: true,
        },
      });
      console.log(`Saved port scan for ${scanData.srcIp} to Elasticsearch.`);
    } catch (error) {
      console.error('Error saving to Elasticsearch:', error);
    }
  }
}
