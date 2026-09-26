import hashlib
import base64

# Tryton passlib scrypt format:
# $scrypt$ln=16,r=8,p=1$<salt_b64>$<hash_b64>
# ln=16 means N = 2^16 = 65536, r=8, p=1

stored_hash_str = "$scrypt$ln=16,r=8,p=1$iZFSqhXiHMMY43yPMUYI4Q$7HUXaqnFIUgCmq874m82FZ3KyeoZYvsygYkM9WseVhY"
parts = stored_hash_str.split("$")
# parts: ['', 'scrypt', 'ln=16,r=8,p=1', 'iZFSqhXiHMMY43yPMUYI4Q', '7HUXaqnFIUgCmq874m82FZ3KyeoZYvsygYkM9WseVhY']
salt_b64 = parts[3]
hash_b64 = parts[4]

# passlib uses custom base64 (or standard base64 without padding or standard base64 with ./ instead of +/)
# Let's test standard base64 and standard variations
def decode_b64(s):
    # Try passlib ab64 / b64
    alt_s = s.replace(".", "+")
    padded = alt_s + "=" * ((4 - len(alt_s) % 4) % 4)
    try:
        return base64.b64decode(padded)
    except Exception:
        return None

salt = decode_b64(salt_b64)
target_hash = decode_b64(hash_b64)

candidates = [
    "Admin12345!",
    "admin",
    "Admin",
    "Admin123",
    "Admin2026!",
    "DemoAdmin2026!",
    "gnusolidario",
    "gnuhealth",
    "123456",
    "password",
    "admin123",
    "ISTHealth2026!",
]

N = 2**16
r = 8
p = 1

print(f"Testing {len(candidates)} candidates offline against admin hash...")
for pwd in candidates:
    if salt:
        derived = hashlib.scrypt(pwd.encode("utf-8"), salt=salt, n=N, r=r, p=p, maxmem=128*1024*1024)
        if target_hash and derived[:len(target_hash)] == target_hash:
            print(f"MATCH FOUND: {pwd}")
            break
        # Also check without alt_s
        raw_salt = base64.b64decode(salt_b64 + "==")
        derived2 = hashlib.scrypt(pwd.encode("utf-8"), salt=raw_salt, n=N, r=r, p=p, maxmem=128*1024*1024)
        raw_target = base64.b64decode(hash_b64 + "==")
        if derived2[:len(raw_target)] == raw_target:
            print(f"MATCH FOUND (raw): {pwd}")
            break
else:
    print("No simple candidate matched.")
