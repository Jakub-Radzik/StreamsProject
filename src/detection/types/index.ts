import { Alarms } from 'src/common/types/elastic';
import { PcapParsedPacket } from 'src/common/types/pcap.models';

export type PortScanData = {
  srcIp: string;
  incident_type: Alarms.PORT_SCAN;
  uniquePortsCount: number;
  connectionCount: number;
  timestamp: number;
};

export type FloodData = {
  srcIps: string[];
  destIp: string;
  incident_type: Alarms.ICMP_FLOOD | Alarms.SYN_FLOOD | Alarms.UDP_FLOOD;
  packetsCount: number;
  timestamp: number;
};

export type DnsAmplificationData = {
  srcIp: string;
  destIp: string;
  count: number;
  timestamp: number;
  incident_type: Alarms.DNS_AMPLIFICATION;
};

export type StatisticAnomalyType = 'Packet Size Anomaly';

export type StatisticAnomalyData = {
  type: StatisticAnomalyType;
  threshold: number;
  timestamp: number;
  mean: number;
  stdDev: number;
  packet: PcapParsedPacket;
  incident_type: Alarms.STATISTIC_ANOMALY;
};

export interface DocType
  extends Omit<FloodData | PortScanData | DnsAmplificationData, 'timestamp'> {
  timestamp: string;
}
