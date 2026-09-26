import os
import sys
import urllib.request
import zipfile

TOOLS_DIR = os.path.expanduser(r"~\.tools")
os.makedirs(TOOLS_DIR, exist_ok=True)
NODE_VER = "v22.14.0"
NODE_DIR_NAME = f"node-{NODE_VER}-win-x64"
NODE_DIR = os.path.join(TOOLS_DIR, NODE_DIR_NAME)
NODE_EXE = os.path.join(NODE_DIR, "node.exe")

if os.path.exists(NODE_EXE):
    print(f"Node.js already extracted at: {NODE_DIR}")
else:
    URL = f"https://nodejs.org/dist/{NODE_VER}/{NODE_DIR_NAME}.zip"
    ZIP_PATH = os.path.join(TOOLS_DIR, f"{NODE_DIR_NAME}.zip")
    print(f"Downloading Node.js {NODE_VER} from {URL}...")
    urllib.request.urlretrieve(URL, ZIP_PATH)
    print("Download complete. Extracting zip archive...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(TOOLS_DIR)
    os.remove(ZIP_PATH)
    print(f"Extraction complete! Node executable: {NODE_EXE}")

# Verify execution
import subprocess
out_node = subprocess.check_output([NODE_EXE, "-v"], text=True).strip()
NPM_CMD = os.path.join(NODE_DIR, "npm.cmd")
out_npm = subprocess.check_output([NPM_CMD, "-v"], text=True).strip()
print(f"Verified Node version: {out_node}")
print(f"Verified NPM version: {out_npm}")
