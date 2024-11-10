import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PortScanService } from './port-scan.service';

@Injectable()
export class PortScanSchedulerService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly portScanService: PortScanService,
  ) {}

  @Cron('30 * * * * *')
  async checkAndSaveFlaggedScans() {
    console.log('CHECK FLAGGED SCANS');
    const keys = await this.cacheManager.store.keys();

    for (const key of keys) {
      if (key.startsWith('flagged:')) {
        const scanData = await this.cacheManager.get<{
          srcIp: string;
          uniquePortsCount: number;
          connectionCount: number;
          timestamp: number;
        }>(key);

        if (scanData) {
          await this.portScanService.saveToElasticsearch(scanData);
          await this.cacheManager.del(key);
        }
      }
    }
  }
}
