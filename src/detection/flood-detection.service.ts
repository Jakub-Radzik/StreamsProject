import { Injectable, Inject } from '@nestjs/common';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class FloodDetectionService {
  private readonly SYN_FLOOD_THRESHOLD = 100;
  private readonly ICMP_FLOOD_THRESHOLD = 100;
  private readonly UDP_FLOOD_THRESHOLD = 100;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async detectFlood(packet: PcapParsedPacket): Promise<string[]> {
    const currentTime = Date.now();
    const alerts: string[] = [];

    if (await this.isSynFlood(packet)) {
      alerts.push('SYN Flood Detected');
    }
    if (await this.isIcmpFlood(packet)) {
      alerts.push('ICMP Flood Detected');
    }
    if (await this.isUdpFlood(packet)) {
      alerts.push('UDP Flood Detected');
    }

    await this.cacheManager.set(
      `${currentTime}-${packet.ethernetPayload.ipPayload.src_ip_addr}-${packet.ethernetPayload.ipPayload.dest_ip_addr}`,
      packet,
      1000,
    );

    return alerts;
  }

  private async isSynFlood(packet: PcapParsedPacket): Promise<boolean> {
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

        return synPackets.length >= this.SYN_FLOOD_THRESHOLD;
      }
    }
    return false;
  }

  private async isIcmpFlood(packet: PcapParsedPacket): Promise<boolean> {
    if (packet.ethernetPayload.ipPayload.protocol_name === 'ICMP') {
      const icmpPackets = await this.getCachedPacketsByProtocol('ICMP');
      return icmpPackets.length >= this.ICMP_FLOOD_THRESHOLD;
    }
    return false;
  }

  private async isUdpFlood(packet: PcapParsedPacket): Promise<boolean> {
    if (packet.ethernetPayload.ipPayload.protocol_name === 'UDP') {
      const udpPackets = await this.getCachedPacketsByProtocol('UDP');
      return udpPackets.length >= this.UDP_FLOOD_THRESHOLD;
    }
    return false;
  }

  private async getCachedPacketsByProtocol(
    protocol: string,
    filterFn: (packet: PcapParsedPacket) => boolean = () => true,
  ): Promise<PcapParsedPacket[]> {
    const keys = await this.cacheManager.store.keys(); // Get all cache keys
    const packets: PcapParsedPacket[] = [];

    for (const key of keys) {
      const packet = await this.cacheManager.get<PcapParsedPacket>(key);
      if (
        packet &&
        packet.ethernetPayload.ipPayload.protocol_name === protocol &&
        filterFn(packet)
      ) {
        packets.push(packet);
      }
    }

    return packets;
  }
}
