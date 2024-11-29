import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';
import { ALARM_INDEX, Alarms } from 'src/common/types/elastic';
import {
  DnsAmplificationData,
  DocType,
  FloodData,
  PortScanData,
} from './types';

@Injectable()
export class PortScanSchedulerService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  @Cron('*/10 * * * * *')
  async checkAndSaveFlaggedScans() {
    const keys = await this.cacheManager.store.keys();

    const alarmsToSave = [];

    for (const key of keys) {
      if (key.startsWith('flagged:')) {
        try {
          const splitKey = key.split(':');
          const incident_type = splitKey[1] as Alarms;

          let scanData;
          let id;
          let doc;

          switch (incident_type) {
            case Alarms.PORT_SCAN:
              scanData = await this.cacheManager.get<PortScanData>(key);
              if (scanData) {
                id = `${scanData.srcIp}-${scanData.timestamp}-${scanData.incident_type}`;
                doc = {
                  incident_type: scanData.incident_type,
                  srcIp: scanData.srcIp,
                  uniquePortsCount: scanData.uniquePortsCount,
                  connectionCount: scanData.connectionCount,
                  timestamp: new Date(scanData.timestamp).toISOString(),
                };
                alarmsToSave.push({ id, doc, alarm: scanData.incident_type });
                await this.cacheManager.del(key);
              }
              break;

            case Alarms.ICMP_FLOOD:
            case Alarms.SYN_FLOOD:
            case Alarms.UDP_FLOOD:
              const floodData = await this.cacheManager.get<FloodData>(key);
              if (floodData) {
                id = `${floodData.destIp}-${floodData.timestamp}-${floodData.incident_type}`;
                doc = {
                  incident_type: floodData.incident_type,
                  srcIps: floodData.srcIps,
                  destIp: floodData.destIp,
                  packetsCount: floodData.packetsCount,
                  timestamp: new Date(floodData.timestamp).toISOString(),
                };
                alarmsToSave.push({ id, doc, alarm: floodData.incident_type });
                await this.cacheManager.del(key);
              }
              break;

            case Alarms.DNS_AMPLIFICATION:
              const dnsData =
                await this.cacheManager.get<DnsAmplificationData>(key);
              if (dnsData) {
                id = `${dnsData.destIp}-${dnsData.timestamp}-${dnsData.incident_type}`;
                doc = {
                  incident_type: dnsData.incident_type,
                  srcIp: dnsData.srcIp,
                  destIp: dnsData.destIp,
                  packetsCount: dnsData.count,
                  timestamp: new Date(dnsData.timestamp).toISOString(),
                };
                alarmsToSave.push({ id, doc, alarm: dnsData.incident_type });
                await this.cacheManager.del(key);
              }
              break;
          }
        } catch (error) {
          console.error(`Error processing cache key ${key}:`, error);
        }
      }
    }

    // Save alarms in bulk to Elasticsearch
    if (alarmsToSave.length > 0) {
      await this.saveAlarmsBulk(alarmsToSave);
    }
  }

  async saveAlarmsBulk(alarms: { id: string; doc: DocType; alarm: Alarms }[]) {
    for (const alarm of alarms) {
      try {
        await this.elasticsearchService.indexData(
          ALARM_INDEX,
          alarm.id,
          alarm.doc,
        );
      } catch (error) {
        console.error(
          `Error saving alarm ${alarm.alarm} to Elasticsearch:`,
          error,
        );
      }
    }
  }
}
