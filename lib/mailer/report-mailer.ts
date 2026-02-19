import nodemailer from "nodemailer";

function createTransport() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? "587"),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

export async function sendReportEmail(
    recipients: string[],
    subject: string,
    filename: string,
    buffer: Buffer
): Promise<void> {
    const transporter = createTransport();
    await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "dcim@company.com",
        to: recipients.join(", "),
        subject,
        text: `Please find attached the scheduled report: ${filename}`,
        attachments: [
            {
                filename,
                content: buffer,
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        ],
    });
}
