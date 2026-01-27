'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { ApiEndpoint } from '.';
import { createApiEndpointColumns } from './columns';
import { Flex, Title, Loader } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditApiEndpoint from '@/app/shared/api-management/create-edit-api-endpoint';
import { apiEndpointsApi } from '@/lib/api/api-endpoints';
import toast from 'react-hot-toast';

export default function ApiManagementTable() {
  const [apiEndpointData, setApiEndpointData] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();

  const fetchApiEndpointData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await apiEndpointsApi.getAll();

      if (response.success && response.data) {
        const data = response.data || [];

        if (Array.isArray(data)) {
          setApiEndpointData(data);
          setTotalRecords(data.length);
        } else {
          setApiEndpointData([]);
          setTotalRecords(0);
        }
      } else {
        toast.error('Failed to load API endpoints');
        setApiEndpointData([]);
        setTotalRecords(0);
      }
    } catch (error: any) {
      console.error('Error fetching API endpoints:', error);
      toast.error('Failed to load API endpoints from backend');
      setApiEndpointData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApiEndpointData(true);
  }, []);

  const handleEditApiEndpoint = (apiEndpoint: ApiEndpoint) => {
    openModal({
      view: <CreateEditApiEndpoint apiEndpoint={apiEndpoint} onSuccess={() => fetchApiEndpointData(false)} />,
      customSize: 600,
    });
  };

  const handleDeleteApiEndpoint = async (id: string) => {
    try {
      const response = await apiEndpointsApi.delete(id);
      if (response.success) {
        toast.success(response.message || 'API endpoint deleted successfully');
        fetchApiEndpointData(false);
      } else {
        toast.error(response.message || 'Failed to delete API endpoint');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete API endpoint';
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiEndpointsApi.toggleStatus(id);
      if (response.success) {
        toast.success(response.message || `API endpoint ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchApiEndpointData(false);
      } else {
        toast.error(response.message || 'Failed to toggle status');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to toggle status';
      toast.error(errorMessage);
    }
  };

  return (
    <div ref={tableContainerRef}>
      <ApiManagementTableContent
        data={apiEndpointData}
        loading={loading}
        isRefreshing={isRefreshing}
        totalRecords={totalRecords}
        onEditApiEndpoint={handleEditApiEndpoint}
        onDeleteApiEndpoint={handleDeleteApiEndpoint}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}

function ApiManagementTableContent({
  data,
  loading,
  isRefreshing,
  totalRecords,
  onEditApiEndpoint,
  onDeleteApiEndpoint,
  onToggleStatus,
}: {
  data: ApiEndpoint[];
  loading: boolean;
  isRefreshing: boolean;
  totalRecords: number;
  onEditApiEndpoint: (apiEndpoint: ApiEndpoint) => void;
  onDeleteApiEndpoint: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}) {
  const { table, setData } = useTanStackTable<ApiEndpoint>({
    tableData: data,
    columnConfig: createApiEndpointColumns({
      onEditApiEndpoint,
      onDeleteApiEndpoint,
      onToggleStatus,
    }),
    options: {
      enableColumnResizing: false,
    },
  });

  useEffect(() => {
    setData(data as ApiEndpoint[]);
  }, [data, setData]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <>
      <Flex
        direction="col"
        justify="between"
        className="mb-4 gap-3 xs:flex-row xs:items-center"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          API Endpoints ({totalRecords} total)
        </Title>
      </Flex>

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

        {isRefreshing && (
          <div className="absolute right-4 top-4 z-10">
            <Loader variant="spinner" size="sm" className="text-primary" />
          </div>
        )}
      </div>
    </>
  );
}
