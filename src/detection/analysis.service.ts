import { Inject, Injectable, Logger } from '@nestjs/common';
import { PacketSizeService } from './packet-size.service';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { Alarms } from 'src/common/types/elastic';
import { StatisticAnomalyData, StatisticAnomalyType } from './types';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class StandardDeviationAnalysisService {
  private readonly logger = new Logger(StandardDeviationAnalysisService.name);

  tresholds = [3, 4, 5];

  constructor(
    private readonly packetSizeService: PacketSizeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async processPacket(packet: PcapParsedPacket): Promise<void> {
    const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;
    const packetSize = packet.len;

    this.tresholds.forEach((treshold) => {
      this.packetSizeService.processPacket(packet);
      if (this.packetSizeService.isAnomalous(srcIp, packetSize, treshold)) {
        const meanSize = this.packetSizeService.getMeanSize(srcIp);
        const stdDevSize = this.packetSizeService.getStdDevSize(srcIp);
        this.raiseAlarm(
          'Packet Size Anomaly',
          meanSize,
          stdDevSize,
          treshold,
          packet,
        );
      }
    });
  }

  private async raiseAlarm(
    type: StatisticAnomalyType,
    mean: number,
    stdDev: number,
    threshold: number,
    packet: PcapParsedPacket,
  ) {
    const alarmKey = `flagged:${Alarms.STATISTIC_ANOMALY}:${packet.ethernetPayload.ipPayload.src_ip_addr}:${packet.timestamp}:${type}:${mean}:${stdDev}`;
    const src_ip = packet.ethernetPayload.ipPayload.src_ip_addr;
    const packet_size = packet.len;

    const newAlarm: StatisticAnomalyData = {
      timestamp: packet.timestamp,
      type,
      mean,
      stdDev,
      packet,
      threshold,
      incident_type: Alarms.STATISTIC_ANOMALY,
    };

    await this.cacheManager.set(alarmKey, newAlarm, CACHE_TTL);

    this.logger.warn(
      `Anomaly detected in ${type}: IP=${src_ip}, Size=${packet_size} with Mean=${mean}} and StdDev=${stdDev}`,
    );
  }
}
