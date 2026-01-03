import { z } from 'zod';

// IP address regex pattern (IPv4)
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const createOltSchema = z.object({
  name: z.string().min(1, { message: 'OLT name is required' }).max(100, { message: 'OLT name must not exceed 100 characters' }),
  olt_ip_address: z.string().min(1, { message: 'IP address is required' }).regex(ipv4Regex, { message: 'Invalid IP address format' }),
  telnet_port: z.number({ invalid_type_error: 'Telnet port must be a number' }).min(1, { message: 'Port must be between 1 and 65535' }).max(65535, { message: 'Port must be between 1 and 65535' }),
  telnet_username: z.string().min(1, { message: 'Telnet username is required' }).max(50, { message: 'Username must not exceed 50 characters' }),
  telnet_password: z.string().min(1, { message: 'Telnet password is required' }).max(50, { message: 'Password must not exceed 50 characters' }),
  snmp_read_only: z.string().min(1, { message: 'SNMP read-only community is required' }).max(50, { message: 'Community string must not exceed 50 characters' }),
  snmp_read_write: z.string().min(1, { message: 'SNMP read-write community is required' }).max(50, { message: 'Community string must not exceed 50 characters' }),
  snmp_udp_port: z.number({ invalid_type_error: 'SNMP port must be a number' }).min(1, { message: 'Port must be between 1 and 65535' }).max(65535, { message: 'Port must be between 1 and 65535' }),
  iptv_module: z.enum(['true', 'false'], {
    errorMap: () => ({ message: 'Please select IPTV module status' })
  }),
  manufacturer: z.enum(['huawei', 'zte'], {
    errorMap: () => ({ message: 'Please select a manufacturer' })
  }),
  hardware_version: z.string().min(1, { message: 'Hardware version is required' }).max(50, { message: 'Hardware version must not exceed 50 characters' }),
  software_version: z.string().min(1, { message: 'Software version is required' }).max(50, { message: 'Software version must not exceed 50 characters' }),
});

export type CreateOltInput = z.infer<typeof createOltSchema>;

export type UpdateOltInput = CreateOltInput;
