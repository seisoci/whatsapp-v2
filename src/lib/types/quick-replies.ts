/**
 * Quick Replies Types
 * Type definitions for quick replies functionality
 */

export interface QuickReply {
  id: string;
  userId: string;
  shortcut: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}
