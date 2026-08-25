import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _send_email_smtp(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
):
    """
    Send an email via Gmail SMTP (or configured SMTP server).
    Fails gracefully without crashing main execution thread.
    """
    if not settings.smtp_user or not settings.smtp_password:
        print(f"[EMAIL SERVICE] Skipping email to {to_email}: SMTP credentials not configured.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.app_name} <{settings.smtp_user}>"
        msg["To"] = to_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")

        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, to_email, msg.as_string())

        print(f"[EMAIL SERVICE] Successfully sent email to {to_email}: {subject}")
    except Exception as exc:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {exc}")


def send_email_background(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
):
    """
    Spawns a background thread to send email without blocking the API request.
    """
    thread = threading.Thread(
        target=_send_email_smtp,
        args=(to_email, subject, body_html, body_text),
        daemon=True,
    )
    thread.start()


# ============================================================
# LOGIN NOTIFICATION EMAIL
# ============================================================

def send_login_notification_email(
    to_email: str,
    full_name: str = "",
):
    subject = f"Security Alert: New Sign-in to {settings.app_name}"
    
    greeting_name = full_name if full_name else "User"

    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f4f5f7; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Successful Sign-in Alert</h2>
          <p>Hello <strong>{greeting_name}</strong>,</p>
          <p>We noticed a successful sign-in to your <strong>{settings.app_name}</strong> account associated with <code>{to_email}</code>.</p>
          <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #3730a3; font-weight: bold;">If this was you, no action is needed.</p>
          </div>
          <p>If you did not initiate this login, please change your password immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">Sent by {settings.app_name}</p>
        </div>
      </body>
    </html>
    """

    body_text = (
        f"Hello {greeting_name},\n\n"
        f"We noticed a successful sign-in to your {settings.app_name} account ({to_email}).\n"
        f"If this was you, no action is needed.\n\n"
        f"If you did not initiate this login, please change your password immediately."
    )

    send_email_background(to_email, subject, body_html, body_text)


# ============================================================
# WORKSPACE INVITATION EMAIL WITH TOKEN
# ============================================================

def send_invitation_email(
    to_email: str,
    workspace_name: str,
    token: str,
    inviter_name: str = "A team member",
):
    invitation_url = f"{settings.frontend_url}/accept-invitation?token={token}"
    subject = f"You are invited to join workspace '{workspace_name}'"

    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f4f5f7; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Workspace Invitation</h2>
          <p>Hello,</p>
          <p><strong>{inviter_name}</strong> has invited you to join the workspace <strong>'{workspace_name}'</strong> on {settings.app_name}.</p>
          <p>To accept your invitation and join the workspace, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{invitation_url}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 13px; color: #666;">Or copy and paste this token URL into your browser:</p>
          <p style="font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px; color: #334155;">
            {invitation_url}
          </p>
          <p style="font-size: 13px; color: #666;">Invitation Token: <code>{token}</code></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">Sent by {settings.app_name}</p>
        </div>
      </body>
    </html>
    """

    body_text = (
        f"Hello,\n\n"
        f"{inviter_name} has invited you to join workspace '{workspace_name}' on {settings.app_name}.\n\n"
        f"Accept Invitation Link:\n{invitation_url}\n\n"
        f"Invitation Token:\n{token}"
    )

    send_email_background(to_email, subject, body_html, body_text)
