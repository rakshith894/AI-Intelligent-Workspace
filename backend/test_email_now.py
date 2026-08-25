"""
Quick email test script — runs directly with the project venv.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services.email import _send_email_smtp, send_login_notification_email

print("=" * 50)
print("EMAIL CONFIGURATION CHECK")
print("=" * 50)
print(f"SMTP Host     : {settings.smtp_host}")
print(f"SMTP Port     : {settings.smtp_port}")
print(f"SMTP User     : {settings.smtp_user}")
print(f"SMTP Password : {'(SET - ' + str(len(settings.smtp_password)) + ' chars)' if settings.smtp_password else '(NOT SET)'}")
print(f"Emails Enabled: {settings.emails_enabled}")
print()

if not settings.smtp_user or not settings.smtp_password:
    print("❌ SMTP credentials are missing! Add SMTP_USER and SMTP_PASSWORD to .env")
    sys.exit(1)

print("Sending TEST email to:", settings.smtp_user)
print()

# Test 1: Raw SMTP test
_send_email_smtp(
    to_email=settings.smtp_user,
    subject="[TEST] AI Intelligent Workspace - Email Working!",
    body_html="""
    <html>
      <body style="font-family:Arial,sans-serif; padding:20px;">
        <h2 style="color:#4f46e5;">Email Notifications Working!</h2>
        <p>This is a test email from your <strong>AI Intelligent Workspace</strong>.</p>
        <p>Your Gmail SMTP is configured correctly. Every user login will now trigger a security alert email automatically.</p>
        <hr/>
        <p style="color:#888; font-size:12px;">Sent from AI Intelligent Workspace Test</p>
      </body>
    </html>
    """,
    body_text="Email is Working! AI Intelligent Workspace SMTP is configured correctly.",
)

print()
print("Test 2: Sending login notification email (same as real login)...")

# Test 2: Real login notification
send_login_notification_email(
    to_email=settings.smtp_user,
    full_name="Rakshith (Test)",
)

import time
time.sleep(3)  # wait for background thread

print()
print("=" * 50)
print("DONE! Check your Gmail inbox now.")
print("=" * 50)
