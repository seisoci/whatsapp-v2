import { Context } from 'hono';
import { AppDataSource } from '../config/database';

/**
 * Resolve the date range from query params.
 *
 * Priority:
 *   1. `startDate` + `endDate` (YYYY-MM-DD or ISO string) — explicit range.
 *   2. `days` (1..365)                                    — last N days from today.
 *   3. Default: last 30 days.
 *
 * `startDate` is anchored to 00:00:00 UTC of the given day; `endDate` is
 * pushed to 23:59:59.999 of the given day so the inclusive end-of-day is
 * captured.
 */
function resolveDateRange(c: Context): { startDate: Date; endDate: Date } {
  const startStr = c.req.query('startDate');
  const endStr = c.req.query('endDate');

  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
  }

  const days = Math.min(
    Math.max(parseInt(c.req.query('days') || '30'), 1),
    365,
  );
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

export class AnalyticsController {
  /**
   * GET /analytics/messages-over-time
   * Pesan masuk & keluar per hari
   */
  static async getMessagesOverTime(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let phoneFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        phoneFilter = `AND phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT
          DATE(created_at) AS date,
          SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END)::int AS incoming,
          SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END)::int AS outgoing
        FROM messages
        WHERE created_at >= $1
          AND created_at <= $2
          ${phoneFilter}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      const data = await AppDataSource.query(sql, params);

      return c.json({
        success: true,
        data: data.map((r: any) => ({
          date: typeof r.date === 'string' ? r.date.split('T')[0] : String(r.date).split('T')[0],
          incoming: r.incoming ?? 0,
          outgoing: r.outgoing ?? 0,
        })),
      });
    } catch (error: any) {
      console.error('[Analytics] getMessagesOverTime error:', error);
      return c.json({ success: false, message: 'Failed to fetch messages over time' }, 500);
    }
  }

  /**
   * GET /analytics/message-status
   * Breakdown status pesan outgoing
   */
  static async getMessageStatus(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let phoneFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        phoneFilter = `AND phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT
          status,
          COUNT(*)::int AS count
        FROM messages
        WHERE direction = 'outgoing'
          AND status IS NOT NULL
          AND created_at >= $1
          AND created_at <= $2
          ${phoneFilter}
        GROUP BY status
        ORDER BY count DESC
      `;

      const data = await AppDataSource.query(sql, params);

      return c.json({ success: true, data });
    } catch (error: any) {
      console.error('[Analytics] getMessageStatus error:', error);
      return c.json({ success: false, message: 'Failed to fetch message status' }, 500);
    }
  }

  /**
   * GET /analytics/top-templates
   * Top 10 template paling sering digunakan
   */
  static async getTopTemplates(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let msgFilter = '';
      let queueFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        msgFilter = `AND phone_number_id = $${params.length}`;
        queueFilter = `AND phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT template_name AS "templateName", SUM(cnt)::int AS count
        FROM (
          SELECT template_name, COUNT(*) AS cnt
          FROM messages
          WHERE template_name IS NOT NULL
            AND created_at >= $1
            AND created_at <= $2
            ${msgFilter}
          GROUP BY template_name
          UNION ALL
          SELECT template_name, COUNT(*) AS cnt
          FROM message_queues
          WHERE template_name IS NOT NULL
            AND created_at >= $1
            AND created_at <= $2
            ${queueFilter}
          GROUP BY template_name
        ) sub
        GROUP BY template_name
        ORDER BY count DESC
        LIMIT 10
      `;

      const data = await AppDataSource.query(sql, params);

      return c.json({ success: true, data });
    } catch (error: any) {
      console.error('[Analytics] getTopTemplates error:', error);
      return c.json({ success: false, message: 'Failed to fetch top templates' }, 500);
    }
  }

  /**
   * GET /analytics/response-time
   * Statistik waktu respon agen dalam menit
   */
  static async getResponseTime(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let incomingFilter = '';
      let outgoingFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        incomingFilter = `AND i.phone_number_id = $${params.length}`;
        outgoingFilter = `AND o2.phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT
          ROUND(AVG(diff_minutes)::numeric, 2)                                     AS "avgMinutes",
          ROUND(MIN(diff_minutes)::numeric, 2)                                     AS "minMinutes",
          ROUND(MAX(diff_minutes)::numeric, 2)                                     AS "maxMinutes",
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY diff_minutes)::numeric, 2) AS "medianMinutes"
        FROM (
          SELECT
            EXTRACT(EPOCH FROM (o.created_at - i.created_at)) / 60.0 AS diff_minutes
          FROM messages i
          JOIN LATERAL (
            SELECT created_at
            FROM messages o2
            WHERE o2.contact_id = i.contact_id
              AND o2.direction = 'outgoing'
              AND o2.created_at > i.created_at
              ${outgoingFilter}
            ORDER BY o2.created_at ASC
            LIMIT 1
          ) o ON true
          WHERE i.direction = 'incoming'
            AND i.created_at >= $1
            AND i.created_at <= $2
            ${incomingFilter}
        ) sub
        WHERE diff_minutes < 1440
      `;

      const rows = await AppDataSource.query(sql, params);
      const row = rows[0] ?? null;

      return c.json({
        success: true,
        data: row && row.avgMinutes != null
          ? {
              avgMinutes: parseFloat(row.avgMinutes),
              minMinutes: parseFloat(row.minMinutes),
              maxMinutes: parseFloat(row.maxMinutes),
              medianMinutes: parseFloat(row.medianMinutes),
            }
          : null,
      });
    } catch (error: any) {
      console.error('[Analytics] getResponseTime error:', error);
      return c.json({ success: false, message: 'Failed to fetch response time' }, 500);
    }
  }

  /**
   * GET /analytics/messages-per-agent
   * Jumlah pesan outgoing per agen
   */
  static async getMessagesPerAgent(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let phoneFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        phoneFilter = `AND m.phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT
          u.id AS "userId",
          u.username,
          COUNT(m.id)::int AS count
        FROM messages m
        JOIN users u ON u.id = m.user_id
        WHERE m.direction = 'outgoing'
          AND m.user_id IS NOT NULL
          AND m.created_at >= $1
          AND m.created_at <= $2
          ${phoneFilter}
        GROUP BY u.id, u.username
        ORDER BY count DESC
      `;

      const data = await AppDataSource.query(sql, params);

      return c.json({ success: true, data });
    } catch (error: any) {
      console.error('[Analytics] getMessagesPerAgent error:', error);
      return c.json({ success: false, message: 'Failed to fetch messages per agent' }, 500);
    }
  }

  /**
   * GET /analytics/contact-growth
   * Pertumbuhan kontak baru per hari + kumulatif
   */
  static async getContactGrowth(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let phoneFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        phoneFilter = `AND phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT
          DATE(created_at) AS date,
          COUNT(*)::int AS "newContacts",
          SUM(COUNT(*)) OVER (ORDER BY DATE(created_at))::int AS cumulative
        FROM contacts
        WHERE created_at >= $1
          AND created_at <= $2
          ${phoneFilter}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      const data = await AppDataSource.query(sql, params);

      return c.json({
        success: true,
        data: data.map((r: any) => ({
          date: typeof r.date === 'string' ? r.date.split('T')[0] : String(r.date).split('T')[0],
          newContacts: r.newContacts ?? 0,
          cumulative: r.cumulative ?? 0,
        })),
      });
    } catch (error: any) {
      console.error('[Analytics] getContactGrowth error:', error);
      return c.json({ success: false, message: 'Failed to fetch contact growth' }, 500);
    }
  }

  /**
   * GET /analytics/top-active-contacts
   * Top 50 kontak paling aktif dalam 30 hari terakhir
   * Dihitung dari jumlah hari unik yang contact mengirim pesan masuk
   */
  static async getTopActiveContacts(c: Context) {
    try {
      const phoneNumberId = c.req.query('phoneNumberId');
      const { startDate, endDate } = resolveDateRange(c);

      const params: any[] = [startDate, endDate];
      let phoneFilter = '';
      if (phoneNumberId) {
        params.push(phoneNumberId);
        phoneFilter = `AND m.phone_number_id = $${params.length}`;
      }

      const sql = `
        SELECT
          c.id           AS "contactId",
          c.wa_id        AS "waId",
          COALESCE(c.profile_name, c.wa_id) AS "profileName",
          COUNT(DISTINCT DATE(m.created_at))::int AS "activeDays"
        FROM messages m
        JOIN contacts c ON c.id = m.contact_id
        WHERE m.direction = 'incoming'
          AND m.created_at >= $1
          AND m.created_at <= $2
          ${phoneFilter}
        GROUP BY c.id, c.wa_id, c.profile_name
        ORDER BY "activeDays" DESC
        LIMIT 50
      `;

      const data = await AppDataSource.query(sql, params);

      return c.json({ success: true, data });
    } catch (error: any) {
      console.error('[Analytics] getTopActiveContacts error:', error);
      return c.json({ success: false, message: 'Failed to fetch top active contacts' }, 500);
    }
  }
}
