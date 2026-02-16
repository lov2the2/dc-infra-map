import type { AlertHistory, NotificationChannel } from "@/types/alerts";

// Send Slack webhook notification
async function notifySlack(channel: NotificationChannel, alert: Omit<AlertHistory, "id" | "createdAt">): Promise<void> {
    const webhookUrl = channel.config.webhookUrl;
    if (!webhookUrl) {
        console.warn(`Slack channel "${channel.name}" has no webhookUrl configured`);
        return;
    }

    const severityEmoji: Record<string, string> = {
        critical: ":red_circle:",
        warning: ":warning:",
        info: ":information_source:",
    };

    const payload = {
        text: `${severityEmoji[alert.severity] ?? ""} *DCIM Alert [${alert.severity.toUpperCase()}]*`,
        attachments: [
            {
                color: alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "warning" : "good",
                fields: [
                    { title: "Message", value: alert.message, short: false },
                    { title: "Resource", value: `${alert.resourceType}: ${alert.resourceName}`, short: true },
                    { title: "Severity", value: alert.severity, short: true },
                ],
                ts: Math.floor(Date.now() / 1000),
            },
        ],
    };

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error(`Failed to send Slack notification to channel "${channel.name}":`, err);
    }
}

// Mock email notification (logs only — no real SMTP)
function notifyEmail(channel: NotificationChannel, alert: Omit<AlertHistory, "id" | "createdAt">): void {
    const recipients = channel.config.emailAddresses ?? "no-reply@example.com";
    console.info(
        `[EMAIL MOCK] To: ${recipients} | Subject: DCIM Alert [${alert.severity.toUpperCase()}] | Body: ${alert.message}`
    );
}

// Dispatch notifications for a triggered alert to the given channels
export async function dispatchNotifications(
    channels: NotificationChannel[],
    alert: Omit<AlertHistory, "id" | "createdAt">,
): Promise<void> {
    await Promise.allSettled(
        channels.map((channel) => {
            if (!channel.enabled) return Promise.resolve();
            switch (channel.channelType) {
                case "slack_webhook":
                    return notifySlack(channel, alert);
                case "email":
                    notifyEmail(channel, alert);
                    return Promise.resolve();
                case "in_app":
                    // In-app notifications are inserted to alertHistory by the evaluate service
                    return Promise.resolve();
                default:
                    return Promise.resolve();
            }
        })
    );
}
