import { Inject, Injectable } from '@nestjs/common';
import { NetworkPacket } from 'src/common/types/models';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MY_IP_ADDRESS } from 'src/common/constants';

@Injectable()
export class PortScanService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async processPacket(packet: NetworkPacket) {
    const { parsedPacket, timestamp } = packet; // Get timestamp from packet

    // Check if it's an IPv4 packet
    if (!parsedPacket.ipv4) return;

    const { srcIp, tcp, udp } = parsedPacket.ipv4;

    // Ignore packets from the local machine
    if (srcIp === MY_IP_ADDRESS) return;

    // Determine destination port from TCP or UDP
    let dstPort;
    if (tcp) {
      // Ignore ACK packets
      if (tcp.flags?.ack) return;
      dstPort = tcp.destPort;
    } else if (udp) {
      dstPort = udp.destPort;
    } else {
      return; // No relevant protocol data
    }

    // Create a time window key based on the timestamp
    const timeWindowKey = `${srcIp}:${Math.floor(timestamp.getTime() / 10000)}`; // 10-second time window

    // Get or initialize the cache for this source IP and time window
    let scanData = (await this.cacheManager.get<{
      ports: Set<number>;
      count: number;
    }>(timeWindowKey)) || { ports: new Set(), count: 0 };

    // Add the destination port and increment the packet count
    scanData.ports.add(dstPort);
    scanData.count++;

    // Store the updated data in cache with a 20-second TTL
    await this.cacheManager.set(timeWindowKey, scanData, 20_000);

    // Check for potential port scan based on unique ports and total connections
    const uniquePortsCount = scanData.ports.size;
    const connectionCount = scanData.count;

    // Define thresholds for a significant port scan
    const UNIQUE_PORTS_THRESHOLD = 10;
    const CONNECTIONS_THRESHOLD = 20;

    const flaggedKey = `flagged:${srcIp}`;
    const existingFlag = await this.cacheManager.get(flaggedKey);

    // Update or flag based on unique port counts and connection thresholds
    if (
      !existingFlag &&
      uniquePortsCount > UNIQUE_PORTS_THRESHOLD &&
      connectionCount > CONNECTIONS_THRESHOLD
    ) {
      await this.flagPotentialScan(srcIp, uniquePortsCount, connectionCount);
      await this.cacheManager.set(
        flaggedKey,
        { uniquePortsCount, connectionCount },
        20_000,
      );
    } else if (
      existingFlag &&
      //@ts-ignore
      uniquePortsCount > existingFlag.uniquePortsCount
    ) {
      await this.flagPotentialScan(srcIp, uniquePortsCount, connectionCount);
      await this.cacheManager.set(
        flaggedKey,
        { uniquePortsCount, connectionCount },
        20_000,
      );
    }
  }

  async flagPotentialScan(
    srcIp: string,
    uniquePortsCount: number,
    connectionCount: number,
  ) {
    console.log(
      `Potential port scan detected from ${srcIp}. Unique Ports: ${uniquePortsCount}, Connections: ${connectionCount}`,
    );

    // Optionally store flagged scans in another cache or send to Elasticsearch
    await this.cacheManager.set(`flagged:${srcIp}`, {
      uniquePortsCount,
      connectionCount,
      timestamp: Date.now(),
    });
  }
}
