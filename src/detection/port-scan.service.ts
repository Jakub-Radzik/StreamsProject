import { Inject, Injectable } from '@nestjs/common';
import { PcapngNetworkPacket } from 'src/common/types/pcapng.models';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MY_IP_ADDRESS } from 'src/common/constants';

@Injectable()
export class PortScanService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async processPacket(packet: PcapngNetworkPacket) {
    const { parsedPacket, timestamp } = packet;

    if (!parsedPacket.ipv4) return;

    const { srcIp, tcp, udp } = parsedPacket.ipv4;

    if (srcIp === MY_IP_ADDRESS) return;

    let dstPort;
    if (tcp) {
      if (tcp.flags?.ack) return;
      dstPort = tcp.destPort;
    } else if (udp) {
      dstPort = udp.destPort;
    } else {
      return;
    }

    const timeWindowKey = `${srcIp}:${Math.floor(timestamp.getTime() / 10000)}`; // 10-second time window

    let scanData = (await this.cacheManager.get<{
      ports: Set<number>;
      count: number;
    }>(timeWindowKey)) || { ports: new Set(), count: 0 };

    scanData.ports.add(dstPort);
    scanData.count++;

    await this.cacheManager.set(timeWindowKey, scanData, 20_000);

    const uniquePortsCount = scanData.ports.size;
    const connectionCount = scanData.count;

    const UNIQUE_PORTS_THRESHOLD = 10;
    const CONNECTIONS_THRESHOLD = 20;

    const flaggedKey = `flagged:${srcIp}`;
    const existingFlag = await this.cacheManager.get(flaggedKey);

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

    await this.cacheManager.set(`flagged:${srcIp}`, {
      uniquePortsCount,
      connectionCount,
      timestamp: Date.now(),
    });
  }
}
