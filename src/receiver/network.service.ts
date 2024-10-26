import { Injectable } from '@nestjs/common';
import { ParsedPacket, RawDataType } from '../common/types/models';

@Injectable()
export class NetworkService {
  async parseRawData(jsonMessage: RawDataType) {
    const { interfaceId, timestampHigh, timestampLow, data } = jsonMessage;

    const timestamp = this.combineTimestamp(timestampHigh, timestampLow);

    const parsedPacket = this.parsePacketData(data.data);

    return {
      interfaceId,
      timestamp,
      parsedPacket,
    };
  }

  combineTimestamp(high: number, low: number): Date {
    const seconds = high;
    const microseconds = low;
    return new Date(seconds * 1000 + microseconds / 1000);
  }

  parsePacketData(bufferData: number[]) {
    const buffer = Buffer.from(bufferData);

    const destMac = this.getMacAddress(buffer.slice(0, 6));
    const srcMac = this.getMacAddress(buffer.slice(6, 12));
    const etherType = buffer.readUInt16BE(12);

    const result: any = {
      destMac,
      srcMac,
      etherType,
    };

    // Parse based on EtherType (IPv4: 0x0800)
    if (etherType === 0x0800) {
      result.ipv4 = this.parseIPv4Packet(buffer.slice(14));
    }

    // You can add more parsing logic here for other EtherTypes like IPv6 (0x86DD), ARP, etc.

    return result as ParsedPacket;
  }

  getMacAddress(buffer: Buffer): string {
    return (
      buffer
        .toString('hex')
        .match(/.{1,2}/g)
        ?.join(':') || ''
    );
  }

  parseIPv4Packet(buffer: Buffer) {
    const versionAndHeaderLength = buffer.readUInt8(0);
    const version = versionAndHeaderLength >> 4;
    const headerLength = (versionAndHeaderLength & 0x0f) * 4;

    const totalLength = buffer.readUInt16BE(2);
    const protocol = buffer.readUInt8(9);
    const srcIp = this.getIPAddress(buffer.slice(12, 16));
    const destIp = this.getIPAddress(buffer.slice(16, 20));

    const result: any = {
      version,
      headerLength,
      totalLength,
      protocol,
      srcIp,
      destIp,
    };

    if (protocol === 6) {
      result.tcp = this.parseTCPPacket(buffer.slice(headerLength));
    } else if (protocol === 17) {
      result.udp = this.parseUDPPacket(buffer.slice(headerLength));
    }

    return result;
  }

  getIPAddress(buffer: Buffer): string {
    return buffer.join('.');
  }

  parseTCPPacket(buffer: Buffer) {
    const srcPort = buffer.readUInt16BE(0);
    const destPort = buffer.readUInt16BE(2);
    const sequenceNumber = buffer.readUInt32BE(4);
    const ackNumber = buffer.readUInt32BE(8);
    const dataOffset = (buffer.readUInt8(12) >> 4) * 4;

    const flagsByte = buffer.readUInt8(13);
    const flags = {
      fin: !!(flagsByte & 0x01), // FIN flag
      syn: !!(flagsByte & 0x02), // SYN flag
      rst: !!(flagsByte & 0x04), // RST flag
      psh: !!(flagsByte & 0x08), // PSH flag
      ack: !!(flagsByte & 0x10), // ACK flag
      urg: !!(flagsByte & 0x20), // URG flag
    };

    return {
      srcPort,
      destPort,
      sequenceNumber,
      ackNumber,
      dataOffset,
      flags,
    };
  }

  parseUDPPacket(buffer: Buffer) {
    const srcPort = buffer.readUInt16BE(0);
    const destPort = buffer.readUInt16BE(2);
    const length = buffer.readUInt16BE(4);

    return {
      srcPort,
      destPort,
      length,
    };
  }
}
