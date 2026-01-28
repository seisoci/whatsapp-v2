export interface Contact {
  id: string;
  waId: string;
  phoneNumber: string;
  phoneNumberId: string;
  profileName?: string;
  businessName?: string;
  profilePictureUrl?: string;
  isBusinessAccount: boolean;
  isBlocked: boolean;
  notes?: string;
  customFields?: Record<string, any>;
  tags?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  waId: string;
  phoneNumberId: string;
  profileName?: string;
  businessName?: string;
  email?: string; // stored in customFields
}

export interface UpdateContactInput {
  profileName?: string;
  businessName?: string;
  email?: string;
  notes?: string;
  isBlocked?: boolean;
}
