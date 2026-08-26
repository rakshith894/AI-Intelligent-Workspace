"""
Email service — Gmail SMTP (primary) with Resend API fallback.

Delivery priority:
  1. Gmail SMTP (App Password) → sends to ANY recipient email address worldwide
  2. Resend API                → fallback if SMTP not configured
"""

import smtplib
import threading
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid

from app.core.config import settings


# ==============================================================
# HELPERS — brand colours / shared HTML fragments
# ==============================================================

_BRAND_COLOR = "#4f46e5"
_BRAND_NAME = settings.app_name


def _html_wrap(inner_html: str, preheader: str = "") -> str:
    """Wrap inner HTML in a premium on-brand email shell."""
    year = datetime.utcnow().year
    preheader_tag = (
        f'<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">'
        f"{preheader}&nbsp;" + "&#847;" * 80 + "</div>"
        if preheader
        else ""
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{_BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#06060a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  {preheader_tag}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER LOGO BAR -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:14px;padding:10px 18px;">
                    <span style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">✦ {_BRAND_NAME}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#0f1117;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 36px;position:relative;">
              <!-- Top glow line -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,{_BRAND_COLOR}55,transparent);margin-bottom:32px;"></div>
              {inner_html}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#475569;">
                Sent by <strong style="color:#6366f1;">{_BRAND_NAME}</strong> · {year}
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:#334155;">
                You received this email because you have an account on {_BRAND_NAME}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _button(url: str, label: str, color: str = _BRAND_COLOR) -> str:
    return (
        f'<div style="text-align:center;margin:28px 0;">'
        f'<a href="{url}" '
        f'style="background:{color};color:#ffffff;padding:14px 32px;'
        f"text-decoration:none;font-weight:700;font-size:14px;"
        f'border-radius:10px;display:inline-block;letter-spacing:0.2px;">'
        f"{label}</a></div>"
    )


def _heading(text: str) -> str:
    return f'<h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f8fafc;">{text}</h2>'


def _para(text: str, muted: bool = False) -> str:
    color = "#94a3b8" if muted else "#cbd5e1"
    return f'<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:{color};">{text}</p>'


def _info_box(text: str, bg: str = "#1e1b4b", border: str = "#4f46e5") -> str:
    return (
        f'<div style="background:{bg};border-left:4px solid {border};'
        f'border-radius:8px;padding:14px 18px;margin:20px 0;">'
        f'<p style="margin:0;font-size:13px;color:#c7d2fe;">{text}</p></div>'
    )


def _divider() -> str:
    return '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;" />'


# ==============================================================
# CORE SEND — SMTP primary → Resend fallback
# ==============================================================

def _send_via_smtp(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
) -> bool:
    """Send via Gmail SMTP with App Password. Returns True on success."""
    if not settings.smtp_user or not settings.smtp_password:
        print("[EMAIL/SMTP] Skipping — SMTP credentials not configured.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.app_name} <{settings.smtp_user}>"
        msg["To"] = to_email
        msg["Reply-To"] = settings.smtp_user
        msg["Date"] = formatdate(localtime=False)
        msg["Message-ID"] = make_msgid(domain="gmail.com")
        msg["MIME-Version"] = "1.0"
        msg["X-Mailer"] = f"{settings.app_name} v{settings.app_version}"
        msg["X-Priority"] = "1"

        # Plain text part first, then HTML (RFC-compliant order)
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, [to_email], msg.as_string())

        print(f"[EMAIL/SMTP] [OK] Sent to {to_email}: {subject}")
        return True

    except smtplib.SMTPAuthenticationError as exc:
        print(f"[EMAIL/SMTP] [FAIL] AUTH FAILED - check Gmail App Password: {exc}")
        return False
    except smtplib.SMTPRecipientsRefused as exc:
        print(f"[EMAIL/SMTP] [FAIL] Recipient refused ({to_email}): {exc}")
        return False
    except Exception as exc:
        print(f"[EMAIL/SMTP ERROR] [FAIL] {exc} - falling back to Resend")
        return False


def _send_via_resend(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
) -> bool:
    """Send via Resend API. Returns True on success."""
    if not settings.resend_api_key:
        return False

    try:
        import resend  # type: ignore

        resend.api_key = settings.resend_api_key
        from_address = (
            settings.resend_from_email
            if settings.resend_from_email
            else f"noreply@{settings.resend_from_domain}"
        )

        resend.Emails.send(
            {
                "from": f"{settings.app_name} <{from_address}>",
                "to": [to_email],
                "subject": subject,
                "html": body_html,
                "text": body_text,
            }
        )

        print(f"[EMAIL/RESEND] [OK] Sent to {to_email}: {subject}")
        return True

    except Exception as exc:
        print(f"[EMAIL/RESEND ERROR] [FAIL] {exc}")
        return False


def _dispatch_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
) -> None:
    """
    Main email dispatcher.
    Tries Gmail SMTP first (delivers to ANY email address).
    Falls back to Resend if SMTP is not configured or fails.
    """
    if settings.smtp_user and settings.smtp_password:
        if _send_via_smtp(to_email, subject, body_html, body_text):
            return

    _send_via_resend(to_email, subject, body_html, body_text)


