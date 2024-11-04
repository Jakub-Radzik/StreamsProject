import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MY_IP_ADDRESS } from 'src/common/constants';
import {
  PcapParsedPacket,
  TransportPayload,
} from 'src/common/types/pcap.models';
import { IPProtocol } from 'src/common/types/ip.protocols';

@Injectable()
export class PortScanService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async processPcapPacket(parsedPacket: PcapParsedPacket) {
    const { ethernetPayload, timestamp } = parsedPacket;

    if (!ethernetPayload.ipPayload) return;

    const { src_ip_addr, protocol_number } = ethernetPayload.ipPayload;

    if (src_ip_addr === MY_IP_ADDRESS) return;

    let dstPort: number | undefined;
    let tcp: TransportPayload | undefined;
    let udp: TransportPayload | undefined;

    if (protocol_number === IPProtocol.TCP) {
      tcp = ethernetPayload.ipPayload.transportPayload;
      if (tcp.flags?.ack) return; // Ignore ACK packets
      dstPort = tcp.dport;
    } else if (protocol_number === IPProtocol.UDP) {
      udp = ethernetPayload.ipPayload.transportPayload;
      dstPort = udp.dport;
    } else {
      return; // Unsupported protocol
    }

    const timeWindowKey = `${src_ip_addr}:${Math.floor(timestamp / 10000)}`; // 10-second time window

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

    const flaggedKey = `flagged:${src_ip_addr}`;
    const existingFlag = await this.cacheManager.get(flaggedKey);

    if (
      !existingFlag &&
      uniquePortsCount > UNIQUE_PORTS_THRESHOLD &&
      connectionCount > CONNECTIONS_THRESHOLD
    ) {
      await this.flagPotentialScan(
        src_ip_addr,
        uniquePortsCount,
        connectionCount,
      );
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
      await this.flagPotentialScan(
        src_ip_addr,
        uniquePortsCount,
        connectionCount,
      );
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
