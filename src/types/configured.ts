export interface ConfiguredOnu {
  id: number;
  status: string;
  name: string;
  serial_number: string;
  onu_path: string;
  zone: string | null;
  odb: string | null;
  signal: string | number;
  signal_status: 'good' | 'warning' | 'bad';
  mode: string;
  vlan: string;
  auth_date: string;
}
