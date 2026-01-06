'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { createQuickRepliesColumns } from './columns';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Button } from 'rizzui';
import { quickReplyApi, QuickReply } from '@/lib/api/quick-replies';
import toast from 'react-hot-toast';

export default function QuickRepliesTable({ onEdit, onDelete }: { onEdit: (reply: QuickReply) => void; onDelete: (id: string) => void }) {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchQuickReplies = async (page?: number, perPage?: number, search?: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const currentPage = page ?? pagination.pageIndex + 1;
      const currentPerPage = perPage ?? pagination.pageSize;
      const currentSearch = search ?? searchQuery;

      const response = await quickReplyApi.getAll();
      
      if (response.success && response.data) {
        let data = response.data || [];

        // Apply search filter locally
        if (currentSearch) {
          data = data.filter(
            (reply) =>
              reply.shortcut.toLowerCase().includes(currentSearch.toLowerCase()) ||
              reply.text.toLowerCase().includes(currentSearch.toLowerCase())
          );
        }

        // Apply sorting locally
        if (sorting.length > 0) {
          const { id: sortBy, desc } = sorting[0];
          data.sort((a, b) => {
            const aValue = a[sortBy as keyof QuickReply];
            const bValue = b[sortBy as keyof QuickReply];

            if (aValue < bValue) return desc ? 1 : -1;
            if (aValue > bValue) return desc ? -1 : 1;
            return 0;
          });
        }

        // Apply pagination locally
        const startIndex = (currentPage - 1) * currentPerPage;
        const endIndex = startIndex + currentPerPage;
        const paginatedData = data.slice(startIndex, endIndex);

        setTotalRecords(data.length);
        setQuickReplies(paginatedData);
      } else {
        setQuickReplies([]);
      }
    } catch (error: any) {
      toast.error('Failed to load quick replies');
      setQuickReplies([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchQuickReplies(1, pagination.pageSize, searchQuery, true);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      fetchQuickReplies(1, pagination.pageSize, searchQuery, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pagination effect
  useEffect(() => {
    if (loading) return;

    fetchQuickReplies(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Sorting effect
  useEffect(() => {
    if (loading) return;

    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchQuickReplies(1, pagination.pageSize, searchQuery, false);
  }, [sorting]);

  const handleResetFilters = () => {
    setSearchQuery('');
  };

  return (
    <div ref={tableContainerRef}>
      <QuickRepliesTableContent
        data={quickReplies}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchQuickReplies(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        totalRecords={totalRecords}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetFilters={handleResetFilters}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function QuickRepliesTableContent({
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
  onResetFilters,
  onEdit,
  onDelete,
}: {
  data: any[];
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
  onResetFilters: () => void;
  onEdit: (reply: QuickReply) => void;
  onDelete: (id: string) => void;
}) {
  const { table, setData } = useTanStackTable<QuickReply>({
    tableData: data,
    columnConfig: createQuickRepliesColumns({ onEdit, onDelete }),
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
          Quick Replies ({totalRecords} total)
        </Title>
        <Flex align="center" className="w-full gap-3 xs:w-auto">
          <Input
            type="search"
            clearable={true}
            placeholder="Search by shortcut or text..."
            onClear={() => onSearchChange('')}
            value={searchQuery}
            prefix={<PiMagnifyingGlassBold className="size-4" />}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full xs:max-w-80"
          />
          {searchQuery && (
            <Button
              variant="outline"
              onClick={onResetFilters}
              className="w-auto"
            >
              Reset
            </Button>
          )}
        </Flex>
      </Flex>

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

        {/* Loading indicator */}
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
