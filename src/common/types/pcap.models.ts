import { IPProtocol } from './ip.protocols';

export type Address = {
  addr?: number[];
};

export type Flags = {
  reserved?: boolean;
  doNotFragment?: boolean;
  moreFragments?: boolean;
  nonce?: boolean;
  cwr?: boolean;
  ece?: boolean;
  urg?: boolean;
  ack?: boolean;
  psh?: boolean;
  rst?: boolean;
  syn?: boolean;
  fin?: boolean;
};

export type TcpOptions = {
  mss?: number | null; // Can be number or null
  window_scale?: number | null; // Can be number or null
  sack_ok?: boolean | null; // Can be boolean or null
  sack?: Array<[number, number]> | null; // Array of number tuples, or null
  timestamp?: number | null; // Can be number or null
  echo?: number | null; // Can be number or null
};

// Structure for IP layer
export type IpPayload = {
  version: number; // IP version
  headerLength: number; // Length of the IP header
  diffserv: number; // Differentiated services
  length: number; // Total length of the IP packet
  identification: number; // Identification field
  flags: Flags; // Fragmentation flags
  fragmentOffset: number; // Fragment offset
  ttl: number; // Time to live
  protocol: number; // Protocol type (e.g., TCP, UDP)
  headerChecksum: number; // Checksum of the IP header
  saddr: Address; // Source address
  daddr: Address; // Destination address
  payload?: TransportPayload; // The transport layer payload
};

export type EthernetPayload = {
  dhost: Address; // Destination MAC address
  shost: Address; // Source MAC address
  ethertype: number; // Ethernet type
  vlan?: number; // VLAN ID if applicable
  payload: IpPayload; // Payload can be an IP packet
};

export type PcapIncomingPacket = {
  link_type: string; // e.g., 'LINKTYPE_ETHERNET'
  pcap_header: {
    tv_sec: number; // Timestamp seconds
    tv_usec: number; // Timestamp microseconds
    caplen: number; // Capture length
    len: number; // Length of the packet
  };
  payload: EthernetPayload;
};

// AFTER PARSING:
export interface PcapParsedPacket {
  link_type: string;
  timestamp: number;
  timestampISO: string;
  caplen: number;
  len: number;
  ethernetPayload: ParsedEthernetPayload;
}

export interface ParsedEthernetPayload
  extends Omit<EthernetPayload, 'payload' | 'dhost' | 'shost'> {
  ipPayload: ParsedIpPayload;
  src_mac: string;
  dest_mac: string;
}

export interface ParsedIpPayload
  extends Omit<IpPayload, 'payload' | 'saddr' | 'daddr' | 'protocol'> {
  transportPayload?: TransportPayload;
  src_ip_addr: string;
  dest_ip_addr: string;
  protocol_number: IPProtocol;
  protocol_name: string;
}

export type TransportPayload = {
  sport: number; // Source port
  dport: number; // Destination port
  seqno: number; // Sequence number
  ackno: number; // Acknowledgment number
  headerLength: number; // Length of the TCP/UDP header
  flags: Flags;
  windowSize: number; // Window size
  checksum: number; // Checksum
  urgentPointer?: number; // Urgent pointer
  options?: TcpOptions; // TCP options if applicable
  dataLength: number; // Length of the payload
  data?: PayloadData; // Actual payload data

  // Used in ICMP packets values: "0" and "8"
  type?: number; // Type of the payload
};

// Structure for payload of the packet
export type PayloadData = {
  type: string;
  data: any; // Can be a more specific type
};
