import os

report_dir = os.path.join("reports", "live_browser_test")
files = sorted([f for f in os.listdir(report_dir) if f.endswith(".png") and f[:2].isdigit()])
print(f"Total numbered screenshots: {len(files)}")
for f in files:
    full_path = os.path.join(report_dir, f)
    size = os.path.getsize(full_path)
    print(f"  {f}: {size:,} bytes")
