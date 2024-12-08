import { Injectable } from '@nestjs/common';
import { getProtocolName } from 'src/common/types/ip.protocols';
import {
  Address,
  EthernetPayload,
  IpPayload,
  ParsedEthernetPayload,
  ParsedIpPayload,
  PcapIncomingPacket,
  PcapParsedPacket,
} from 'src/common/types/pcap.models';
import { portToAppMap } from 'src/common/types/portToApp';

@Injectable()
export class PcapNetworkService {
  parseIncomingPacket(incomingPacket: PcapIncomingPacket): PcapParsedPacket {
    const { link_type, pcap_header, payload } = incomingPacket;

    const timestamp = Math.floor(
      pcap_header.tv_sec * 1000 + pcap_header.tv_usec / 1000,
    );

    const ethernetPayload = this.parseEthernetPayload(payload);

    return {
      link_type,
      timestamp,
      timestampISO: new Date(timestamp).toISOString(),
      caplen: pcap_header.caplen,
      len: pcap_header.len,
      ethernetPayload,
    };
  }

  private parseEthernetPayload(
    ethernetPayload: EthernetPayload,
  ): ParsedEthernetPayload {
    const { dhost, shost, ethertype, vlan, payload } = ethernetPayload;
    const ipPayload = this.parseIpPayload(payload);

    return {
      src_mac: this.formatAddress(shost),
      dest_mac: this.formatAddress(dhost),
      ethertype,
      vlan,
      ipPayload,
    };
  }

  private parseIpPayload(ipPayload: IpPayload): ParsedIpPayload {
    const {
      version,
      headerLength,
      diffserv,
      length,
      identification,
      flags,
      fragmentOffset,
      ttl,
      protocol,
      headerChecksum,
      saddr,
      daddr,
      payload,
    } = ipPayload;

    const dest_prot = payload
      ? (portToAppMap.get(payload.dport) ?? 'Unknown')
      : 'Unknown';

    return {
      version,
      headerLength,
      diffserv,
      length,
      identification,
      flags,
      fragmentOffset,
      ttl,
      protocol_number: protocol,
      protocol_name: getProtocolName(protocol),
      headerChecksum,
      src_ip_addr: this.formatAddress(saddr),
      dest_ip_addr: this.formatAddress(daddr),
      transportPayload: {
        ...payload,
        dest_prot,
      },
    };
  }

  formatAddress(address: Address): string {
    if (!address || !address.addr || !Array.isArray(address.addr)) {
      return 'Invalid address';
    }

    const { addr } = address;

    if (addr.length === 6) {
      return addr.map((byte) => byte.toString(16).padStart(2, '0')).join(':');
    } else if (addr.length === 4) {
      return addr.join('.');
    } else if (addr.length === 16) {
      const hexParts = [];
      for (let i = 0; i < addr.length; i += 2) {
        const hexPair = ((addr[i] << 8) | addr[i + 1]).toString(16);
        hexParts.push(hexPair);
      }

      let ipv6 = hexParts.join(':');

      ipv6 = ipv6.replace(/(?:^|:)(0(?::0)+)(?::|$)/, '::');

      return ipv6;
    }

    return 'Invalid address';
  }
}