# Backwards-compatibility alias
_send_email_smtp = _dispatch_email


def send_email_background(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
) -> None:
    """Send email asynchronously (daemon thread) so it never blocks the API."""
    thread = threading.Thread(
        target=_dispatch_email,
        args=(to_email, subject, body_html, body_text),
        daemon=True,
        name=f"email-{to_email[:20]}",
    )
    thread.start()


# Alias used by legacy callers (e.g. request_password_reset)
def send_email(
    to_email: str,
    subject: str,
    body: str,
) -> None:
    """Legacy alias — wraps send_email_background with plain-text body."""
    send_email_background(
        to_email=to_email,
        subject=subject,
        body_html=f"<pre style='font-family:sans-serif;'>{body}</pre>",
        body_text=body,
    )


# ==============================================================
# WELCOME EMAIL — sent on successful registration
# ==============================================================

def send_welcome_email(
    to_email: str,
    full_name: str = "",
) -> None:
    greeting = full_name if full_name else "there"
    subject = f"Welcome to {settings.app_name} 🎉"

    inner = (
        _heading(f"Welcome aboard, {greeting}! 🚀")
        + _para(
            f"Your account on <strong style='color:#818cf8;'>{settings.app_name}</strong> "
            f"has been created successfully. You're now part of an intelligent workspace "
            f"designed to supercharge your team's productivity."
        )
        + _info_box(
            "💡 <strong>Get started:</strong> Create a workspace, invite your team, "
            "and let AI Copilot help you plan and prioritise tasks."
        )
        + _button(
            url=settings.frontend_url,
            label="Open My Workspace →",
        )
        + _divider()
        + _para(
            f"If you didn't create this account, please ignore this email.",
            muted=True,
        )
    )

    body_text = (
        f"Welcome to {settings.app_name}, {greeting}!\n\n"
        f"Your account has been created successfully.\n\n"
        f"Open your workspace: {settings.frontend_url}\n\n"
        f"If you didn't create this account, please ignore this email."
    )

    send_email_background(to_email, subject, _html_wrap(inner, preheader=f"Welcome to {settings.app_name}!"), body_text)


# ==============================================================
# LOGIN NOTIFICATION EMAIL
# ==============================================================

def send_login_notification_email(
    to_email: str,
    full_name: str = "",
) -> None:
    greeting = full_name if full_name else "User"
    subject = f"🔐 New sign-in to {settings.app_name}"
    now_str = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")

    inner = (
        _heading("Successful Sign-in Detected")
        + _para(f"Hello <strong style='color:#f8fafc;'>{greeting}</strong>,")
        + _para(
            f"We noticed a successful sign-in to your "
            f"<strong style='color:#818cf8;'>{settings.app_name}</strong> account "
            f"(<code style='background:#1e293b;padding:2px 6px;border-radius:4px;font-size:12px;'>{to_email}</code>)."
        )
        + _info_box(
            f"🕐 <strong>Sign-in time:</strong> {now_str}<br/>"
            f"✅ <strong>Status:</strong> Successful authentication",
            bg="#0f2a1a",
            border="#22c55e",
        )
        + _para(
            "If this was you, no action is needed. "
            "If you did <strong>not</strong> initiate this login, "
            "please change your password immediately.",
        )
        + _button(
            url=f"{settings.frontend_url}/settings",
            label="Go to Security Settings",
            color="#dc2626",
        )
        + _divider()
        + _para(
            "This is an automated security alert from your workspace.",
            muted=True,
        )
    )

    body_text = (
        f"Hello {greeting},\n\n"
        f"We noticed a successful sign-in to your {settings.app_name} account ({to_email}).\n"
        f"Sign-in time: {now_str}\n\n"
        f"If this was you, no action is needed.\n"
        f"If you did NOT initiate this login, please change your password immediately.\n\n"
        f"Security Settings: {settings.frontend_url}/settings"
    )

    send_email_background(
        to_email,
        subject,
        _html_wrap(inner, preheader="New sign-in detected on your account"),
        body_text,
    )


# ==============================================================
# PASSWORD RESET EMAIL
# ==============================================================

