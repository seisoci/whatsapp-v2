'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { OnuType, createOnuTypeColumns } from './columns';
import { PiMagnifyingGlassBold, PiPlusBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Button, Select } from 'rizzui';
import toast from 'react-hot-toast';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateOnuType from './create-onu-type';
import { getOnuTypes } from '@/lib/sanctum-api';

export default function OnuTypeTable() {
  const [data, setData] = useState<OnuType[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getOnuTypes();

      if (response && response.data) {
        setData(response.data);
      } else {
        toast.error('Failed to load ONU Types');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load ONU Types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return <OnuTypeTableContent data={data} onRefresh={fetchData} />;
}

function OnuTypeTableContent({ data, onRefresh }: { data: OnuType[]; onRefresh: () => void }) {
  const { openModal } = useModal();
  const [ponTypeFilter, setPonTypeFilter] = useState<string>('all');

  const handleCreateClick = () => {
    openModal({
      view: <CreateOnuType onSuccess={onRefresh} />,
      size: 'xl',
    });
  };

  const ponTypeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'GPON', value: 'gpon' },
    { label: 'EPON', value: 'epon' },
  ];

  const { table } = useTanStackTable<OnuType>({
    tableData: data,
    columnConfig: createOnuTypeColumns(onRefresh),
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 25,
        },
      },
      enableColumnResizing: false,
      enableFilters: true,
      manualFiltering: false,
    },
  });

  const filteredData = table.getFilteredRowModel().rows.map(row => row.original);

  return (
    <>
      <Flex
        direction="col"
        justify="between"
        className="mb-4 gap-3 xs:flex-row xs:items-center"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          Total ({filteredData.length})
        </Title>
        <Flex align="center" className="gap-3 w-full xs:w-auto">
          <Select
            options={ponTypeOptions}
            value={ponTypeFilter}
            onChange={(v: string) => {
              setPonTypeFilter(v ?? 'all');
              table.getColumn('pon_type')?.setFilterValue(v === 'all' ? undefined : v);
            }}
            placeholder="Filter by PON Type"
            getOptionValue={(option) => option.value}
            displayValue={(selected: string) =>
              ponTypeOptions.find((option) => option.value === selected)?.label ?? 'All Types'
            }
            className="w-full xs:max-w-40"
            clearable={ponTypeFilter !== 'all'}
            onClear={() => {
              setPonTypeFilter('all');
              table.getColumn('pon_type')?.setFilterValue(undefined);
            }}
          />
          <Input
            type="search"
            clearable={true}
            placeholder="Search device types..."
            onClear={() => table.setGlobalFilter('')}
            value={table.getState().globalFilter ?? ''}
            prefix={<PiMagnifyingGlassBold className="size-4" />}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="w-full xs:max-w-80"
          />
          <Button
            onClick={handleCreateClick}
            className="gap-2 whitespace-nowrap"
          >
            <PiPlusBold className="h-4 w-4" />
            Add Device Type
          </Button>
        </Flex>
      </Flex>
      <Table
        table={table}
        variant="minimal"
        classNames={{
          rowClassName: 'last:!border-b-0 hover:bg-gray-50',
          cellClassName: 'py-3',
        }}
      />
    </>
  );
}
