import os
import csv
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

# ─── CSV Logging Automation ─────────────────────────────────────────────

CSV_FILE = "leads_log.csv"
CSV_HEADERS = ["timestamp", "name", "email", "phone", "message", "status"]


def log_lead_to_csv(name: str, email: str, phone: str, message: str):
    """Automation: Log every new lead to a CSV file for backup/analytics."""
    try:
        file_exists = os.path.isfile(CSV_FILE)
        with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(CSV_HEADERS)
            writer.writerow([
                datetime.now().isoformat(),
                name,
                email,
                phone,
                message,
                "new"
            ])
        logger.info(f"Lead logged to CSV: {email}")
    except Exception as e:
        logger.error(f"CSV logging failed: {e}")


# ─── Email Notification Automation ──────────────────────────────────────

def send_email(name: str, email: str, phone: str, message: str):
    """Automation: Send email notification when a new lead is captured."""
    sender = os.getenv("SMTP_EMAIL")
    password = os.getenv("SMTP_PASSWORD")

    if not sender or not password:
        logger.warning("SMTP credentials not configured — skipping email notification.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🚀 New Lead Captured: {name}"
        msg["From"] = sender
        msg["To"] = sender

        # Plain text fallback
        text = f"""
New Lead Received!

Name:    {name}
Email:   {email}
Phone:   {phone}
Message: {message}

Captured at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """.strip()

        # Rich HTML email
        html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f23; color: #e2e8f0; padding: 30px;">
            <div style="max-width: 500px; margin: auto; background: linear-gradient(135deg, #1e1e3a, #2a2a4a); border-radius: 16px; padding: 30px; border: 1px solid rgba(139,92,246,0.3);">
                <h1 style="color: #a78bfa; margin-top: 0; font-size: 22px;">🚀 New Lead Captured</h1>
                <hr style="border: none; border-top: 1px solid rgba(139,92,246,0.2); margin: 20px 0;">
                <table style="width: 100%; font-size: 15px;">
                    <tr><td style="color: #94a3b8; padding: 6px 0;">Name</td><td style="color: #f1f5f9; font-weight: 600;">{name}</td></tr>
                    <tr><td style="color: #94a3b8; padding: 6px 0;">Email</td><td style="color: #f1f5f9;">{email}</td></tr>
                    <tr><td style="color: #94a3b8; padding: 6px 0;">Phone</td><td style="color: #f1f5f9;">{phone}</td></tr>
                </table>
                <div style="margin-top: 16px; padding: 14px; background: rgba(139,92,246,0.1); border-radius: 10px; border-left: 3px solid #a78bfa;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Message</p>
                    <p style="margin: 6px 0 0; color: #e2e8f0;">{message}</p>
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Captured at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} via AI Business Assistant</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)
        server.quit()

        logger.info(f"Email notification sent for lead: {email}")
        return True

    except Exception as e:
        logger.error(f"Email notification failed: {e}")
        return False
