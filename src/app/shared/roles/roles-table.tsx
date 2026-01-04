'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { Role } from '.';
import { createRolesColumns } from './columns';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Flex, Input, Title, Loader, Button } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditRole from '@/app/shared/roles/create-edit-role';
import { rolesApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RolesTable() {
  const [roleData, setRoleData] = useState<Role[]>([]);
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
  const { openModal } = useModal();
  const router = useRouter();

  const fetchRoleData = async (page?: number, perPage?: number, search?: string, isInitialLoad = false) => {
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

      const response = await rolesApi.getAll({
        page: currentPage,
        limit: currentPerPage,
        search: currentSearch || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      // Handle backend API response
      if (response.success && response.data) {
        const roleData = response.data || [];
        const metaData = response.meta;

        // Set total records from pagination metadata
        if (metaData?.total !== undefined) {
          setTotalRecords(metaData.total);
        }

        if (Array.isArray(roleData)) {
          setRoleData(roleData);
        } else {
          setRoleData([]);
        }
      } else {
        toast.error('Failed to load roles');
        setRoleData([]);
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles from backend');
      setRoleData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRoleData(1, pagination.pageSize, searchQuery, true);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      fetchRoleData(1, pagination.pageSize, searchQuery, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pagination effect
  useEffect(() => {
    if (loading) return;

    fetchRoleData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Sorting effect
  useEffect(() => {
    if (loading) return;

    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchRoleData(1, pagination.pageSize, searchQuery, false);
  }, [sorting]);

  const handleResetFilters = () => {
    setSearchQuery('');
  };

  const handleEditRole = (role: Role) => {
    openModal({
      view: <CreateEditRole role={ role } onSuccess = {() => fetchRoleData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)
} />,
customSize: 600,
    });
  };

const handleDeleteRole = async (id: string) => {
  try {
    const response = await rolesApi.delete(id);
    if (response.success) {
      toast.success(response.message || 'Role deleted successfully');
      fetchRoleData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false);
    } else {
      toast.error(response.message || 'Failed to delete role');
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete role';
    toast.error(errorMessage);
  }
};

const handleAssignPermissions = (roleId: string) => {
  router.push(`/roles/${roleId}/permissions`);
};

return (
  <div ref= { tableContainerRef } >
  <RolesTableContent
        data={ roleData }
loading = { loading }
isRefreshing = { isRefreshing }
onRefresh = {() => fetchRoleData(pagination.pageIndex + 1, pagination.pageSize, searchQuery, false)}
pagination = { pagination }
setPagination = { setPagination }
sorting = { sorting }
setSorting = { setSorting }
totalRecords = { totalRecords }
searchQuery = { searchQuery }
onSearchChange = { setSearchQuery }
onResetFilters = { handleResetFilters }
onEditRole = { handleEditRole }
onDeleteRole = { handleDeleteRole }
onAssignPermissions = { handleAssignPermissions }
  />
  </div>
  );
}

function RolesTableContent({
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
  onEditRole,
  onDeleteRole,
  onAssignPermissions,
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
  onEditRole: (role: any) => void;
  onDeleteRole: (id: string) => void;
  onAssignPermissions: (id: string) => void;
}) {
  const { table, setData } = useTanStackTable<Role>({
    tableData: data,
    columnConfig: createRolesColumns({ onEditRole, onDeleteRole, onAssignPermissions }),
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
    setData(data as Role[]);
  }, [data, setData]);

  if (loading) {
    return (
      <div className= "flex min-h-[400px] items-center justify-center" >
      <Loader variant="spinner" size = "xl" />
        </div>
    );
  }

  return (
    <>
    <Flex
        direction= "col"
  justify = "between"
  className = "mb-4 gap-3 xs:flex-row xs:items-center"
    >
    <Title as="h3" className = "text-base font-semibold sm:text-lg" >
      Roles({ totalRecords } total)
      </Title>
      < Flex align = "center" className = "w-full gap-3 xs:w-auto" >
        <Input
            type="search"
  clearable = { true}
  placeholder = "Search by name or slug..."
  onClear = {() => onSearchChange('')
}
value = { searchQuery }
prefix = {< PiMagnifyingGlassBold className = "size-4" />}
onChange = {(e) => onSearchChange(e.target.value)}
className = "w-full xs:max-w-80"
  />
  { searchQuery && (
    <Button
              variant="outline"
onClick = { onResetFilters }
className = "w-auto"
  >
  Reset
  </Button>
          )}
</Flex>
  </Flex>

{/* Table wrapper with smooth transitions */ }
<div className="relative overflow-hidden" >
  <div
          className="transition-opacity duration-300 ease-in-out"
style = {{ opacity: isRefreshing ? 0.4 : 1 }}
        >
  <Table
            table={ table }
variant = "minimal"
classNames = {{
  rowClassName: 'last:!border-b-0 hover:bg-gray-50',
    cellClassName: 'py-3',
            }}
          />
  </div>

{/* Loading indicator */ }
{
  isRefreshing && (
    <div className="absolute right-4 top-4 z-10" >
      <Loader variant="spinner" size = "sm" className = "text-primary" />
        </div>
        )
}
</div>

  < TablePagination table = { table } className = "py-4" />
    </>
  );
}
