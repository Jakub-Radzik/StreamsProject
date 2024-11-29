import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { createHash } from 'crypto';
import { NETWORK_INDEX } from 'src/common/types/elastic';

@Injectable()
export class ElasticsearchService {
  constructor(
    @Inject('ELASTICSEARCH_CLIENT') private readonly client: Client,
  ) {}

  async get(index: string, id: string) {
    return this.client.get({
      index,
      id,
    });
  }

  async search(query: any) {
    return this.client.search({
      // It should be more generic (any index)
      index: NETWORK_INDEX,
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

  async bulk(operations: any[]) {
    try {
      const response = await this.client.bulk({
        body: operations,
      });

      if (response.errors) {
        const erroredDocuments = response.items.filter(
          (item: any) => item.index && item.index.error,
        );
        console.error(
          'Bulk operation had errors:',
          JSON.stringify(erroredDocuments),
        );
      }

      return response;
    } catch (error) {
      console.error('Error in bulk operation:', error);
      throw error;
    }
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

    // It should be somewhere else
    await this.indexData(NETWORK_INDEX, id, {
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

  async update(params: { index: string; id: string; body: any }) {
    return this.client.update({
      index: params.index,
      id: params.id,
      body: params.body,
      retry_on_conflict: 3,
    });
  }
}
