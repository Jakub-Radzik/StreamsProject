import { Injectable } from '@nestjs/common';
import { PcapParsedPacket } from 'src/common/types/pcap.models';

@Injectable()
export class BloomFilterService {
  private size: number = 1000;
  private hashCount: number = 5;
  private bitArray: Uint8Array = new Uint8Array(this.size).fill(0);

  processPacket(packet: PcapParsedPacket): boolean {
    const srcIp = packet.ethernetPayload.ipPayload.src_ip_addr;

    if (this.check(srcIp)) {
      // console.log(`Adres IP ${srcIp} już widziany.`);
      return true;
    }

    console.log(`Nowy adres IP: ${srcIp}`);
    this.add(srcIp);
    return false;
  }

  private hashFunctions(element: string): number[] {
    const hashResults: number[] = [];
    for (let i = 0; i < this.hashCount; i++) {
      const hash = this.hash(element, i);
      hashResults.push(hash % this.size);
    }
    return hashResults;
  }

  private hash(input: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash);
  }

  add(element: string): void {
    const hashResults = this.hashFunctions(element);
    hashResults.forEach((index) => {
      this.bitArray[index] = 1;
    });
  }

  check(element: string): boolean {
    const hashResults = this.hashFunctions(element);
    return hashResults.every((index) => this.bitArray[index] === 1);
  }
}
