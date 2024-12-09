import { Injectable } from '@nestjs/common';
import { WINDOW_SIZE } from 'src/common/constants';
import { PcapParsedPacket } from 'src/common/types/pcap.models';

@Injectable()
export class PacketSizeService {
  private windowSize: number = WINDOW_SIZE;
  private sizeData: Map<string, number[]> = new Map();
  private sumSizes: Map<string, number> = new Map();
  private sumSquares: Map<string, number> = new Map();

  processPacket(packet: PcapParsedPacket): void {
    const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;
    const size = packet.len;

    if (!this.sizeData.has(srcIp)) {
      this.sizeData.set(srcIp, []);
      this.sumSizes.set(srcIp, 0);
      this.sumSquares.set(srcIp, 0);
    }

    const sizes = this.sizeData.get(srcIp)!;
    sizes.push(size);
    this.sumSizes.set(srcIp, this.sumSizes.get(srcIp)! + size);
    this.sumSquares.set(srcIp, this.sumSquares.get(srcIp)! + size * size);

    if (sizes.length > this.windowSize) {
      const removed = sizes.shift()!;
      this.sumSizes.set(srcIp, this.sumSizes.get(srcIp)! - removed);
      this.sumSquares.set(
        srcIp,
        this.sumSquares.get(srcIp)! - removed * removed,
      );
    }
  }

  getMeanSize(srcIp: string): number {
    const sum = this.sumSizes.get(srcIp) || 0;
    const count = this.sizeData.get(srcIp)?.length || 1;
    return sum / count;
  }

  getStdDevSize(srcIp: string): number {
    const sum = this.sumSizes.get(srcIp) || 0;
    const sumSq = this.sumSquares.get(srcIp) || 0;
    const count = this.sizeData.get(srcIp)?.length || 1;
    const mean = sum / count;
    return Math.sqrt(sumSq / count - mean * mean);
  }

  isAnomalous(srcIp: string, size: number, threshold: number = 3): boolean {
    const mean = this.getMeanSize(srcIp);
    const stdDev = this.getStdDevSize(srcIp);
    return Math.abs(size - mean) > threshold * stdDev;
  }
}
