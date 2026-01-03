'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { Olt } from '@/types/olt';
import { createOltColumns } from './columns';
import { PiMagnifyingGlassBold, PiPlusBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Button } from 'rizzui';
import { getOltList } from '@/lib/sanctum-api';
import toast from 'react-hot-toast';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateOlt from './create-olt';

export default function OltTable() {
  const [oltData, setOltData] = useState<Olt[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchOltData = async () => {
    try {
      setLoading(true);
      const response = await getOltList();

      if (response.data) {
        setOltData(response.data);
      } else {
        toast.error('Failed to load OLT data');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load OLT data. Please make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchOltData();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return <OltTableContent data={oltData} onRefresh={fetchOltData} />;
}

function OltTableContent({ data, onRefresh }: { data: Olt[]; onRefresh: () => void }) {
  const { openModal } = useModal();

  const handleCreateClick = () => {
    openModal({
      view: <CreateOlt onSuccess={onRefresh} />,
      size: 'lg',
    });
  };

  const { table } = useTanStackTable<Olt>({
    tableData: data,
    columnConfig: createOltColumns(onRefresh),
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 100,
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
          OLT List ({data.length} devices)
        </Title>
        <Flex align="center" className="gap-3 w-full xs:w-auto">
          <Input
            type="search"
            clearable={true}
            placeholder="Search OLT name..."
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
            Add OLT
          </Button>
        </Flex>
      </Flex>
      {data.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center border border-gray-200 rounded-lg">
          <div className="mb-4 text-6xl">📡</div>
          <Title as="h4" className="mb-2 text-gray-900">
            No OLT Data Found
          </Title>
          <p className="text-gray-500 mb-4">
            There are no OLT devices available. Please check your API connection or add new devices.
          </p>
          <button
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Try Again
          </button>
        </div>
      ) : (
        <Table
          table={table}
          variant="minimal"
          classNames={{
            rowClassName: 'last:!border-b-0 hover:bg-gray-50',
            cellClassName: 'py-3',
          }}
        />
      )}
    </>
  );
}
