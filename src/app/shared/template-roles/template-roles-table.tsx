'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TablePagination from '@core/components/table/pagination';
import { Flex, Input, Loader, Title } from 'rizzui';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import toast from 'react-hot-toast';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { templatesApi } from '@/lib/api/templates';
import { templateRolesApi } from '@/lib/api/template-roles';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { createTemplateRolesColumns, type TemplateWithRoles } from './columns';
import AssignRolesForm from './assign-roles-form';
import type { Template } from '../templates';
import type { TemplateRoleGroup } from '.';

interface PhoneNumberRecord {
  id: string;          // DB UUID
  phoneNumberId: string; // WA phone number ID
  name?: string;
  wabaId: string;
}

export default function TemplateRolesTable() {
  const [templates, setTemplates] = useState<TemplateWithRoles[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { openModal, closeModal } = useModal();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, roleGroupsRes, phoneNumbersRes] = await Promise.all([
        templatesApi.getAll(),
        templateRolesApi.getAll(),
        phoneNumbersApi.getAll({ limit: 100 }),
      ]);

      const templateList: Template[] = Array.isArray(templatesRes.data)
        ? (templatesRes.data as Template[])
        : [];

      const groups: TemplateRoleGroup[] = roleGroupsRes.success && Array.isArray(roleGroupsRes.data)
        ? (roleGroupsRes.data as TemplateRoleGroup[])
        : [];

      // Build WA phoneNumberId -> DB UUID map
      const phoneNumbers: PhoneNumberRecord[] = phoneNumbersRes.success && Array.isArray(phoneNumbersRes.data)
        ? (phoneNumbersRes.data as PhoneNumberRecord[])
        : [];
      const phoneNumberMap = new Map<string, PhoneNumberRecord>(
        phoneNumbers.map((p) => [p.phoneNumberId, p])
      );

      // Merge templates with assigned roles and DB UUID
      const merged: TemplateWithRoles[] = templateList.map((template) => {
        const waPhoneNumberId = template.phoneNumberId || '';
        const dbPhone = phoneNumberMap.get(waPhoneNumberId);
        const phoneNumberDbId = dbPhone?.id || '';

        const group = groups.find(
          (g) => g.templateId === template.id && g.phoneNumberDbId === phoneNumberDbId
        );

        return {
          ...template,
          phoneNumberDbId,
          assignedRoles: group?.roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug })) ?? [],
        };
      });

      setTemplates(merged);
      setFilteredTemplates(merged);
    } catch (error) {
      toast.error('Gagal memuat data template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredTemplates(
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.phoneNumberName && t.phoneNumberName.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, templates]);

  const handleManageRoles = (template: TemplateWithRoles) => {
    const t = template;
    if (!t.phoneNumberDbId) {
      toast.error('Phone number DB ID tidak ditemukan untuk template ini');
      return;
    }

    openModal({
      view: (
        <AssignRolesForm
          templateId={t.id}
          templateName={t.name}
          wabaId={t.wabaId || ''}
          phoneNumberDbId={t.phoneNumberDbId}
          onSuccess={fetchData}
          onClose={closeModal}
        />
      ),
      customSize: 500,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <TemplateRolesTableContent
      data={filteredTemplates}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onManageRoles={handleManageRoles}
    />
  );
}

function TemplateRolesTableContent({
  data,
  searchQuery,
  onSearchChange,
  onManageRoles,
}: {
  data: TemplateWithRoles[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onManageRoles: (template: TemplateWithRoles) => void;
}) {
  const { table, setData } = useTanStackTable<TemplateWithRoles>({
    tableData: data,
    columnConfig: createTemplateRolesColumns({ onManageRoles }),
    options: {
      enableColumnResizing: false,
      initialState: {
        pagination: { pageSize: 50 },
      },
    },
  });

  useEffect(() => {
    setData(data);
  }, [data, setData]);

  return (
    <>
      <Flex
        direction="col"
        justify="between"
        className="xs:flex-row xs:items-center mb-4 gap-3"
      >
        <Title as="h3" className="text-base font-semibold sm:text-lg">
          Templates ({data.length} total)
        </Title>
        <Input
          type="search"
          clearable
          placeholder="Cari nama template, kategori..."
          onClear={() => onSearchChange('')}
          value={searchQuery}
          prefix={<PiMagnifyingGlassBold className="size-4" />}
          onChange={(e) => onSearchChange(e.target.value)}
          className="xs:max-w-80 w-full"
        />
      </Flex>

      <Table
        table={table}
        variant="minimal"
        classNames={{
          rowClassName: 'last:!border-b-0 hover:bg-gray-50',
          cellClassName: 'py-3',
        }}
      />

      <TablePagination table={table} className="py-4" />
    </>
  );
}
