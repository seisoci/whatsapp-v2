'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { Template } from '.';
import { createTemplatesColumns } from './columns';
import { Flex, Title, Loader } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditTemplate from '@/app/shared/templates/create-edit-template';
import { templatesApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function TemplatesTable() {
  const [templateData, setTemplateData] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { openModal, closeModal } = useModal();

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
          setTotalRecords(templateData.length);
        } else {
          setTemplateData([]);
          setTotalRecords(0);
        }
      } else {
        toast.error('Failed to load templates');
        setTemplateData([]);
        setTotalRecords(0);
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates from backend');
      setTemplateData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemplateData(true);
  }, []);

  const handleEditTemplate = (template: Template) => {
    openModal({
      view: <CreateEditTemplate template={ template } onSuccess = {() => fetchTemplateData(false)
} onClose = { closeModal } />,
  customSize: 800,
    });
  };

const handleCreateTemplate = () => {
  openModal({
    view: <CreateEditTemplate onSuccess={() => fetchTemplateData(false)} onClose = { closeModal } />,
      customSize: 800,
    });
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

return (
  <div ref= { tableContainerRef } >
  <TemplatesTableContent
        data={ templateData }
loading = { loading }
isRefreshing = { isRefreshing }
onRefresh = {() => fetchTemplateData(false)}
totalRecords = { totalRecords }
onEditTemplate = { handleEditTemplate }
onDeleteTemplate = { handleDeleteTemplate }
onCreateTemplate = { handleCreateTemplate }
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
}: {
  data: any[];
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalRecords: number;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (id: string, phoneNumberId: string, templateName: string) => void;
  onCreateTemplate: () => void;
}) {
  const { table, setData } = useTanStackTable<Template>({
    tableData: data,
    columnConfig: createTemplatesColumns({
      onEditTemplate,
      onDeleteTemplate,
    }),
    options: {
      enableColumnResizing: false,
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
    <Flex
        direction= "col"
  justify = "between"
  className = "mb-4 gap-3 xs:flex-row xs:items-center"
    >
    <Title as="h3" className = "text-base font-semibold sm:text-lg" >
      Message Templates({ totalRecords } total)
        </Title>
        </Flex>

        < div className = "relative overflow-hidden" >
          <div
          className="transition-opacity duration-300 ease-in-out"
  style = {{ opacity: isRefreshing ? 0.4 : 1 }
}
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
