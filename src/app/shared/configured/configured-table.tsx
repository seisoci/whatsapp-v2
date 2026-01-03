'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { ConfiguredOnu } from '@/types/configured';
import { createConfiguredColumns } from './columns';
import { PiMagnifyingGlassBold, PiListChecks } from 'react-icons/pi';
import { FaSignal, FaGlobe, FaPlug, FaBan, FaUnlink } from 'react-icons/fa';
import { Flex, Input, Title, Loader, Select, Badge, Button } from 'rizzui';
import { getConfiguredOnus, getOltList, getZones, getOdbs, getBoards, getPorts } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';
import BatchActionsPanel from './batch-actions-panel';

export default function ConfiguredTable() {
  const [configuredData, setConfiguredData] = useState<ConfiguredOnu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // For smooth updates
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    olt_id: '',
    zone_id: '',
    odb_id: '',
    board: '',
    port: '',
    signal_filter: '', // 'good', 'warning', 'critical', or ''
    pon_type: '', // 'epon', 'gpon', or ''
  });

  // Filter options state
  const [oltOptions, setOltOptions] = useState<Array<{ id: number; name: string; onu_count?: number }>>([]);
  const [zoneOptions, setZoneOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [odbOptions, setOdbOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [boardOptions, setBoardOptions] = useState<Array<{ id: string; name: string; onu_count?: number }>>([]);
  const [portOptions, setPortOptions] = useState<Array<{ id: string; name: string; onu_count?: number }>>([]);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchConfiguredData = async (page?: number, perPage?: number, search?: string, isInitialLoad = false) => {
    try {
      // Use different loading states for initial load vs refresh
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const currentPage = page ?? pagination.pageIndex + 1; // Laravel uses 1-based pagination
      const currentPerPage = perPage ?? pagination.pageSize;
      const currentSearch = search ?? searchQuery;

      // Prepare sort parameters
      const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

      const response = await getConfiguredOnus({
        page: currentPage,
        per_page: currentPerPage,
        search: currentSearch || undefined,
        status: filters.status || undefined,
        olt_id: filters.olt_id || undefined,
        zone_id: filters.zone_id || undefined,
        odb_id: filters.odb_id || undefined,
        board: filters.board || undefined,
        port: filters.port || undefined,
        signal_filter: filters.signal_filter || undefined,
        pon_type: filters.pon_type || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Laravel Resource pagination: axios already extracted .data from HTTP response
      // So response.data is the array, response.meta has pagination info
      const onuData = response.data || [];
      const metaData = response.meta;

      // Set total records from pagination metadata
      if (metaData?.total !== undefined) {
        setTotalRecords(metaData.total);
      }

      if (Array.isArray(onuData)) {
        // Process data to add signal_status based on signal value
        const processedData = onuData.map((onu: any) => {
          const signalValue = typeof onu.signal === 'number'
            ? onu.signal
            : parseFloat(onu.signal) || 0;

          return {
            ...onu,
            signal_status: getSignalStatus(signalValue),
          };
        });
        setConfiguredData(processedData);
      } else {
        setConfiguredData([]);
      }
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Failed to load configured ONUs data. Please make sure you are logged in.'
      );
      setConfiguredData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [oltsRes, zonesRes, odbsRes] = await Promise.all([
          getOltList(),
          getZones(),
          getOdbs(),
        ]);

        // Handle different response structures
        const olts = Array.isArray(oltsRes) ? oltsRes : (oltsRes?.data || []);
        const zones = Array.isArray(zonesRes) ? zonesRes : (zonesRes?.data || []);
        const odbs = Array.isArray(odbsRes) ? odbsRes : (odbsRes?.data || []);

        // Filter to ensure valid objects with id and name
        const validOlts = olts.filter((item: any) => item && typeof item === 'object' && item.id && item.name);
        const validZones = zones.filter((item: any) => item && typeof item === 'object' && item.id && item.name);
        const validOdbs = odbs.filter((item: any) => item && typeof item === 'object' && item.id && item.name);

        setOltOptions(validOlts);
        setZoneOptions(validZones);
        setOdbOptions(validOdbs);
      } catch (error) {
        // Silently handle error
      }
    };

    loadFilterOptions();
  }, []);

  // Load board options when olt_id changes
  useEffect(() => {
    const loadBoardOptions = async () => {
      try {
        const boardsRes = await getBoards(filters.olt_id || undefined);
        const boards = Array.isArray(boardsRes) ? boardsRes : (boardsRes?.data || []);
        const validBoards = boards.filter((item: any) => item && typeof item === 'object' && item.id && item.name);
        setBoardOptions(validBoards);
      } catch (error) {
        setBoardOptions([]);
      }
    };

    loadBoardOptions();
  }, [filters.olt_id]);

  // Load port options when olt_id or board changes
  useEffect(() => {
    const loadPortOptions = async () => {
      try {
        const portsRes = await getPorts(filters.olt_id || undefined, filters.board || undefined);
        const ports = Array.isArray(portsRes) ? portsRes : (portsRes?.data || []);
        const validPorts = ports.filter((item: any) => item && typeof item === 'object' && item.id && item.name);
        setPortOptions(validPorts);
      } catch (error) {
        setPortOptions([]);
      }
    };

    loadPortOptions();
  }, [filters.olt_id, filters.board]);

  // Initial load
  useEffect(() => {
    fetchConfiguredData(1, pagination.pageSize, searchQuery, true);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (loading) return; // Skip if initial load

    const timer = setTimeout(() => {
      // Reset to first page when searching
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      fetchConfiguredData(1, pagination.pageSize, searchQuery, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter effect
  useEffect(() => {
    if (loading) return; // Skip if initial load

    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchConfiguredData(1, pagination.pageSize, searchQuery, false);
  }, [filters]);

  // Pagination effect
  useEffect(() => {
    if (loading) return; // Skip if initial load

    fetchConfiguredData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Sorting effect
  useEffect(() => {
    if (loading) return; // Skip if initial load

    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchConfiguredData(1, pagination.pageSize, searchQuery, false);
  }, [sorting]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Reset dependent filters
      if (key === 'olt_id') {
        // When OLT changes, reset board and port
        newFilters.board = '';
        newFilters.port = '';
      } else if (key === 'board') {
        // When board changes, reset port
        newFilters.port = '';
      }

      return newFilters;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      olt_id: '',
      zone_id: '',
      odb_id: '',
      board: '',
      port: '',
      signal_filter: '',
      pon_type: '',
    });
    setSearchQuery('');
  };

  return (
    <div ref={tableContainerRef}>
      <ConfiguredTableContent
        data={configuredData}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchConfiguredData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        totalRecords={totalRecords}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        oltOptions={oltOptions}
        zoneOptions={zoneOptions}
        odbOptions={odbOptions}
        boardOptions={boardOptions}
        portOptions={portOptions}
        showBatchActions={showBatchActions}
        onToggleBatchActions={() => setShowBatchActions(!showBatchActions)}
      />
    </div>
  );
}

function getSignalStatus(signal: number): 'good' | 'warning' | 'bad' {
  if (signal >= -26) return 'good';
  if (signal >= -29.9) return 'warning';
  return 'bad';
}

function ConfiguredTableContent({
  data,
  loading,
  isRefreshing,
  onRefresh,
  pagination,
  setPagination,
  sorting,
  setSorting,
  totalRecords,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  oltOptions,
  zoneOptions,
  odbOptions,
  boardOptions,
  portOptions,
  showBatchActions,
  onToggleBatchActions,
}: {
  data: ConfiguredOnu[];
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  sorting: Array<{ id: string; desc: boolean }>;
  setSorting: React.Dispatch<React.SetStateAction<Array<{ id: string; desc: boolean }>>>;
  totalRecords: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: { status: string; olt_id: string; zone_id: string; odb_id: string; board: string; port: string; signal_filter: string, pon_type: string };
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
  oltOptions: Array<{ id: number; name: string; onu_count?: number }>;
  zoneOptions: Array<{ id: number; name: string }>;
  odbOptions: Array<{ id: number; name: string }>;
  boardOptions: Array<{ id: string; name: string; onu_count?: number }>;
  portOptions: Array<{ id: string; name: string; onu_count?: number }>;
  showBatchActions: boolean;
  onToggleBatchActions: () => void;
}) {
  const { table, setData } = useTanStackTable<ConfiguredOnu>({
    tableData: data,
    columnConfig: createConfiguredColumns(),
    options: {
      pageCount: Math.ceil(totalRecords / pagination.pageSize),
      state: {
        pagination,
        sorting,
      },
      onPaginationChange: setPagination,
      onSortingChange: setSorting,
      manualPagination: true,
      manualSorting: true,
      enableColumnResizing: false,
    },
  });


  // Update table data when data prop changes
  useEffect(() => {
    setData([...data]);
  }, [data, setData]);

  const onlineCount = data.filter((onu) => onu.status === 'online').length;
  const offlineCount = data.filter((onu) => onu.status === 'offline').length;

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  const hasActiveFilters = filters.status || filters.olt_id || filters.zone_id || filters.odb_id || filters.board || filters.port || filters.signal_filter || searchQuery;

  return (
    <>
      <Flex
        direction="col"
        justify="between"
        className="mb-4 gap-3 xs:flex-row xs:items-center"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          Configured ONUs ({totalRecords} devices)
        </Title>
        <Flex align="center" className="w-full gap-3 xs:w-auto">
          <Input
            type="search"
            clearable={true}
            placeholder="Search ONUs..."
            onClear={() => onSearchChange('')}
            value={searchQuery}
            prefix={<PiMagnifyingGlassBold className="size-4" />}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full xs:max-w-80"
          />
          <Button
            variant={showBatchActions ? "solid" : "outline"}
            color="primary"
            onClick={onToggleBatchActions}
            className="shrink-0"
          >
            <PiListChecks className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Batch Actions</span>
            <span className="sm:hidden">Batch</span>
          </Button>
        </Flex>
      </Flex>

      {/* Batch Actions Panel */}
      <BatchActionsPanel
        isOpen={showBatchActions}
        onToggle={onToggleBatchActions}
        filters={{
          search: searchQuery,
          status: filters.status,
          olt_id: filters.olt_id,
          zone_id: filters.zone_id,
          odb_id: filters.odb_id,
          board: filters.board,
          port: filters.port,
          signal_filter: filters.signal_filter,
          pon_type: filters.pon_type,
        }}
        totalRecords={totalRecords}
      />

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Select
          label="OLT"
          placeholder="All OLTs"
          value={filters.olt_id}
          onChange={(selected) => {
            const value = typeof selected === 'object' && selected !== null ? (selected as any).value : selected;
            onFilterChange('olt_id', String(value || ''));
          }}
          options={[
            { label: 'All OLTs', value: '', count: null },
            ...oltOptions.map((olt) => ({
              label: olt.name,
              value: String(olt.id),
              count: olt.onu_count || 0,
            })),
          ]}
          getOptionValue={(option) => option.value}
          getOptionDisplayValue={(option) => {
            if (option.count === null) return option.label;
            return (
              <div className="flex items-center gap-2" style={{ width: '100%' }}>
                <span className="flex-1 truncate" style={{ minWidth: 0 }}>{option.label}</span>
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded" style={{ flexShrink: 0 }}>
                  {option.count}
                </span>
              </div>
            );
          }}
          displayValue={(selected) => {
            if (!selected) return 'All OLTs';
            const option = oltOptions.find(olt => String(olt.id) === selected);
            return option ? option.name : 'All OLTs';
          }}
          searchable
          clearable
          onClear={() => onFilterChange('olt_id', '')}
        />

        <Select
          label="Board"
          placeholder="All Boards"
          value={filters.board}
          onChange={(selected) => {
            const value = typeof selected === 'object' && selected !== null ? (selected as any).value : selected;
            onFilterChange('board', String(value || ''));
          }}
          options={[
            { label: 'All Boards', value: '', count: null },
            ...boardOptions.map((board) => ({
              label: board.name,
              value: String(board.id),
              count: board.onu_count || 0,
            })),
          ]}
          getOptionValue={(option) => option.value}
          getOptionDisplayValue={(option) => {
            if (option.count === null) return option.label;
            return (
              <div className="flex items-center gap-2" style={{ width: '100%' }}>
                <span className="flex-1 truncate" style={{ minWidth: 0 }}>{option.label}</span>
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded" style={{ flexShrink: 0 }}>
                  {option.count}
                </span>
              </div>
            );
          }}
          displayValue={(selected) => {
            if (!selected) return 'All Boards';
            const option = boardOptions.find(board => String(board.id) === selected);
            return option ? option.name : 'All Boards';
          }}
          searchable
          clearable
          onClear={() => onFilterChange('board', '')}
        />

        <Select
          label="Port"
          placeholder="All Ports"
          value={filters.port}
          onChange={(selected) => {
            const value = typeof selected === 'object' && selected !== null ? (selected as any).value : selected;
            onFilterChange('port', String(value || ''));
          }}
          options={[
            { label: 'All Ports', value: '', count: null },
            ...portOptions.map((port) => ({
              label: port.name,
              value: String(port.id),
              count: port.onu_count || 0,
            })),
          ]}
          getOptionValue={(option) => option.value}
          getOptionDisplayValue={(option) => {
            if (option.count === null) return option.label;
            return (
              <div className="flex items-center gap-2" style={{ width: '100%' }}>
                <span className="flex-1 truncate" style={{ minWidth: 0 }}>{option.label}</span>
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded" style={{ flexShrink: 0 }}>
                  {option.count}
                </span>
              </div>
            );
          }}
          displayValue={(selected) => {
            if (!selected) return 'All Ports';
            const option = portOptions.find(port => String(port.id) === selected);
            return option ? option.name : 'All Ports';
          }}
          searchable
          clearable
          onClear={() => onFilterChange('port', '')}
        />

        <Select
          label="Zone"
          placeholder="All Zones"
          value={filters.zone_id}
          onChange={(selected) => {
            const value = typeof selected === 'object' && selected !== null ? (selected as any).value : selected;
            onFilterChange('zone_id', String(value || ''));
          }}
          options={[
            { label: 'All Zones', value: '' },
            ...zoneOptions.map((zone) => ({
              label: zone.name,
              value: String(zone.id),
            })),
          ]}
          getOptionValue={(option) => option.value}
          getOptionDisplayValue={(option) => option.label}
          displayValue={(selected) => {
            if (!selected) return 'All Zones';
            const option = zoneOptions.find(zone => String(zone.id) === selected);
            return option?.name || 'All Zones';
          }}
          searchable
          clearable
          onClear={() => onFilterChange('zone_id', '')}
        />

        <Select
          label="ODB"
          placeholder="All ODBs"
          value={filters.odb_id}
          onChange={(selected) => {
            const value = typeof selected === 'object' && selected !== null ? (selected as any).value : selected;
            onFilterChange('odb_id', String(value || ''));
          }}
          options={[
            { label: 'All ODBs', value: '' },
            ...odbOptions.map((odb) => ({
              label: odb.name,
              value: String(odb.id),
            })),
          ]}
          getOptionValue={(option) => option.value}
          getOptionDisplayValue={(option) => option.label}
          displayValue={(selected) => {
            if (!selected) return 'All ODBs';
            const option = odbOptions.find(odb => String(odb.id) === selected);
            return option?.name || 'All ODBs';
          }}
          searchable
          clearable
          onClear={() => onFilterChange('odb_id', '')}
        />

        <div className="flex flex-col gap-1 w-fit">
          <label className="text-xs font-medium text-gray-700">Signal</label>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => onFilterChange('signal_filter', filters.signal_filter === 'good' ? '' : 'good')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-l-md hover:bg-gray-50 focus:z-10 ${
                filters.signal_filter === 'good' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Good Signal (>= -25 dBm)"
            >
              <FaSignal className="text-green-600" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('signal_filter', filters.signal_filter === 'warning' ? '' : 'warning')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r hover:bg-gray-50 focus:z-10 ${
                filters.signal_filter === 'warning' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Warning Signal (-27 to -25 dBm)"
            >
              <FaSignal className="text-orange-600" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('signal_filter', filters.signal_filter === 'critical' ? '' : 'critical')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-r-md hover:bg-gray-50 focus:z-10 ${
                filters.signal_filter === 'critical' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Critical Signal (< -27 dBm)"
            >
              <FaSignal className="text-red-600" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-fit">
          <label className="text-xs font-medium text-gray-700">Status</label>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => onFilterChange('status', filters.status === 'online' ? '' : 'online')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-l-md hover:bg-gray-50 focus:z-10 ${
                filters.status === 'online' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Online"
            >
              <FaGlobe className="text-green-600" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('status', filters.status === 'pwrfail' ? '' : 'pwrfail')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r hover:bg-gray-50 focus:z-10 ${
                filters.status === 'pwrfail' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Power Fail"
            >
              <FaPlug className="text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('status', filters.status === 'los' ? '' : 'los')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r hover:bg-gray-50 focus:z-10 ${
                filters.status === 'los' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Loss of Signal"
            >
              <FaUnlink className="text-red-600" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('status', filters.status === 'offline' ? '' : 'offline')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-r hover:bg-gray-50 focus:z-10 ${
                filters.status === 'offline' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Offline"
            >
              <FaGlobe className="text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('status', filters.status === 'disabled' ? '' : 'disabled')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-r-md hover:bg-gray-50 focus:z-10 ${
                filters.status === 'disabled' ? 'bg-gray-200' : 'bg-white border-gray-300'
              }`}
              title="Admin Disabled"
            >
              <FaBan className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-fit">
          <label className="text-xs font-medium text-gray-700">PON Type</label>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => onFilterChange('pon_type', filters.pon_type === 'epon' ? '' : 'epon')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-l-md hover:bg-gray-50 hover:text-primary focus:z-10 ${
                filters.pon_type === 'epon' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300'
              }`}
              title="EPON"
            >
              EPON
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('pon_type', filters.pon_type === 'gpon' ? '' : 'gpon')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-r-md hover:bg-gray-50 hover:text-primary focus:z-10 ${
                filters.pon_type === 'gpon' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300'
              }`}
              title="GPON"
            >
              GPON
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="w-full"
            disabled={!hasActiveFilters}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Table wrapper with smooth transitions */}
      <div className="relative overflow-hidden">
        <div
          className="transition-opacity duration-300 ease-in-out"
          style={{ opacity: isRefreshing ? 0.4 : 1 }}
        >
          <Table
            table={table}
            variant="minimal"
            classNames={{
              rowClassName: 'last:!border-b-0 hover:bg-gray-50',
              cellClassName: 'py-3',
            }}
          />
        </div>

        {/* Loading indicator - positioned absolutely */}
        {isRefreshing && (
          <div className="absolute right-4 top-4 z-10">
            <Loader variant="spinner" size="sm" className="text-primary" />
          </div>
        )}
      </div>

      <TablePagination table={table} className="py-4" />
    </>
  );
}
