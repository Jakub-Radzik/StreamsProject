import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';
import { RawDataType } from 'src/utils/models';
import { NetworkService } from 'src/utils/network.service';

@Injectable()
export class DataHandlerService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly networkService: NetworkService,
  ) {}

  async searchElasticsearch() {
    const query = {
      query: {
        match_all: {},
      },
    };
    const result = await this.elasticsearchService.search(
      'your-index-name',
      query,
    );
    return result.hits.hits;
  }

  async indexDocument() {
    const body = {
      title: 'NestJS with Elasticsearch',
      content: 'This is a test document.',
    };
    await this.elasticsearchService.indexData('your-index-name', '1', body);
  }

  async handleNetworkData(jsonMessage: RawDataType) {
    const parsedData = await this.networkService.handleNetworkData(jsonMessage);
    console.log(parsedData);
  }
}
