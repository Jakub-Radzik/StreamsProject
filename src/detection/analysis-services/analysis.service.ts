import { Inject, Injectable, Logger } from '@nestjs/common';
import { PacketSizeService } from './packet-size.service';
import { PacketRateService } from './packet-rate.service';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { Alarms } from 'src/common/types/elastic';
import { StatisticAnomalyData, StatisticAnomalyType } from '../types';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_TTL } from 'src/common/constants';

@Injectable()
export class StandardDeviationAnalysisService {
  private readonly logger = new Logger(StandardDeviationAnalysisService.name);

  private sizeThreshold = 4;
  private rateThreshold = 3;

  constructor(
    private readonly packetSizeService: PacketSizeService,
    private readonly packetRateService: PacketRateService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async processPacket(packet: PcapParsedPacket): Promise<string[]> {
    const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;
    const packetSize = packet.len;

    const anomalies = [];

    this.packetSizeService.processPacket(packet);
    if (
      this.packetSizeService.isAnomalous(srcIp, packetSize, this.sizeThreshold)
    ) {
      const meanSize = this.packetSizeService.getMeanSize(srcIp);
      const stdDevSize = this.packetSizeService.getStdDevSize(srcIp);

      await this.raiseAlarm(
        'Packet Size Anomaly',
        meanSize,
        stdDevSize,
        this.sizeThreshold,
        packet,
      );

      anomalies.push('Packet Size Anomaly');
    }

    this.packetRateService.processPacket(packet);
    if (this.packetRateService.isAnomalousRate(srcIp, this.rateThreshold)) {
      const meanRate = this.packetRateService.getMeanRate(srcIp);
      const stdDevRate = this.packetRateService.getStdDevRate(srcIp);

      await this.raiseAlarm(
        'Packet Rate Anomaly',
        meanRate,
        stdDevRate,
        this.rateThreshold,
        packet,
      );

      anomalies.push('Packet Rate Anomaly');
    }

    return anomalies;
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
      `Anomaly detected in ${type}: IP=${src_ip}, Size=${packet_size} with Mean=${mean} and StdDev=${stdDev}`,
    );
  }
}
