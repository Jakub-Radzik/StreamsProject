import { Alarms } from 'src/common/types/elastic';

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

export interface DocType extends Omit<FloodData | PortScanData, 'timestamp'> {
  timestamp: string;
}
