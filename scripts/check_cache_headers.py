import urllib.request
import re

req = urllib.request.urlopen('http://34.7.237.8/login')
html = req.read().decode()
chunks = re.findall(r'/_next/static/[^"\'\s>]+', html)
print(f"Found {len(chunks)} chunks")
if chunks:
    chunk_url = 'http://34.7.237.8' + chunks[0]
    resp = urllib.request.urlopen(chunk_url)
    print("Chunk URL:", chunk_url)
    print("Cache-Control:", resp.headers.get("Cache-Control"))
    print("ETag:", resp.headers.get("ETag"))

# Check HTML page cache header
print("\nHTML Page Headers:")
print("Cache-Control:", req.headers.get("Cache-Control"))
print("ETag:", req.headers.get("ETag"))
