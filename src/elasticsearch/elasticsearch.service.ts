import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { PcapngNetworkPacket } from 'src/common/types/pcapng.models';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { createHash } from 'crypto';

@Injectable()
export class ElasticsearchService {
  constructor(
    @Inject('ELASTICSEARCH_CLIENT') private readonly client: Client,
  ) {}

  async search(index: string, query: any) {
    return this.client.search({
      index,
      body: query,
    });
  }

  async indexData(index: string, id: string, body: any) {
    return this.client.index({
      index,
      id,
      body,
    });
  }

  async deleteData(index: string, id: string) {
    return this.client.delete({
      index,
      id,
    });
  }

  async indexPacket(packet: PcapParsedPacket): Promise<void> {
    const { ethernetPayload, timestamp, timestampISO, caplen, len, link_type } =
      packet;
    const id = this.generatePacketId(packet);
    await this.indexData('network-packets-v4', id, {
      link_type,
      timestamp,
      timestampISO,
      caplen,
      len,
      ethernetPayload,
    });
  }

  private generatePacketId(packet: PcapParsedPacket): string {
    const {
      ethernetPayload: {
        ipPayload: { src_ip_addr, dest_ip_addr, identification },
      },
      timestamp,
    } = packet;

    const uniqueString = `${src_ip_addr}-${dest_ip_addr}-${timestamp}-${identification}`;

    return createHash('sha256').update(uniqueString).digest('hex');
  }
}
