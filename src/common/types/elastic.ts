export const NETWORK_INDEX = 'network-packets';
export const ALARM_INDEX = 'alarms';

export enum Alarms {
  PORT_SCAN = 'port-scan',
  SYN_FLOOD = 'syn-flood',
  ICMP_FLOOD = 'icmp-flood',
  UDP_FLOOD = 'udp-flood',
  MAFLORMED_PACKET = 'malformed-packet',
}
