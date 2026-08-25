"""
Send invitation email directly to a specific address for debugging.
Usage: python send_invite_to.py someone@gmail.com
"""
import sys
import os
import smtplib
import secrets
import time

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services.email import _send_email_smtp

if len(sys.argv) < 2:
    print("Usage: python send_invite_to.py target@gmail.com")
    sys.exit(1)

target_email = sys.argv[1].strip()

print("=" * 55)
print("DIRECT INVITATION EMAIL TEST")
print("=" * 55)
print(f"FROM : {settings.smtp_user}")
print(f"TO   : {target_email}")
print()

# Step 1: Test SMTP auth first
print("Step 1: Verifying Gmail SMTP credentials...")
try:
    server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
    server.starttls()
    server.login(settings.smtp_user, settings.smtp_password)
    server.quit()
    print("  [OK] Gmail credentials verified!")
except smtplib.SMTPAuthenticationError:
    print("  [FAIL] Gmail authentication failed!")
    print("  --> App Password may be wrong. Re-generate it from:")
    print("  --> https://myaccount.google.com/apppasswords")
    sys.exit(1)
except Exception as e:
    print(f"  [FAIL] SMTP error: {e}")
    sys.exit(1)

# Step 2: Send email
print()
print(f"Step 2: Sending invitation email to {target_email}...")

fake_token = secrets.token_urlsafe(48)
invite_url = f"{settings.frontend_url}/accept-invitation?token={fake_token}"

_send_email_smtp(
    to_email=target_email,
    subject=f"You are invited to join workspace 'AI Workspace'",
    body_html=f"""
    <html>
      <body style="font-family:Arial,sans-serif;color:#333;line-height:1.6;background:#f4f5f7;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:12px;border:1px solid #e0e0e0;">
          <h2 style="color:#4f46e5;margin-top:0;">Workspace Invitation</h2>
          <p>Hello,</p>
          <p><strong>Rakshith (Admin)</strong> has invited you to join the workspace <strong>'AI Workspace'</strong> on AI Intelligent Workspace.</p>
          <p>To accept your invitation and join the workspace, click the button below:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="{invite_url}" style="background:#4f46e5;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold;border-radius:8px;display:inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size:13px;color:#666;">Or copy and paste this link:</p>
          <p style="font-size:12px;word-break:break-all;background:#f1f5f9;padding:10px;border-radius:6px;color:#334155;">{invite_url}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:25px 0;"/>
          <p style="font-size:12px;color:#888;text-align:center;">Sent by AI Intelligent Workspace</p>
        </div>
      </body>
    </html>
    """,
    body_text=f"Rakshith has invited you to join 'AI Workspace'. Accept here: {invite_url}",
)

time.sleep(2)

print()
print("=" * 55)
print(f"[DONE] Email dispatched to {target_email}")
print()
print("If not in inbox, check:")
print("  1. SPAM folder")
print("  2. Promotions tab")  
print("  3. All Mail folder")
print("  4. Wait 1-2 minutes")
print("=" * 55)
