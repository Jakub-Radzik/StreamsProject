import { Injectable } from '@nestjs/common';
import { WINDOW_SIZE } from 'src/common/constants';
import { PcapParsedPacket } from 'src/common/types/pcap.models';

@Injectable()
export class PacketRateService {
  private windowSize: number = WINDOW_SIZE; // Time window in seconds
  private packetCache: Map<string, { timestamp: number; count: number }[]> =
    new Map();
  private rateData: Map<string, number[]> = new Map();
  private sumRates: Map<string, number> = new Map();
  private sumSquares: Map<string, number> = new Map();

  processPacket(packet: PcapParsedPacket): void {
    const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;
    const timestamp = packet.timestamp;

    if (!this.packetCache.has(srcIp)) {
      this.packetCache.set(srcIp, []);
      this.rateData.set(srcIp, []);
      this.sumRates.set(srcIp, 0);
      this.sumSquares.set(srcIp, 0);
    }

    const cache = this.packetCache.get(srcIp)!;
    const currentTime = timestamp;

    while (
      cache.length > 0 &&
      currentTime - cache[0].timestamp > this.windowSize
    ) {
      const removed = cache.shift()!;
      const rateToRemove = removed.count / this.windowSize;
      const rateArray = this.rateData.get(srcIp)!;

      this.sumRates.set(srcIp, this.sumRates.get(srcIp)! - rateToRemove);
      this.sumSquares.set(
        srcIp,
        this.sumSquares.get(srcIp)! - rateToRemove * rateToRemove,
      );
      rateArray.shift();
    }

    cache.push({ timestamp: currentTime, count: 1 });

    const rate = cache.length / this.windowSize;
    const rates = this.rateData.get(srcIp)!;
    rates.push(rate);

    this.sumRates.set(srcIp, this.sumRates.get(srcIp)! + rate);
    this.sumSquares.set(srcIp, this.sumSquares.get(srcIp)! + rate * rate);
  }

  getMeanRate(srcIp: string): number {
    const sum = this.sumRates.get(srcIp) || 0;
    const count = this.rateData.get(srcIp)?.length || 1;
    return sum / count;
  }

  getStdDevRate(srcIp: string): number {
    const sum = this.sumRates.get(srcIp) || 0;
    const sumSq = this.sumSquares.get(srcIp) || 0;
    const count = this.rateData.get(srcIp)?.length || 1;
    const mean = sum / count;
    return Math.sqrt(sumSq / count - mean * mean);
  }

  isAnomalousRate(srcIp: string, threshold: number = 3): boolean {
    const mean = this.getMeanRate(srcIp);
    const stdDev = this.getStdDevRate(srcIp) || 1;
    const currentRate = this.rateData.get(srcIp)?.slice(-1)[0] || 0;

    if (Math.abs(currentRate - mean) > threshold * stdDev) {
      return true;
    }

    if (currentRate > mean * 2 || currentRate < mean / 2) {
      return true;
    }

    return false;
  }
}
