export interface SystemInfo {
  cpu: {
    usage_percent: number;
    load_average: number[] | null;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage_percent: number;
    total_gb: number;
    used_gb: number;
    free_gb: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage_percent: number;
    total_gb: number;
    used_gb: number;
    free_gb: number;
  };
}
