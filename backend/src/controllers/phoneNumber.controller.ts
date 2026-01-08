import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppService } from '../services/whatsapp.service';
import { withPermissions } from '../utils/controller.decorator';

export class PhoneNumberController {
  /**
   * Permission definitions
   */
  static permissions = {
    index: 'chat-index',
    show: 'phone-number-index',
    store: 'phone-number-store',
    update: 'phone-number-update',
    destroy: 'phone-number-destroy',
    sync: 'phone-number-update',
    testConnection: 'phone-number-update',
    requestVerificationCode: 'phone-number-update',
    verifyPhoneCode: 'phone-number-update',
    setTwoStepVerification: 'phone-number-update',
    getDisplayNameStatus: 'phone-number-index',
    updateBusinessProfile: 'phone-number-update',
    uploadProfilePicture: 'phone-number-update',
    deleteProfilePicture: 'phone-number-update',
  };

  /**
   * Get all phone numbers (no pagination)
   * Fetch real-time data dari WhatsApp API
   */
  static async index(c: Context) {
    try {
      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);

      const phoneNumbers = await phoneNumberRepository.find({
        relations: ['creator'],
        select: {
          id: true,
          phoneNumberId: true,
          accessToken: true,
          wabaId: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            id: true,
            username: true,
            email: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      // Fetch real-time data dari WhatsApp API untuk setiap phone number
      const enrichedPhoneNumbers = await Promise.all(
        phoneNumbers.map(async (phone) => {
          try {
            const phoneInfo = await WhatsAppService.getPhoneNumberInfo(
              phone.phoneNumberId,
              phone.accessToken
            );

            return {
              id: phone.id,
              phoneNumberId: phone.phoneNumberId,
              wabaId: phone.wabaId,
              name: phone.name,
              isActive: phone.isActive,
              // Real-time data dari WhatsApp API
              displayPhoneNumber: phoneInfo.display_phone_number,
              verifiedName: phoneInfo.verified_name,
              qualityRating: phoneInfo.quality_rating,
              messagingLimitTier: phoneInfo.messaging_limit_tier,
              isOfficialBusinessAccount: phoneInfo.is_official_business_account,
              createdAt: phone.createdAt,
              updatedAt: phone.updatedAt,
              creator: phone.creator,
            };
          } catch (error) {
            // Jika gagal fetch dari WhatsApp API, return data minimal
            return {
              id: phone.id,
              phoneNumberId: phone.phoneNumberId,
              wabaId: phone.wabaId,
              name: phone.name,
              isActive: phone.isActive,
              displayPhoneNumber: 'Error fetching data',
              verifiedName: null,
              qualityRating: 'UNKNOWN',
              messagingLimitTier: 'UNKNOWN',
              isOfficialBusinessAccount: false,
              createdAt: phone.createdAt,
              updatedAt: phone.updatedAt,
              creator: phone.creator,
              error: 'Failed to fetch WhatsApp data',
            };
          }
        })
      );

      return c.json(
        {
          success: true,
          data: enrichedPhoneNumbers,
        },
        200
      );
    } catch (error: any) {
      console.error('Get phone numbers error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Get single phone number by ID
   */
  static async show(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({
        where: { id },
        relations: ['creator'],
      });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      // Don't expose access token
      const { accessToken, ...phoneNumberData } = phoneNumber as any;

      return c.json(
        {
          success: true,
          data: phoneNumberData,
        },
        200
      );
    } catch (error: any) {
      console.error('Get phone number error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Create new phone number (verify credentials only, data akan di-fetch real-time)
   */
  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const user = c.get('user');

      const { phoneNumberId, accessToken, wabaId, name } = body;

      if (!phoneNumberId || !accessToken || !wabaId) {
        return c.json(
          {
            success: false,
            message: 'Phone Number ID, Access Token, dan WABA ID harus disediakan.',
          },
          400
        );
      }

      // Verify credentials dengan WhatsApp API
      const isValid = await WhatsAppService.verifyCredentials(phoneNumberId, accessToken);

      if (!isValid) {
        return c.json(
          {
            success: false,
            message: 'Kredensial WhatsApp tidak valid. Periksa Phone Number ID dan Access Token.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);

      // Check if phone number already exists
      const existing = await phoneNumberRepository.findOne({
        where: { phoneNumberId },
      });

      if (existing) {
        return c.json(
          {
            success: false,
            message: 'Phone number sudah terdaftar.',
          },
          409
        );
      }

      // Simpan HANYA credentials
      const phoneNumber = phoneNumberRepository.create({
        phoneNumberId,
        accessToken,
        wabaId,
        name: name || null,
        isActive: true,
        createdBy: user.userId,
      });

      await phoneNumberRepository.save(phoneNumber);

      // Get real-time data untuk response
      try {
        const phoneInfo = await WhatsAppService.getPhoneNumberInfo(phoneNumberId, accessToken);

        return c.json(
          {
            success: true,
            message: 'Phone number berhasil ditambahkan.',
            data: {
              id: phoneNumber.id,
              phoneNumberId: phoneNumber.phoneNumberId,
              wabaId: phoneNumber.wabaId,
              name: phoneNumber.name,
              isActive: phoneNumber.isActive,
              // Real-time data dari WhatsApp
              displayPhoneNumber: phoneInfo.display_phone_number,
              verifiedName: phoneInfo.verified_name,
              qualityRating: phoneInfo.quality_rating,
              messagingLimitTier: phoneInfo.messaging_limit_tier,
              createdAt: phoneNumber.createdAt,
            },
          },
          201
        );
      } catch (error) {
        // Jika gagal fetch data, tetap return success (credentials sudah tersimpan)
        return c.json(
          {
            success: true,
            message: 'Phone number berhasil ditambahkan.',
            data: {
              id: phoneNumber.id,
              phoneNumberId: phoneNumber.phoneNumberId,
              wabaId: phoneNumber.wabaId,
              name: phoneNumber.name,
              isActive: phoneNumber.isActive,
              createdAt: phoneNumber.createdAt,
            },
          },
          201
        );
      }
    } catch (error: any) {
      console.error('Create phone number error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Update phone number (hanya update credentials atau status)
   */
  static async update(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      // Update allowed fields
      if (body.name !== undefined) phoneNumber.name = body.name;
      if (body.isActive !== undefined) phoneNumber.isActive = body.isActive;

      // Hanya verify jika access token benar-benar diubah (berbeda dari yang lama)
      if (body.accessToken && body.accessToken !== phoneNumber.accessToken) {
        const isValid = await WhatsAppService.verifyCredentials(
          phoneNumber.phoneNumberId,
          body.accessToken
        );
        if (!isValid) {
          return c.json(
            {
              success: false,
              message: 'Access token baru tidak valid.',
            },
            400
          );
        }
        phoneNumber.accessToken = body.accessToken;
      }

      await phoneNumberRepository.save(phoneNumber);

      return c.json(
        {
          success: true,
          message: 'Phone number berhasil diupdate.',
          data: {
            id: phoneNumber.id,
            phoneNumberId: phoneNumber.phoneNumberId,
            wabaId: phoneNumber.wabaId,
            name: phoneNumber.name,
            isActive: phoneNumber.isActive,
            updatedAt: phoneNumber.updatedAt,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Update phone number error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Delete phone number
   */
  static async destroy(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      await phoneNumberRepository.remove(phoneNumber);

      return c.json(
        {
          success: true,
          message: 'Phone number berhasil dihapus.',
        },
        200
      );
    } catch (error: any) {
      console.error('Delete phone number error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Sync phone number info from WhatsApp API
   */
  static async sync(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      // Sync from WhatsApp API
      const phoneInfo = await WhatsAppService.getPhoneNumberInfo(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken
      );

      // Update phone number info
      phoneNumber.displayPhoneNumber = phoneInfo.display_phone_number;
      phoneNumber.verifiedName = phoneInfo.verified_name;
      phoneNumber.qualityRating = phoneInfo.quality_rating || 'UNKNOWN';
      phoneNumber.messagingLimitTier = phoneInfo.messaging_limit_tier || 'TIER_NOT_SET';
      phoneNumber.isOfficialBusinessAccount = phoneInfo.is_official_business_account || false;
      phoneNumber.lastSyncAt = new Date();

      await phoneNumberRepository.save(phoneNumber);

      // Don't expose access token
      const { accessToken, ...responseData } = phoneNumber as any;

      return c.json(
        {
          success: true,
          message: 'Phone number berhasil disinkronisasi.',
          data: responseData,
        },
        200
      );
    } catch (error: any) {
      console.error('Sync phone number error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Terjadi kesalahan saat sinkronisasi.',
        },
        500
      );
    }
  }

  /**
   * Test phone number connection
   */
  static async testConnection(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      // Test connection by getting phone info
      const isValid = await WhatsAppService.verifyCredentials(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken
      );

      if (!isValid) {
        return c.json(
          {
            success: false,
            message: 'Koneksi gagal. Access token mungkin sudah expired atau tidak valid.',
          },
          400
        );
      }

      return c.json(
        {
          success: true,
          message: 'Koneksi berhasil! Phone number aktif dan siap digunakan.',
        },
        200
      );
    } catch (error: any) {
      console.error('Test connection error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Terjadi kesalahan saat test koneksi.',
        },
        500
      );
    }
  }

  /**
   * Request verification code
   */
  static async requestVerificationCode(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      const { codeMethod, language } = body;

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const result = await WhatsAppService.requestVerificationCode(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        codeMethod || 'SMS',
        language || 'en_US'
      );

      return c.json(
        {
          success: true,
          message: 'Verification code berhasil dikirim.',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('Request verification code error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mengirim verification code.',
        },
        500
      );
    }
  }

  /**
   * Verify code
   */
  static async verifyPhoneCode(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      const { code } = body;

      if (!code) {
        return c.json(
          {
            success: false,
            message: 'Verification code harus disediakan.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const result = await WhatsAppService.verifyCode(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        code
      );

      return c.json(
        {
          success: true,
          message: 'Verification berhasil!',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('Verify code error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal memverifikasi code.',
        },
        500
      );
    }
  }

  /**
   * Set two-step verification PIN
   */
  static async setTwoStepVerification(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      const { pin } = body;

      if (!pin || pin.length !== 6) {
        return c.json(
          {
            success: false,
            message: 'PIN harus 6 digit.',
          },
          400
        );
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const result = await WhatsAppService.setTwoStepVerificationCode(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        pin
      );

      return c.json(
        {
          success: true,
          message: 'Two-step verification berhasil diset.',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('Set two-step verification error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mengatur two-step verification.',
        },
        500
      );
    }
  }

  /**
   * Get display name status
   */
  static async getDisplayNameStatus(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const result = await WhatsAppService.getDisplayNameStatus(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken
      );

      // Extract the business profile data from the nested structure
      const businessProfile = result?.data?.[0] || result;

      return c.json(
        {
          success: true,
          data: businessProfile,
        },
        200
      );
    } catch (error: any) {
      console.error('Get display name status error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal mendapatkan status display name.',
        },
        500
      );
    }
  }

  /**
   * Update business profile
   */
  static async updateBusinessProfile(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const profileData: any = {};

      if (body.about) profileData.about = body.about;
      if (body.address) profileData.address = body.address;
      if (body.description) profileData.description = body.description;
      if (body.email) profileData.email = body.email;
      if (body.vertical) profileData.vertical = body.vertical;
      if (body.websites && Array.isArray(body.websites)) {
        profileData.websites = body.websites;
      }

      const result = await WhatsAppService.updateBusinessProfile(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        profileData
      );

      return c.json(
        {
          success: true,
          message: 'Business profile berhasil diupdate!',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('Update business profile error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal update business profile.',
        },
        500
      );
    }
  }

  /**
   * Upload and set profile picture
   */
  static async uploadProfilePicture(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      // Get uploaded file from request
      const body = await c.req.parseBody();
      const file = body['file'];

      if (!file || typeof file === 'string') {
        return c.json(
          {
            success: false,
            message: 'File gambar harus disediakan.',
          },
          400
        );
      }

      // Validate file type (only images)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return c.json(
          {
            success: false,
            message: 'Hanya file gambar (JPEG, PNG) yang diperbolehkan.',
          },
          400
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return c.json(
          {
            success: false,
            message: 'Ukuran file maksimal 5MB.',
          },
          400
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload media to WhatsApp
      const uploadResult = await WhatsAppService.uploadMedia(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        buffer,
        file.name,
        file.type
      );

      if (!uploadResult || !uploadResult.h) {
        return c.json(
          {
            success: false,
            message: 'Gagal upload gambar ke WhatsApp.',
          },
          500
        );
      }

      // Update business profile with new profile picture handle
      const updateResult = await WhatsAppService.updateBusinessProfile(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken,
        {
          profile_picture_handle: uploadResult.h,
        }
      );

      return c.json(
        {
          success: true,
          message: 'Foto profil berhasil diupdate!',
          data: {
            uploadResult,
            updateResult,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Upload profile picture error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal upload foto profil.',
        },
        500
      );
    }
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(c: Context) {
    try {
      const { id } = c.req.param();

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id } });

      if (!phoneNumber) {
        return c.json(
          {
            success: false,
            message: 'Phone number tidak ditemukan.',
          },
          404
        );
      }

      const result = await WhatsAppService.deleteProfilePicture(
        phoneNumber.phoneNumberId,
        phoneNumber.accessToken
      );

      return c.json(
        {
          success: true,
          message: 'Foto profil berhasil dihapus!',
          data: result,
        },
        200
      );
    } catch (error: any) {
      console.error('Delete profile picture error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Gagal menghapus foto profil.',
        },
        500
      );
    }
  }
}

// Export wrapped controller dengan permission checks
export const PhoneNumberControllerWithPermissions = withPermissions(
  PhoneNumberController,
  PhoneNumberController.permissions
);
