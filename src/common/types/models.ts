export interface NetworkPacket {
  interfaceId: number;
  timestamp: Date;
  parsedPacket: ParsedPacket;
}

export interface ParsedPacket {
  destMac: string;
  srcMac: string;
  etherType: number;
  ipv4?: IPv4Packet;
}

export interface IPv4Packet {
  version: number;
  headerLength: number;
  totalLength: number;
  protocol: number;
  srcIp: string;
  destIp: string;
  tcp?: TCPPacket;
  udp?: UDPPacket;
}

export interface TCPPacket {
  srcPort: number;
  destPort: number;
  sequenceNumber: number;
  ackNumber: number;
  dataOffset: number;
  flags?: {
    syn?: boolean; // SYN flag
    ack?: boolean; // ACK flag
    fin?: boolean; // FIN flag
    rst?: boolean; // RST flag
    psh?: boolean; // PSH flag
    urg?: boolean; // URG flag
  };
}

export interface UDPPacket {
  srcPort: number;
  destPort: number;
  length: number;
}

export interface RawDataType {
  interfaceId: number;
  timestampHigh: number;
  timestampLow: number;
  data: {
    type: 'Buffer';
    data: number[];
  };
}
