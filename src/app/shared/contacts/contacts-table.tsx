'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { Contact } from '@/lib/api/types/contacts';
import { createContactsColumns } from './columns';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Button } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditContact from './create-edit-contact';
import { contactsApi } from '@/lib/api/contacts';
import toast from 'react-hot-toast';

export default function ContactsTable() {
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();

  const fetchData = async (page?: number, perPage?: number, search?: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const currentPage = page ?? pagination.pageIndex + 1;
      const currentPerPage = perPage ?? pagination.pageSize;
      const currentSearch = search ?? searchQuery;

      const response = await contactsApi.getAll({
        page: currentPage,
        limit: currentPerPage,
        search: currentSearch || undefined,
      });

      if (response.success && response.data) {
        setData(response.data || []);
        if (response.meta?.total !== undefined) {
          setTotalRecords(response.meta.total);
        }
      } else {
        setData([]);
      }
    } catch (error: any) {
      setData([]);
      toast.error(error.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize, searchQuery, true);
  }, []);

  // Debounced search
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      fetchData(1, pagination.pageSize, searchQuery, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pagination
  useEffect(() => {
    if (loading) return;
    fetchData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleEdit = (contact: Contact) => {
    openModal({
      view: <CreateEditContact contact={contact} onSuccess={() => fetchData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)} />,
      customSize: 600,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const response = await contactsApi.delete(id);
      if (response.success) {
        toast.success('Contact deleted successfully');
        fetchData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
      } else {
        toast.error(response.message || 'Failed to delete contact');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const { table, setData: setTableData } = useTanStackTable<Contact>({
    tableData: data,
    columnConfig: createContactsColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    options: {
      pageCount: Math.ceil(totalRecords / pagination.pageSize),
      state: {
        pagination,
      },
      onPaginationChange: setPagination,
      manualPagination: true,
      enableColumnResizing: false,
    },
  });

  useEffect(() => {
    setTableData([...data]);
  }, [data, setTableData]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <div ref={tableContainerRef}>
      <Flex
        direction="col"
        justify="between"
        className="mb-4 gap-3 xs:flex-row xs:items-center"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          Contacts ({totalRecords} total)
        </Title>
        <Flex align="center" className="w-full gap-3 xs:w-auto">
          <Input
            type="search"
            clearable={true}
            placeholder="Search by name or ID..."
            onClear={() => setSearchQuery('')}
            value={searchQuery}
            prefix={<PiMagnifyingGlassBold className="size-4" />}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full xs:max-w-80"
          />
        </Flex>
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

      <TablePagination table={table} className="py-4" />
    </div>
  );
}
