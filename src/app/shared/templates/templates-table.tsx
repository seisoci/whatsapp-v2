'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { Template } from '.';
import { createTemplatesColumns } from './columns';
import { Flex, Title, Loader } from 'rizzui';
import { routes } from '@/config/routes';
import { useRouter } from 'next/navigation';
import { Button } from 'rizzui';
import { PiPlusBold } from 'react-icons/pi';
import TemplatesFilters from '@/app/shared/templates/templates-filters';
import { templatesApi } from '@/lib/api/templates';
import toast from 'react-hot-toast';

export default function TemplatesTable() {
  const [templateData, setTemplateData] = useState<Template[]>([]);
  const [filteredData, setFilteredData] = useState<Template[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchTemplateData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await templatesApi.getAll();

      if (response.success && response.data) {
        const templateData = response.data || [];

        if (Array.isArray(templateData)) {
          setTemplateData(templateData);
          setFilteredData(templateData);
          setTotalRecords(templateData.length);

          // Extract unique phone numbers for filter
          const uniquePhoneNumbers = Array.from(
            new Set(
              templateData.map((t: any) => ({
                value: t.phoneNumberId,
                label: t.phoneNumberName || t.displayPhoneNumber || t.phoneNumberId,
              }))
            )
          ).reduce((acc: any[], curr) => {
            if (!acc.find((item) => item.value === curr.value)) {
              acc.push(curr);
            }
            return acc;
          }, []);
          setPhoneNumbers(uniquePhoneNumbers);
        } else {
          setTemplateData([]);
          setFilteredData([]);
          setTotalRecords(0);
          setPhoneNumbers([]);
        }
      } else {
        toast.error('Failed to load templates');
        setTemplateData([]);
        setFilteredData([]);
        setTotalRecords(0);
        setPhoneNumbers([]);
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates from backend');
      setTemplateData([]);
      setFilteredData([]);
      setTotalRecords(0);
      setPhoneNumbers([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemplateData(true);
  }, []);

  const handleEditTemplate = (template: Template) => {
    console.log('Editing template:', template);
    if (!template.phoneNumberId) {
      toast.error('Cannot edit template: Missing Phone Number ID');
      return;
    }
    router.push(`${routes.templates.edit(template.id)}?phoneNumberId=${template.phoneNumberId}`);
  };

  const handleCreateTemplate = () => {
    router.push(routes.templates.create);
  };

const handleDeleteTemplate = async (id: string, phoneNumberId: string, templateName: string) => {
  try {
    const response = await templatesApi.delete(id, phoneNumberId, templateName);
    if (response.success) {
      toast.success(response.message || 'Template deleted successfully');
      fetchTemplateData(false);
    } else {
      toast.error(response.message || 'Failed to delete template');
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete template';
    toast.error(errorMessage);
  }
};

  const handleFilter = (filters: {
    category: string;
    status: string;
    phoneNumberId: string;
  }) => {
    let filtered = [...templateData];

    if (filters.category) {
      filtered = filtered.filter((t: any) => t.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter((t: any) => t.status === filters.status);
    }

    if (filters.phoneNumberId) {
      filtered = filtered.filter((t: any) => t.phoneNumberId === filters.phoneNumberId);
    }

    setFilteredData(filtered);
    setTotalRecords(filtered.length);
  };

return (
  <div ref={tableContainerRef}>
    <TemplatesTableContent
      data={filteredData}
      loading={loading}
      isRefreshing={isRefreshing}
      onRefresh={() => fetchTemplateData(false)}
      totalRecords={totalRecords}
      onEditTemplate={handleEditTemplate}
      onDeleteTemplate={handleDeleteTemplate}
      onCreateTemplate={handleCreateTemplate}
      phoneNumbers={phoneNumbers}
      onFilter={handleFilter}
    />
  </div>
  );
}

function TemplatesTableContent({
  data,
  loading,
  isRefreshing,
  onRefresh,
  totalRecords,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate,
  phoneNumbers,
  onFilter,
}: {
  data: any[];
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalRecords: number;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string, phoneNumberId: string, templateName: string) => void;
  onCreateTemplate: () => void;
  phoneNumbers: { value: string; label: string }[];
  onFilter: (filters: { category: string; status: string; phoneNumberId: string }) => void;
}) {
  const { table, setData } = useTanStackTable<Template>({
    tableData: data,
    columnConfig: createTemplatesColumns({
      onEditTemplate,
      onDeleteTemplate,
    }),
    options: {
      enableColumnResizing: false,
      initialState: {
        pagination: {
          pageSize: 9999, // Show all items
        },
      },
    },
  });

  useEffect(() => {
    setData(data as Template[]);
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
      <TemplatesFilters phoneNumbers={phoneNumbers} onFilter={onFilter} />

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

{
  isRefreshing && (
    <div className="absolute right-4 top-4 z-10" >
      <Loader variant="spinner" size = "sm" className = "text-primary" />
        </div>
        )
}
</div>
  </>
  );
}
