"""
Test invitation email — sends a real invitation email with Accept button.
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services.email import send_invitation_email

print("=" * 50)
print("INVITATION EMAIL TEST")
print("=" * 50)
print(f"Sending FROM : {settings.smtp_user}")
print(f"Sending TO   : {settings.smtp_user}")
print(f"Frontend URL : {settings.frontend_url}")
print()

# Generate a fake token (same format as real ones)
import secrets
fake_token = secrets.token_urlsafe(48)
print(f"Test Token   : {fake_token[:20]}...")
print()

print("Sending invitation email...")

send_invitation_email(
    to_email=settings.smtp_user,       # sending to yourself to test
    workspace_name="My Test Workspace",
    token=fake_token,
    inviter_name="Rakshith (Admin)",
)

time.sleep(3)  # wait for background thread to finish

print()
print("=" * 50)
print("DONE! Check your Gmail inbox.")
print(f"Accept link will point to: {settings.frontend_url}/accept-invitation?token=...")
print("=" * 50)