def send_password_reset_email(
    to_email: str,
    full_name: str,
    reset_token: str,
) -> None:
    greeting = full_name if full_name else "User"
    subject = f"🔑 Your Password Reset Code — {settings.app_name}"

    inner = (
        _heading("Reset Your Password")
        + _para(f"Hello <strong style='color:#f8fafc;'>{greeting}</strong>,")
        + _para(
            "You requested a password reset for your "
            f"<strong style='color:#818cf8;'>{settings.app_name}</strong> account. "
            "Use the code below to reset your password:"
        )
        + (
            '<div style="background:#1e1b4b;border:1px solid #4f46e5;border-radius:12px;'
            "padding:20px;text-align:center;margin:24px 0;\">"
            f'<p style="margin:0 0 4px;font-size:11px;color:#94a3b8;letter-spacing:0.1em;">YOUR RESET CODE</p>'
            f'<p style="margin:0;font-size:32px;font-weight:800;letter-spacing:8px;color:#a5b4fc;font-family:monospace;">'
            f"{reset_token}</p>"
            f'<p style="margin:8px 0 0;font-size:11px;color:#64748b;">Valid for this session only</p>'
            "</div>"
        )
        + _para("Enter this code in the password reset form along with your new password.")
        + _button(
            url=settings.frontend_url + "/login",
            label="Go to Login Page",
        )
        + _divider()
        + _para(
            "If you didn't request a password reset, you can safely ignore this email. "
            "Your account remains secure.",
            muted=True,
        )
    )

    body_text = (
        f"Hello {greeting},\n\n"
        f"You requested a password reset for your {settings.app_name} account ({to_email}).\n\n"
        f"Your Password Reset Code: {reset_token}\n\n"
        f"Enter this code in the password reset form along with your new password.\n\n"
        f"If you didn't request a password reset, you can safely ignore this email."
    )

    send_email_background(
        to_email,
        subject,
        _html_wrap(inner, preheader=f"Your password reset code is: {reset_token}"),
        body_text,
    )


# ==============================================================
# WORKSPACE INVITATION EMAIL
# ==============================================================

def send_invitation_email(
    to_email: str,
    workspace_name: str,
    token: str,
    inviter_name: str = "A team member",
) -> None:
    invitation_url = f"{settings.frontend_url}/invite/{token}"
    subject = f"✉️ You're invited to join '{workspace_name}' on {settings.app_name}"

    inner = (
        _heading("You've Been Invited! 🎉")
        + _para("Hello,")
        + _para(
            f"<strong style='color:#f8fafc;'>{inviter_name}</strong> has invited you to join the workspace "
            f"<strong style='color:#818cf8;'>{workspace_name}</strong> on "
            f"<strong style='color:#818cf8;'>{settings.app_name}</strong>. "
            f"Collaborate on projects, manage tasks, and boost productivity together."
        )
        + _button(url=invitation_url, label="Accept Invitation →")
        + _info_box(
            f"🔗 <strong>Or copy this link:</strong><br/>"
            f'<a href="{invitation_url}" style="color:#818cf8;word-break:break-all;font-size:12px;">'
            f"{invitation_url}</a>"
        )
        + _para(
            f"🎟 <strong>Invitation token:</strong> "
            f'<code style="background:#1e293b;padding:2px 8px;border-radius:4px;font-size:11px;color:#a5b4fc;">'
            f"{token}</code>",
        )
        + _divider()
        + _para(
            "This invitation expires in 7 days. "
            "If you don't have an account, you'll be prompted to create one.",
            muted=True,
        )
    )

    body_text = (
        f"Hello,\n\n"
        f"{inviter_name} has invited you to join workspace '{workspace_name}' on {settings.app_name}.\n\n"
        f"Accept Invitation: {invitation_url}\n\n"
        f"Invitation Token: {token}\n\n"
        f"This invitation expires in 7 days."
    )

    send_email_background(
        to_email,
        subject,
        _html_wrap(inner, preheader=f"{inviter_name} invited you to join {workspace_name}"),
        body_text,
    )


# ==============================================================
# TASK DUE REMINDER EMAIL
# ==============================================================

def send_task_due_reminder_email(
    to_email: str,
    full_name: str,
    task_title: str,
    due_date_str: str,
    project_name: str = "Project",
) -> None:
    greeting = full_name if full_name else "there"
    subject = f"⏰ Reminder: Task '{task_title}' is due soon"

    inner = (
        _heading("Task Due Date Reminder ⏰")
        + _para(f"Hello <strong style='color:#f8fafc;'>{greeting}</strong>,")
        + _para(
            f"This is a gentle reminder that your assigned task "
            f"<strong style='color:#818cf8;'>'{task_title}'</strong> in project "
            f"<strong>'{project_name}'</strong> is due on:"
        )
        + _info_box(
            f"📅 <strong>Due Date:</strong> {due_date_str}<br/>"
            f"📌 <strong>Project:</strong> {project_name}<br/>"
            f"📝 <strong>Task:</strong> {task_title}",
            bg="#2a1a0f",
            border="#f59e0b",
        )
        + _button(url=f"{settings.frontend_url}/tasks", label="View Task in Workspace →")
        + _divider()
        + _para("Stay productive with " + settings.app_name + ".", muted=True)
    )

    body_text = (
        f"Hello {greeting},\n\n"
        f"Reminder: Task '{task_title}' in project '{project_name}' is due on {due_date_str}.\n\n"
        f"View Task: {settings.frontend_url}/tasks"
    )

    send_email_background(
        to_email,
        subject,
        _html_wrap(inner, preheader=f"Reminder: {task_title} is due {due_date_str}"),
        body_text,
    )

