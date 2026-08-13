import { Milestone } from '../types';

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export class GoogleCalendarService {
  /**
   * Syncs a milestone event to Google Calendar API
   */
  public static async createOrUpdateCalendarEvent(
    accessToken: string,
    milestone: Milestone
  ): Promise<string> {
    const eventData = this.buildGoogleCalendarEventData(milestone);

    if (milestone.googleCalendarEventId) {
      // Update existing
      const updateUrl = `${CALENDAR_API_URL}/${milestone.googleCalendarEventId}`;
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Google Calendar update failed: ${err}`);
      }

      const res = await response.json();
      return res.id;
    } else {
      // Create new
      const response = await fetch(CALENDAR_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Google Calendar event creation failed: ${err}`);
      }

      const res = await response.json();
      return res.id;
    }
  }

  /**
   * Deletes an event from Google Calendar API
   */
  public static async deleteCalendarEvent(
    accessToken: string,
    eventId: string
  ): Promise<void> {
    const url = `${CALENDAR_API_URL}/${eventId}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Constructs payload for Google Calendar REST API
   */
  private static buildGoogleCalendarEventData(milestone: Milestone) {
    const dateToUse = milestone.targetDate || milestone.startDate;
    const startDate = new Date(dateToUse);
    // 1-hour duration event
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const description = `${milestone.description}\n\n[SmartTrack - Plan2Milestone]\nType: ${milestone.type}\nCategory: ${milestone.category}`;

    const payload: any = {
      summary: `[SmartTrack] ${milestone.title}`,
      description: description,
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 },      // 1 hour before
        ],
      },
    };

    // Add recurrence rule if repeating
    if (milestone.type === 'repeating' && milestone.repeatInterval) {
      let rrule = '';
      switch (milestone.repeatInterval) {
        case 'daily':
          rrule = 'RRULE:FREQ=DAILY';
          break;
        case 'weekly':
          rrule = 'RRULE:FREQ=WEEKLY';
          break;
        case 'monthly':
          rrule = 'RRULE:FREQ=MONTHLY';
          break;
        case 'quarterly':
          rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=3';
          break;
        case 'yearly':
          rrule = 'RRULE:FREQ=YEARLY';
          break;
        case 'custom':
          if (milestone.customRepeatDays) {
            rrule = `RRULE:FREQ=DAILY;INTERVAL=${milestone.customRepeatDays}`;
          }
          break;
      }
      if (rrule) {
        payload.recurrence = [rrule];
      }
    }

    return payload;
  }

  /**
   * Generates direct Google Calendar Web Template URL for instant browser addition
   */
  public static generateGoogleCalendarWebLink(milestone: Milestone): string {
    const targetDateObj = new Date(milestone.targetDate || milestone.startDate);
    const endDateObj = new Date(targetDateObj.getTime() + 60 * 60 * 1000);

    const formatGCalDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const dates = `${formatGCalDate(targetDateObj)}/${formatGCalDate(endDateObj)}`;
    const title = encodeURIComponent(`[SmartTrack] ${milestone.title}`);
    const details = encodeURIComponent(
      `${milestone.description}\n\nCategory: ${milestone.category}\nTracked with SmartTrack - Plan2Milestone`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  }

  /**
   * Generates standard .ics (iCalendar) content for Apple Calendar / Mac / iOS / Outlook
   */
  public static generateIcsContent(milestone: Milestone): string {
    const dateToUse = new Date(milestone.targetDate || milestone.startDate);
    const endDate = new Date(dateToUse.getTime() + 60 * 60 * 1000);

    const formatIcsDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const nowStr = formatIcsDate(new Date());
    const startStr = formatIcsDate(dateToUse);
    const endStr = formatIcsDate(endDate);

    let rruleStr = '';
    if (milestone.type === 'repeating' && milestone.repeatInterval) {
      switch (milestone.repeatInterval) {
        case 'daily':
          rruleStr = 'RRULE:FREQ=DAILY\n';
          break;
        case 'weekly':
          rruleStr = 'RRULE:FREQ=WEEKLY\n';
          break;
        case 'monthly':
          rruleStr = 'RRULE:FREQ=MONTHLY\n';
          break;
        case 'quarterly':
          rruleStr = 'RRULE:FREQ=MONTHLY;INTERVAL=3\n';
          break;
        case 'yearly':
          rruleStr = 'RRULE:FREQ=YEARLY\n';
          break;
        case 'custom':
          if (milestone.customRepeatDays) {
            rruleStr = `RRULE:FREQ=DAILY;INTERVAL=${milestone.customRepeatDays}\n`;
          }
          break;
      }
    }

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SmartTrack//Plan2Milestone App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:smarttrack-${milestone.id}@plan2milestone`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:[SmartTrack] ${milestone.title}`,
      `DESCRIPTION:${milestone.description.replace(/\n/g, '\\n')}`,
      rruleStr ? rruleStr.trim() : '',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'TRIGGER:-PT1D', // 1 day before
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean);

    return icsLines.join('\r\n');
  }

  /**
   * Triggers download of .ics file for Apple Calendar
   */
  public static downloadIcsFile(milestone: Milestone): void {
    const icsContent = this.generateIcsContent(milestone);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = milestone.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `smarttrack_${sanitizedTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
