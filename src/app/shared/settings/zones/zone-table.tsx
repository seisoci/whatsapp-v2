'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { Zone, createZoneColumns } from './columns';
import { PiMagnifyingGlassBold, PiPlusBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Button } from 'rizzui';
import toast from 'react-hot-toast';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateZone from './create-zone';
import { getZones } from '@/lib/sanctum-api';

export default function ZoneTable() {
  const [data, setData] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getZones();

      if (response && response.data) {
        setData(response.data);
      } else {
        toast.error('Failed to load Zones');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load Zones');
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

  return <ZoneTableContent data={data} onRefresh={fetchData} />;
}

function ZoneTableContent({ data, onRefresh }: { data: Zone[]; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleCreateClick = () => {
    openModal({
      view: <CreateZone onSuccess={onRefresh} />,
      size: 'sm',
    });
  };

  const { table } = useTanStackTable<Zone>({
    tableData: data,
    columnConfig: createZoneColumns(onRefresh),
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 25,
        },
      },
      enableColumnResizing: false,
    },
  });

  return (
    <>
      <Flex
        direction="col"
        justify="between"
        className="mb-4 gap-3 xs:flex-row xs:items-center"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          Total ({data.length})
        </Title>
        <Flex align="center" className="gap-3 w-full xs:w-auto">
          <Input
            type="search"
            clearable={true}
            placeholder="Search zones..."
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
            Add Zone
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
