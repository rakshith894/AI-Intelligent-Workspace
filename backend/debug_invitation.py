"""
Debug invitation email - test sending to a different Gmail address.
"""
import sys
import os
import time
import smtplib

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings

print("=" * 55)
print("DEBUGGING INVITATION EMAIL")
print("=" * 55)
print(f"FROM : {settings.smtp_user}")
print()

# Ask for target email
target_email = input("Enter the OTHER Gmail address you sent invite to: ").strip()
if not target_email:
    print("No email entered. Exiting.")
    sys.exit(1)

print()
print(f"TO   : {target_email}")
print()

# Step 1: Test raw SMTP connection
print("Step 1: Testing SMTP connection to Gmail...")
try:
    server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
    server.starttls()
    print("  [OK] TLS handshake successful")
    server.login(settings.smtp_user, settings.smtp_password)
    print("  [OK] Gmail login successful")
    server.quit()
    print("  [OK] SMTP connection working")
except smtplib.SMTPAuthenticationError as e:
    print(f"  [FAIL] Gmail Auth Error: {e}")
    print("  --> Your App Password may be wrong. Re-generate from Google Account.")
    sys.exit(1)
except Exception as e:
    print(f"  [FAIL] SMTP Error: {e}")
    sys.exit(1)

print()
print(f"Step 2: Sending test invitation email to {target_email}...")

import secrets
from app.services.email import _send_email_smtp

fake_token = secrets.token_urlsafe(48)
invite_url = f"{settings.frontend_url}/accept-invitation?token={fake_token}"

_send_email_smtp(
    to_email=target_email,
    subject=f"[INVITE TEST] Join AI Intelligent Workspace",
    body_html=f"""
    <html>
      <body style="font-family:Arial,sans-serif;color:#333;padding:20px;">
        <h2 style="color:#4f46e5;">Workspace Invitation</h2>
        <p>Hello,</p>
        <p><strong>Rakshith (Admin)</strong> has invited you to join workspace <strong>'Test Workspace'</strong> on AI Intelligent Workspace.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="{invite_url}" style="background:#4f46e5;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold;border-radius:8px;display:inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size:13px;color:#666;">Or copy this link:<br/><code style="word-break:break-all;">{invite_url}</code></p>
        <hr/>
        <p style="font-size:12px;color:#888;text-align:center;">Sent by AI Intelligent Workspace</p>
      </body>
    </html>
    """,
    body_text=f"You are invited to join 'Test Workspace'. Accept here: {invite_url}",
)

print()
print("=" * 55)
print(f"Email sent to {target_email}!")
print()
print("If it still doesn't arrive, check:")
print("  1. SPAM / JUNK folder in Gmail")
print("  2. Promotions tab in Gmail")
print("  3. Wait 1-2 minutes, sometimes delayed")
print("=" * 55)
