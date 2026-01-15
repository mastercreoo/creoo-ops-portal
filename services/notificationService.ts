
interface NotificationPayload {
  requestType: string;
  event: string;
  id: string;
  requester: { userId: string; name: string; email: string };
  fields: Record<string, any>;
  status: string;
  approver?: { userId: string; name: string; email: string } | null;
  timestamp: string;
  deepLink: string;
}

const WEBHOOK_URLS = {
  TOOL_REQUEST: 'https://n8n.yourdomain.com/webhook/tool-request',
  LEAVE_REQUEST: 'https://n8n.yourdomain.com/webhook/leave-request',
  STATUS_UPDATE: 'https://n8n.yourdomain.com/webhook/status-update',
  FINANCE_EVENT: 'https://n8n.yourdomain.com/webhook/finance-event',
};

export const notifyN8N = async (type: keyof typeof WEBHOOK_URLS, payload: NotificationPayload) => {
  // In a Slack-first approval model, this payload triggers an interactive message with buttons
  console.log(`[SLACK/N8N Notification: ${type}]`, payload);
  try {
    // Real fetch logic (uncomment in production)
    /*
    await fetch(WEBHOOK_URLS[type], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    */
  } catch (error) {
    console.error('Failed to notify n8n:', error);
  }
};
