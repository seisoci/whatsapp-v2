export interface PhoneNumber {
  id: string;
  phoneNumberId: string;
  wabaId: string;
  name: string | null;
  isActive: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string | null;
  qualityRating?: string;
  messagingLimitTier?: string;
  isOfficialBusinessAccount?: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
    email: string;
  };
  error?: string;
}
