import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Message } from '../models/Message';
import { Contact } from '../models/Contact';
import { WebhookLog } from '../models/WebhookLog';
import { Between } from 'typeorm';

export class DashboardController {
  static async getStats(c: Context) {
    try {
      const messageRepo = AppDataSource.getRepository(Message);
      const contactRepo = AppDataSource.getRepository(Contact);
      const logRepo = AppDataSource.getRepository(WebhookLog);

      const phoneNumberId = c.req.query('phoneNumberId');

      // Date ranges
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // Build where conditions based on phoneNumberId filter
      const messageWhere: any = {};
      const contactWhere: any = {};
      if (phoneNumberId) {
        messageWhere.phoneNumberId = phoneNumberId;
        contactWhere.phoneNumberId = phoneNumberId;
      }

      // 1. Basic Counts
      const totalMessages = await messageRepo.count({ where: messageWhere });
      const totalContacts = await contactRepo.count({ where: contactWhere });

      const messagesTodayIncoming = await messageRepo.count({
        where: {
          ...messageWhere,
          createdAt: Between(todayStart, now),
          direction: 'incoming'
        }
      });

      const messagesTodayOutgoing = await messageRepo.count({
        where: {
          ...messageWhere,
          createdAt: Between(todayStart, now),
          direction: 'outgoing'
        }
      });

      // 2. Message Volume by Date (Last 30 Days)
      const chartQuery = messageRepo
        .createQueryBuilder('message')
        .select("DATE(message.created_at)", "date")
        .addSelect("SUM(CASE WHEN message.direction = 'incoming' THEN 1 ELSE 0 END)", "incoming")
        .addSelect("SUM(CASE WHEN message.direction = 'outgoing' THEN 1 ELSE 0 END)", "outgoing")
        .where("message.created_at >= :startDate", { startDate: thirtyDaysAgo });

      if (phoneNumberId) {
        chartQuery.andWhere("message.phone_number_id = :phoneNumberId", { phoneNumberId });
      }

      const stats = await chartQuery
        .groupBy("DATE(message.created_at)")
        .orderBy("date", "ASC")
        .getRawMany();

      return c.json({
        success: true,
        data: {
          counts: {
            totalMessages,
            totalContacts,
            messagesToday: {
              total: messagesTodayIncoming + messagesTodayOutgoing,
              incoming: messagesTodayIncoming,
              outgoing: messagesTodayOutgoing
            },
          },
          chart: stats.map(s => ({
            date: typeof s.date === 'string' ? s.date.split('T')[0] : s.date, // Handle potential Date object or string
            incoming: parseInt(s.incoming),
            outgoing: parseInt(s.outgoing)
          }))
        }
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      return c.json({
        success: false,
        message: 'Failed to fetch dashboard stats'
      }, 500);
    }
  }
}
