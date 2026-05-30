# upload_to_drive.py – script to create folder and upload songs to Google Drive
# Requires client_secret.json (OAuth credentials) placed in the same directory:
# C:\\Users\\USER\\.gemini\\antigravity\\scratch\\cobra_motoradio\\client_secret.json

import os, sys, json
from pathlib import Path

# Try importing Google libraries; install them if missing
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
except ImportError:
    print("[!] Google libraries not found. Installing…")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "google-auth", "google-auth-oauthlib", "google-api-python-client"])
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCOPES = ["https://www.googleapis.com/auth/drive.file"]
CRED_PATH = os.path.join(os.path.dirname(__file__), "client_secret.json")
# Local root where the music is already organized
LOCAL_MUSIC_ROOT = r"C:\\Users\\USER\\Music\\Cobra Moto Radio\\COBRA MOTORADIO"
DRIVE_ROOT_NAME = "Cobra Motoradio"
SUBFOLDERS = [
    "PASTA MASTER 1 ROCK CLÁSSICO",
    "PASTA MASTER 2 BLUES-FOLK",
    "PASTA MASTER 3 NACIONAL",
]

def authenticate():
    """Run OAuth flow and return an authenticated Drive service object."""
    if not os.path.exists(CRED_PATH):
        print(f"[!] client_secret.json not found at {CRED_PATH}. Please place the file and rerun.")
        sys.exit(1)
    flow = InstalledAppFlow.from_client_secrets_file(CRED_PATH, SCOPES)
    creds = flow.run_local_server(port=0)
    return build('drive', 'v3', credentials=creds)

def ensure_folder(service, name, parent_id=None):
    """Create folder if it does not exist and return its ID."""
    query = f"mimeType='application/vnd.google-apps.folder' and name='{name}'"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    resp = service.files().list(q=query, fields='files(id, name)', spaces='drive').execute()
    files = resp.get('files', [])
    if files:
        return files[0]['id']
    body = {'name': name, 'mimeType': 'application/vnd.google-apps.folder'}
    if parent_id:
        body['parents'] = [parent_id]
    folder = service.files().create(body=body, fields='id').execute()
    return folder.get('id')

def upload_folder(service, local_path, drive_parent_id):
    """Recursively upload .mp3 files from local_path to the Drive folder with ID drive_parent_id."""
    for entry in os.scandir(local_path):
        if entry.is_dir():
            sub_id = ensure_folder(service, entry.name, drive_parent_id)
            upload_folder(service, entry.path, sub_id)
        elif entry.is_file() and entry.name.lower().endswith('.mp3'):
            file_metadata = {'name': entry.name, 'parents': [drive_parent_id]}
            media = MediaFileUpload(entry.path, mimetype='audio/mpeg')
            service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            print(f"[+] Uploaded {entry.name}")

def set_public_read(service, folder_id):
    """Set permission "anyone with the link -> reader" for the given folder."""
    batch = service.new_batch_http_request()
    batch.add(service.permissions().create(
        fileId=folder_id,
        body={"type": "anyone", "role": "reader"},
        fields='id',
    ))
    batch.execute()
    print("[+] Public read permission set.")

def main():
    print("=== Cobra Motoradio – Upload to Google Drive ===")
    service = authenticate()
    root_id = ensure_folder(service, DRIVE_ROOT_NAME)
    print(f"[i] Root folder ID: {root_id}")
    for sub in SUBFOLDERS:
        local_sub = Path(LOCAL_MUSIC_ROOT) / sub
        if not local_sub.is_dir():
            print(f"[!] Local subfolder not found: {local_sub}")
            continue
        drive_sub_id = ensure_folder(service, sub, parent_id=root_id)
        print(f"[i] Uploading contents of {sub}…")
        upload_folder(service, str(local_sub), drive_sub_id)
    set_public_read(service, root_id)
    print("\n=== Finished! Keep the Root Folder ID for the Apps Script configuration. ===")

if __name__ == '__main__':
    main()
