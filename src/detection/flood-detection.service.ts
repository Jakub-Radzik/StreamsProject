import { Injectable, Inject } from '@nestjs/common';
import { PcapParsedPacket } from 'src/common/types/pcap.models';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Alarms } from 'src/common/types/elastic';
import { FloodData } from './types';

@Injectable()
export class FloodDetectionService {
  private readonly SYN_FLOOD_THRESHOLD = 5000;
  private readonly ICMP_FLOOD_THRESHOLD = 5000;
  private readonly UDP_FLOOD_THRESHOLD = 5000;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async detectFlood(packet: PcapParsedPacket): Promise<void> {
    const destIp = packet.ethernetPayload.ipPayload.dest_ip_addr;

    const icmpFlood = await this.isIcmpFlood(packet);

    if (icmpFlood) {
      await this.raiseAlarm(
        Alarms.ICMP_FLOOD,
        icmpFlood.totalCount,
        packet.timestamp,
        Array.from(icmpFlood.srcIps),
        destIp,
      );
    }
  }

  private async isIcmpFlood(packet: PcapParsedPacket) {
    if (packet.ethernetPayload.ipPayload.protocol_name === 'ICMP') {
      const icmpPayload = packet.ethernetPayload.ipPayload.transportPayload;

      if (icmpPayload?.type === 8) {
        // ICMP type 8 is an echo request (attack packet)
        const destIp = packet.ethernetPayload.ipPayload.dest_ip_addr;
        const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;

        const cached = await this.incrementCounter(destIp, 'ICMP', srcIp);

        // Check if the total packet count exceeds the threshold
        if (cached.totalCount >= this.ICMP_FLOOD_THRESHOLD) {
          return cached;
        }
      }
    }
    return null;
  }

  private async incrementCounter(
    destIp: string,
    protocol: string,
    srcIp: string,
  ) {
    const cacheKey = `counter-${destIp}-${protocol}`;

    // Retrieve or initialize the cache entry for the victim's IP (destIp)
    const cached = (await this.cacheManager.get<{
      totalCount: number; // Total packets to destIp
      srcIps: Map<string, number>; // Map of attacker srcIps to packet counts
    }>(cacheKey)) || {
      totalCount: 0,
      srcIps: new Map<string, number>(),
    };

    // Increment the overall count for the victim (destIp)
    cached.totalCount++;

    // Increment the count for the specific attacker (srcIp)
    const currentCount = cached.srcIps.get(srcIp) || 0;
    cached.srcIps.set(srcIp, currentCount + 1);

    // Update the cache with a TTL
    await this.cacheManager.set(cacheKey, cached, 60_000);

    return {
      totalCount: cached.totalCount,
      srcIps: cached.srcIps.keys(), // Return attacker IPs
    };
  }

  private async raiseAlarm(
    incidentType: Alarms.ICMP_FLOOD | Alarms.SYN_FLOOD | Alarms.UDP_FLOOD,
    packetsCount: number,
    timestamp: number,
    srcIps: string[],
    destIp: string,
  ): Promise<void> {
    const alarmKey = `flagged:${incidentType}:${destIp}`;

    const existingAlarm = await this.cacheManager.get(alarmKey);

    const data: FloodData = {
      srcIps,
      destIp,
      incident_type: incidentType,
      packetsCount,
      timestamp,
    };

    if (!existingAlarm) {
      await this.cacheManager.set(alarmKey, data, 200_000);
      console.log(
        `${incidentType} detected against victim ${destIp} by attackers ${srcIps.join(', ')}`,
      );
    }
  }
}

// const udpFlood = await this.isUdpFlood(packet);

// if (synFlood) {
//   await this.raiseAlarm(
//     Alarms.SYN_FLOOD,
//     synFlood,
//     packet.timestamp,
//     srcIp,
//     desIp,
//   );
// }

// if (udpFlood) {
//   await this.raiseAlarm(
//     Alarms.UDP_FLOOD,
//     udpFlood,
//     packet.timestamp,
//     srcIp,
//     desIp,
//   );
// }

// SINCE WE HAVE NO VALID DATA FOR DETECTION
// private async isSynFlood(packet: PcapParsedPacket) {
//   if (packet.ethernetPayload.ipPayload.protocol_name === 'TCP') {
//     const transportPayload =
//       packet.ethernetPayload.ipPayload.transportPayload;

//     if (
//       transportPayload &&
//       transportPayload.flags.syn &&
//       !transportPayload.flags.ack
//     ) {
//       const destIp = packet.ethernetPayload.ipPayload.dest_ip_addr;
//       const synCount = await this.incrementCounter(destIp, 'SYN');

//       if (synCount >= this.SYN_FLOOD_THRESHOLD) {
//         return synCount;
//       }
//     }
//   }
//   return null;
// }

// SINCE WE HAVE NO VALID DATA FOR DETECTION
// private async isUdpFlood(packet: PcapParsedPacket) {
//   if (packet.ethernetPayload.ipPayload.protocol_name === 'UDP') {
//     const destIp = packet.ethernetPayload.ipPayload.dest_ip_addr;
//     const udpCount = await this.incrementCounter(destIp, 'UDP');

//     if (udpCount >= this.UDP_FLOOD_THRESHOLD) {
//       return udpCount;
//     }
//   }
//   return null;
// }
