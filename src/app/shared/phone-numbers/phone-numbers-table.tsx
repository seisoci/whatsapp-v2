'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { PhoneNumber } from '.';
import { createPhoneNumbersColumns } from './columns';
import { Flex, Title, Loader } from 'rizzui';
import { useModal } from '@/app/shared/modal-views/use-modal';
import CreateEditPhoneNumber from '@/app/shared/phone-numbers/create-edit-phone-number';
import RequestVerificationModal from '@/app/shared/phone-numbers/request-verification-modal';
import VerifyCodeModal from '@/app/shared/phone-numbers/verify-code-modal';
import TwoStepVerificationModal from '@/app/shared/phone-numbers/two-step-verification-modal';
import DisplayNameStatusModal from '@/app/shared/phone-numbers/display-name-status-modal';
import EditBusinessProfileModal from '@/app/shared/phone-numbers/edit-business-profile-modal';
import { phoneNumbersApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function PhoneNumbersTable() {
  const [phoneNumberData, setPhoneNumberData] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { openModal, closeModal } = useModal();

  const fetchPhoneNumberData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await phoneNumbersApi.getAll();

      if (response.success && response.data) {
        const phoneNumberData = response.data || [];

        if (Array.isArray(phoneNumberData)) {
          setPhoneNumberData(phoneNumberData);
          setTotalRecords(phoneNumberData.length);
        } else {
          setPhoneNumberData([]);
          setTotalRecords(0);
        }
      } else {
        toast.error('Failed to load phone numbers');
        setPhoneNumberData([]);
        setTotalRecords(0);
      }
    } catch (error: any) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers from backend');
      setPhoneNumberData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPhoneNumberData(true);
  }, []);

  const handleEditPhoneNumber = (phoneNumber: PhoneNumber) => {
    openModal({
      view: <CreateEditPhoneNumber phoneNumber={ phoneNumber } onSuccess = {() => fetchPhoneNumberData(false)
} />,
customSize: 600,
    });
  };

const handleDeletePhoneNumber = async (id: string) => {
  try {
    const response = await phoneNumbersApi.delete(id);
    if (response.success) {
      toast.success(response.message || 'Phone number deleted successfully');
      fetchPhoneNumberData(false);
    } else {
      toast.error(response.message || 'Failed to delete phone number');
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete phone number';
    toast.error(errorMessage);
  }
};

const handleSyncPhoneNumber = async (id: string) => {
  try {
    setIsRefreshing(true);
    const response = await phoneNumbersApi.sync(id);
    if (response.success) {
      toast.success(response.message || 'Phone number synced successfully');
      fetchPhoneNumberData(false);
    } else {
      toast.error(response.message || 'Failed to sync phone number');
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to sync phone number';
    toast.error(errorMessage);
  } finally {
    setIsRefreshing(false);
  }
};

const handleTestConnection = async (id: string) => {
  try {
    const loadingToast = toast.loading('Testing connection...');
    const response = await phoneNumbersApi.testConnection(id);
    toast.dismiss(loadingToast);

    if (response.success) {
      toast.success(response.message || 'Connection test successful!');
    } else {
      toast.error(response.message || 'Connection test failed');
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to test connection';
    toast.error(errorMessage);
  }
};

const handleRequestVerification = (phoneNumber: PhoneNumber) => {
  openModal({
    view: (
      <RequestVerificationModal
          phoneNumber= { phoneNumber }
          onSuccess={() => fetchPhoneNumberData(false)}
onClose = { closeModal }
  />
      ),
customSize: 600,
    });
  };

const handleVerifyCode = (phoneNumber: PhoneNumber) => {
  openModal({
    view: (
      <VerifyCodeModal
          phoneNumber= { phoneNumber }
          onSuccess={() => fetchPhoneNumberData(false)}
onClose = { closeModal }
  />
      ),
customSize: 600,
    });
  };

const handleSetTwoStepVerification = (phoneNumber: PhoneNumber) => {
  openModal({
    view: (
      <TwoStepVerificationModal
          phoneNumber= { phoneNumber }
          onSuccess={() => fetchPhoneNumberData(false)}
onClose = { closeModal }
  />
      ),
customSize: 600,
    });
  };

const handleViewDisplayNameStatus = (phoneNumber: PhoneNumber) => {
  openModal({
    view: <DisplayNameStatusModal phoneNumber={ phoneNumber } onClose = { closeModal } />,
    customSize: 800,
    });
  };

const handleEditBusinessProfile = (phoneNumber: PhoneNumber) => {
  openModal({
    view: (
      <EditBusinessProfileModal
        phoneNumber={phoneNumber}
        onSuccess={() => fetchPhoneNumberData(false)}
        onClose={closeModal}
      />
    ),
    customSize: 700,
  });
};

return (
  <div ref= { tableContainerRef } >
  <PhoneNumbersTableContent
        data={ phoneNumberData }
loading = { loading }
isRefreshing = { isRefreshing }
onRefresh = {() => fetchPhoneNumberData(false)}
totalRecords = { totalRecords }
onEditPhoneNumber = { handleEditPhoneNumber }
onDeletePhoneNumber = { handleDeletePhoneNumber }
onSyncPhoneNumber = { handleSyncPhoneNumber }
onTestConnection = { handleTestConnection }
onRequestVerification = { handleRequestVerification }
onVerifyCode = { handleVerifyCode }
onSetTwoStepVerification = { handleSetTwoStepVerification }
onViewDisplayNameStatus = { handleViewDisplayNameStatus }
onEditBusinessProfile = { handleEditBusinessProfile }
  />
  </div>
  );
}

function PhoneNumbersTableContent({
  data,
  loading,
  isRefreshing,
  onRefresh,
  totalRecords,
  onEditPhoneNumber,
  onDeletePhoneNumber,
  onSyncPhoneNumber,
  onTestConnection,
  onRequestVerification,
  onVerifyCode,
  onSetTwoStepVerification,
  onViewDisplayNameStatus,
  onEditBusinessProfile,
}: {
  data: any[];
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalRecords: number;
  onEditPhoneNumber: (phoneNumber: any) => void;
  onDeletePhoneNumber: (id: string) => void;
  onSyncPhoneNumber: (id: string) => void;
  onTestConnection: (id: string) => void;
  onRequestVerification: (phoneNumber: PhoneNumber) => void;
  onVerifyCode: (phoneNumber: PhoneNumber) => void;
  onSetTwoStepVerification: (phoneNumber: PhoneNumber) => void;
  onViewDisplayNameStatus: (phoneNumber: PhoneNumber) => void;
  onEditBusinessProfile: (phoneNumber: PhoneNumber) => void;
}) {
  const { table, setData } = useTanStackTable<PhoneNumber>({
    tableData: data,
    columnConfig: createPhoneNumbersColumns({
      onEditPhoneNumber,
      onDeletePhoneNumber,
      onSyncPhoneNumber,
      onTestConnection,
      onRequestVerification,
      onVerifyCode,
      onSetTwoStepVerification,
      onViewDisplayNameStatus,
      onEditBusinessProfile,
    }),
    options: {
      enableColumnResizing: false,
    },
  });

  useEffect(() => {
    setData(data as PhoneNumber[]);
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
      Phone Numbers({ totalRecords } total)
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
