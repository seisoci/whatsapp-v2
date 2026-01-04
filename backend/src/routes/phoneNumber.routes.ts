import { Hono } from 'hono';
import { PhoneNumberControllerWithPermissions as PhoneNumberController } from '../controllers/phoneNumber.controller';
import { authMiddleware } from '../middlewares';

const phoneNumberRouter = new Hono();

// All routes require authentication
phoneNumberRouter.use('*', authMiddleware);

// Get all phone numbers (permission check in controller)
phoneNumberRouter.get('/', PhoneNumberController.index);

// Get single phone number (permission check in controller)
phoneNumberRouter.get('/:id', PhoneNumberController.show);

// Create phone number (permission check in controller)
phoneNumberRouter.post('/', PhoneNumberController.store);

// Update phone number (permission check in controller)
phoneNumberRouter.put('/:id', PhoneNumberController.update);

// Sync phone number from WhatsApp API (permission check in controller)
phoneNumberRouter.post('/:id/sync', PhoneNumberController.sync);

// Test phone number connection (permission check in controller)
phoneNumberRouter.post('/:id/test-connection', PhoneNumberController.testConnection);

// Request verification code (SMS/Voice)
phoneNumberRouter.post('/:id/request-verification-code', PhoneNumberController.requestVerificationCode);

// Verify code
phoneNumberRouter.post('/:id/verify-code', PhoneNumberController.verifyPhoneCode);

// Set two-step verification PIN
phoneNumberRouter.post('/:id/set-two-step-verification', PhoneNumberController.setTwoStepVerification);

// Get display name status
phoneNumberRouter.get('/:id/display-name-status', PhoneNumberController.getDisplayNameStatus);

// Update business profile
phoneNumberRouter.put('/:id/business-profile', PhoneNumberController.updateBusinessProfile);

// Upload profile picture
phoneNumberRouter.post('/:id/profile-picture', PhoneNumberController.uploadProfilePicture);

// Delete profile picture
phoneNumberRouter.delete('/:id/profile-picture', PhoneNumberController.deleteProfilePicture);

// Delete phone number (permission check in controller)
phoneNumberRouter.delete('/:id', PhoneNumberController.destroy);

export default phoneNumberRouter;
