import { Module } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ElasticsearchService } from './elasticsearch.service';

@Module({
  providers: [
    {
      provide: 'ELASTICSEARCH_CLIENT',
      useFactory: () => {
        return new Client({
          node: 'http://localhost:9200',
          auth: {
            username: 'elastic',
            password: 'password',
          },
        });
      },
    },
    ElasticsearchService,
  ],
  exports: ['ELASTICSEARCH_CLIENT', ElasticsearchService],
})
export class ElasticsearchModule {}
