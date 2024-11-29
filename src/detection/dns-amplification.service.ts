import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { Alarms } from 'src/common/types/elastic';

@Injectable()
export class DnsAmplificationDetectionService {
  private readonly DNS_RESPONSE_SIZE_THRESHOLD = 512; // Bytes
  private readonly DNS_AMPLIFICATION_THRESHOLD = 100; // Number of responses
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async detect(packet: PcapParsedPacket): Promise<void> {
    if (
      packet.ethernetPayload.ipPayload.protocol_name === 'UDP' &&
      packet.ethernetPayload.ipPayload.transportPayload?.dport === 53
    ) {
      const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;
      const destIp = packet.ethernetPayload.ipPayload.dest_ip_addr;
      const dataLength =
        packet.ethernetPayload.ipPayload.transportPayload?.dataLength;

      if (dataLength && dataLength > this.DNS_RESPONSE_SIZE_THRESHOLD) {
        const dnsAmplificationData =
          await this.incrementDnsAmplificationCounter(srcIp, destIp);

        if (dnsAmplificationData.count >= this.DNS_AMPLIFICATION_THRESHOLD) {
          await this.raiseAlarm(
            srcIp,
            destIp,
            dnsAmplificationData.count,
            packet.timestamp,
          );
        }
      }
    }
  }

  private async incrementDnsAmplificationCounter(
    srcIp: string,
    destIp: string,
  ): Promise<{ count: number }> {
    const cacheKey = `dns-amplification-${destIp}`;

    const cached = (await this.cacheManager.get<{
      count: number;
      sources: Set<string>;
    }>(cacheKey)) || {
      count: 0,
      sources: new Set<string>(),
    };

    cached.count++;
    cached.sources.add(srcIp);

    await this.cacheManager.set(cacheKey, cached, this.CACHE_TTL);

    return { count: cached.count };
  }

  private async raiseAlarm(
    srcIp: string,
    destIp: string,
    count: number,
    timestamp: number,
  ) {
    const alarmKey = `flagged:${Alarms.DNS_AMPLIFICATION}:${destIp}:${srcIp}:${timestamp}`;

    const existingAlarm = await this.cacheManager.get(alarmKey);

    if (!existingAlarm) {
      const newAlarm = {
        srcIp,
        destIp,
        count,
        timestamp,
      };

      await this.cacheManager.set(alarmKey, newAlarm, this.CACHE_TTL);

      console.log(
        `DNS Amplification Attack detected! Victim: ${destIp}, Responses: ${count}, From DNS Server: ${srcIp}, Timestamp: ${timestamp}`,
      );
    }
  }
}
