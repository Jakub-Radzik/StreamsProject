import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

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
}
