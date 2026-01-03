export interface TR069Profile {
  id: number;
  name: string;
}

export interface Olt {
  id: number;
  name: string;
  olt_ip_address: string;
  telnet_port: number | null;
  telnet_username?: string;
  telnet_password?: string;
  snmp_read_only?: string;
  snmp_read_write?: string;
  snmp_udp_port?: number;
  iptv_module: string;
  manufacturer?: string;
  hardware_version: string;
  software_version: string;
  tr069_profiles?: TR069Profile[];
  supported_pon_types?: string;
  vpn_tunnel?: string;
}

export interface OltCard {
  slot: number;
  type: string;
  real_type: string;
  ports: string;
  sw_version: string;
  status: string;
  cpu_load?: string | number;
  ram_load?: string | number;
  info_updated: string;
}

export interface PonPort {
  port: number;
  type: string;
  admin_state: string;
  status: string;
  onus: string;
  average_signal: string;
  description: string;
  range: string;
  tx_power: string;
}

export interface CardWithPorts {
  slot: number;
  board_type: string;
  card_type: string;
  ports: PonPort[];
}

export interface Uplink {
  uplink_port: string;
  description: string;
  type: string;
  admin_state: string;
  status: string;
  negotiation: string;
  mtu: number;
  pvid_untag: string;
  wavel: string;
  temp: string;
  tagged_vlans: string;
}

export interface Vlan {
  id: number;
  name: string; // ini adalah VLAN ID dari backend
  description?: string;
  for_iptv?: boolean;
  for_mgmt_voip?: boolean;
  dhcp_snooping?: boolean;
  lan_to_lan?: boolean;
  onus_count?: number;
  default_for?: string;
}

export interface OltFan {
  fan_id: number;
  speed: string;
  level: string;
}

export interface OltInformation {
  uptime: string;
  temperature: string;
  fans: OltFan[];
}

export interface ApiResponse<T> {
  status?: number;
  code?: number;
  message: string;
  data: T;
}
