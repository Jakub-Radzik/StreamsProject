import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { PcapngNetworkPacket } from 'src/common/types/pcapng.models';

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

  async indexPacket(packet: PcapngNetworkPacket): Promise<void> {
    const { interfaceId, timestamp, parsedPacket } = packet;
    const id = `${interfaceId}-${timestamp.getTime()}`;
    await this.indexData('network-packets-v3', id, {
      interfaceId,
      timestamp,
      parsedPacket,
    });
  }
}
