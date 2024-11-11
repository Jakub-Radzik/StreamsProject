import { Injectable, Inject } from '@nestjs/common';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Alarms } from 'src/common/types/elastic';

@Injectable()
export class FloodDetectionService {
  private readonly SYN_FLOOD_THRESHOLD = 100;
  private readonly ICMP_FLOOD_THRESHOLD = 100;
  private readonly UDP_FLOOD_THRESHOLD = 100;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async detectFlood(packet: PcapParsedPacket): Promise<string[]> {
    const packetTime = packet.timestamp;
    const alerts: string[] = [];

    const random = Math.random();

    const synFlood = random <= 0.15 && random > 0.1;
    const icmpFlood = random <= 0.1 && random > 0.05;
    const udpFlood = random <= 0.05 && random >= 0;

    const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;

    if (synFlood) {
      await this.cacheManager.set(
        `flagged:${Alarms.SYN_FLOOD}:${srcIp}`,
        {
          srcIp: srcIp,
          incident_type: Alarms.SYN_FLOOD,
          packetsCount: synFlood,
          timestamp: packet.timestamp,
        },
        200_000,
      );
    }

    if (icmpFlood) {
      await this.cacheManager.set(
        `flagged:${Alarms.ICMP_FLOOD}:${srcIp}`,
        {
          srcIp: srcIp,
          incident_type: Alarms.ICMP_FLOOD,
          packetsCount: icmpFlood,
          timestamp: packet.timestamp,
        },
        200_000,
      );
    }
    if (udpFlood) {
      await this.cacheManager.set(
        `flagged:${Alarms.UDP_FLOOD}:${srcIp}`,
        {
          srcIp: srcIp,
          incident_type: Alarms.UDP_FLOOD,
          packetsCount: udpFlood,
          timestamp: packet.timestamp,
        },
        200_000,
      );
    }

    await this.cacheManager.set(
      `packet-${packetTime}-${srcIp}-${packet.ethernetPayload.ipPayload.dest_ip_addr}`,
      packet,
      1000,
    );

    return alerts;
  }

  private async isSynFlood(
    packet: PcapParsedPacket,
  ): Promise<boolean | number> {
    if (packet.ethernetPayload.ipPayload.protocol_name === 'TCP') {
      const transportPayload =
        packet.ethernetPayload.ipPayload.transportPayload;
      if (
        transportPayload &&
        transportPayload.flags.syn &&
        !transportPayload.flags.ack
      ) {
        const synPackets = await this.getCachedPacketsByProtocol(
          'TCP',
          (p) =>
            p.ethernetPayload.ipPayload.transportPayload?.flags.syn &&
            !p.ethernetPayload.ipPayload.transportPayload?.flags.ack,
        );

        if (synPackets.length >= this.SYN_FLOOD_THRESHOLD) {
          return synPackets.length;
        }
      }
    }
    return false;
  }

  private async isIcmpFlood(
    packet: PcapParsedPacket,
  ): Promise<boolean | number> {
    if (packet.ethernetPayload.ipPayload.protocol_name === 'ICMP') {
      const icmpPackets = await this.getCachedPacketsByProtocol('ICMP');

      if (icmpPackets.length >= this.ICMP_FLOOD_THRESHOLD) {
        return icmpPackets.length;
      }
    }
    return false;
  }

  private async isUdpFlood(
    packet: PcapParsedPacket,
  ): Promise<boolean | number> {
    if (packet.ethernetPayload.ipPayload.protocol_name === 'UDP') {
      const udpPackets = await this.getCachedPacketsByProtocol('UDP');

      if (udpPackets.length >= this.UDP_FLOOD_THRESHOLD) {
        return udpPackets.length;
      }
    }
    return false;
  }

  private async getCachedPacketsByProtocol(
    protocol: string,
    filterFn: (packet: PcapParsedPacket) => boolean = () => true,
  ): Promise<PcapParsedPacket[]> {
    const keys = await this.cacheManager.store.keys();
    const packets: PcapParsedPacket[] = [];

    for (const key of keys) {
      if (key.startsWith('packet-')) {
        const packet = await this.cacheManager.get<PcapParsedPacket>(key);
        if (
          packet &&
          packet.ethernetPayload.ipPayload.protocol_name === protocol &&
          filterFn(packet)
        ) {
          packets.push(packet);
        }
      }
    }

    return packets;
  }
}
