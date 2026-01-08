'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { User } from '@/lib/api/types/users';
import { createUsersColumns } from './columns';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Select, Button } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import EditUser from '@/app/shared/roles-permissions/edit-user';
import ResetPasswordModal from './reset-password-modal';
import { usersApi } from '@/lib/api/users';
import toast from 'react-hot-toast';

export default function UsersTable() {
  const [userData, setUserData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();

  const fetchUserData = async (page?: number, perPage?: number, search?: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const currentPage = page ?? pagination.pageIndex + 1;
      const currentPerPage = perPage ?? pagination.pageSize;
      const currentSearch = search ?? searchQuery;

      // Prepare sort parameters
      const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

      try {
        const response = await usersApi.getAll({
          page: currentPage,
          limit: currentPerPage,
          search: currentSearch || undefined,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        // Handle backend API response
        if (response.success && response.data) {
          const userData = response.data || [];
          const metaData = response.meta;

          // Set total records from pagination metadata
          if (metaData?.total !== undefined) {
            setTotalRecords(metaData.total);
          }

          if (Array.isArray(userData)) {
            setUserData(userData);
          } else {
            setUserData([]);
          }
        } else {
          setUserData([]);
        }
      } catch (apiError: any) {
        setUserData([]);
        const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to load users';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      setUserData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUserData(1, pagination.pageSize, searchQuery, true);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      fetchUserData(1, pagination.pageSize, searchQuery, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Pagination effect
  useEffect(() => {
    if (loading) return;

    fetchUserData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Sorting effect
  useEffect(() => {
    if (loading) return;

    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchUserData(1, pagination.pageSize, searchQuery, false);
  }, [sorting]);

  const handleResetFilters = () => {
    setSearchQuery('');
  };

  const handleEditUser = (user: User) => {
    openModal({
      view: <EditUser user={user} onSuccess={() => fetchUserData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)} />,
      customSize: 600,
    });
  };

  const handleResetPassword = (user: User) => {
    openModal({
      view: <ResetPasswordModal user={user} onSuccess={() => fetchUserData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)} />,
      customSize: 500,
    });
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await usersApi.delete(id);
      if (response.success) {
        toast.success(response.message || 'User deleted successfully');
        fetchUserData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  return (
    <div ref={tableContainerRef}>
      <UsersTableContent
        data={userData}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchUserData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)}
        pagination={pagination}
        setPagination={setPagination}
        sorting={sorting}
        setSorting={setSorting}
        totalRecords={totalRecords}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetFilters={handleResetFilters}
        onEditUser={handleEditUser}
        onResetPassword={handleResetPassword}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}

function UsersTableContent({
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
  onEditUser,
  onResetPassword,
  onDeleteUser,
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
  onEditUser: (user: any) => void;
  onResetPassword: (user: any) => void;
  onDeleteUser: (id: string) => void;
}) {
  const { table, setData } = useTanStackTable<User>({
    tableData: data,
    columnConfig: createUsersColumns({ onEditUser, onResetPassword, onDeleteUser }),
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
          Users ({totalRecords} total)
        </Title>
        <Flex align="center" className="w-full gap-3 xs:w-auto">
          <Input
            type="search"
            clearable={true}
            placeholder="Search by name or email..."
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
