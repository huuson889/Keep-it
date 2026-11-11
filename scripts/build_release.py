#!/usr/bin/env python3
"""Build the test release files from a git revision: the ZIP and the matching signed CRX (CRX3).

    python3 scripts/build_release.py                      # HEAD -> ../Keepit-Zip (ZIP) + ../Keepit-Crx (CRX)
    python3 scripts/build_release.py --key "path/to/key.pem" --out "zip dir" --crx-out "crx dir" --ref HEAD

Output: "Keepit - Optimize Test-v<version>.zip" and ".crx" (same files; the CRX payload is the ZIP itself).
ZIPs and CRXs live in separate folders next to the repo (APK source ZIPs go to ../Keepit-Apk-Zip, not built here).
The private key never belongs in this repo (it is public): default location ../Keepit-key/Keepit - Test.pem,
or set KEEPIT_CRX_KEY. Pure Python, no packages needed (RSA PKCS#1 v1.5 / SHA-256 signing done here).
Stores (Chrome Web Store, Edge Add-ons, AMO) take the ZIP; the CRX is for sideloading, e.g. Edge Android
Developer options > "Extension install by crx". Same key = same extension ID across versions.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import os
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAME = "Keepit - Optimize Test-v{version}"
EXCLUDED_NAMES = ("sync-watch.",)            # local sync helpers, never shipped
EXCLUDED_SUFFIXES = (".pem", ".crx", ".zip")  # keys / build outputs, even if committed by mistake


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT)


def release_files(ref: str) -> list[str]:
    names = git("ls-tree", "-r", "--name-only", ref).decode("utf-8").splitlines()
    return [n for n in names
            if not any(part in Path(n).name for part in EXCLUDED_NAMES)
            and not n.lower().endswith(EXCLUDED_SUFFIXES)]


def build_zip(ref: str, files: list[str]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name in files:
            z.writestr(name, git("show", f"{ref}:{name}"))
    return buf.getvalue()


# --- minimal DER (ASN.1) for RSA keys ---------------------------------------------------------------
def der_read(b: bytes, i: int = 0) -> tuple[int, bytes, int]:
    tag, length = b[i], b[i + 1]
    i += 2
    if length & 0x80:
        n = length & 0x7F
        length = int.from_bytes(b[i:i + n], "big")
        i += n
    return tag, b[i:i + length], i + length


def der_items(b: bytes) -> list[tuple[int, bytes]]:
    out, i = [], 0
    while i < len(b):
        tag, val, i = der_read(b, i)
        out.append((tag, val))
    return out


def der(tag: int, val: bytes) -> bytes:
    n = len(val)
    if n < 0x80:
        return bytes([tag, n]) + val
    ln = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return bytes([tag, 0x80 | len(ln)]) + ln + val


def der_int(x: int) -> bytes:
    raw = x.to_bytes(max(1, (x.bit_length() + 7) // 8), "big")
    return der(0x02, (b"\x00" + raw) if raw[0] & 0x80 else raw)


def load_rsa_key(path: Path) -> tuple[int, int, int]:
    """(n, e, d) from a PEM 'PRIVATE KEY' (PKCS#8, what Chrome writes) or 'RSA PRIVATE KEY' (PKCS#1)."""
    text = path.read_text("ascii", errors="ignore")
    kind = "RSA PRIVATE KEY" if "BEGIN RSA PRIVATE KEY" in text else "PRIVATE KEY"
    start, end = f"-----BEGIN {kind}-----", f"-----END {kind}-----"
    if start not in text or end not in text:
        raise ValueError(f"{path}: no PEM private key found")
    body = base64.b64decode("".join(text.split(start, 1)[1].split(end, 1)[0].split()))
    _, seq, _ = der_read(body)
    items = der_items(seq)
    if kind == "PRIVATE KEY":            # PrivateKeyInfo { version, algorithm, OCTET STRING RSAPrivateKey }
        _, seq, _ = der_read(items[2][1])
        items = der_items(seq)
    n, e, d = (int.from_bytes(items[k][1], "big") for k in (1, 2, 3))
    return n, e, d


def public_key_der(n: int, e: int) -> bytes:
    """SubjectPublicKeyInfo — the bytes Chrome hashes for the extension ID."""
    alg = der(0x30, der(0x06, bytes.fromhex("2a864886f70d010101")) + b"\x05\x00")
    return der(0x30, alg + der(0x03, b"\x00" + der(0x30, der_int(n) + der_int(e))))


def rsa_sign_sha256(n: int, e: int, d: int, data: bytes) -> bytes:
    k = (n.bit_length() + 7) // 8
    t = bytes.fromhex("3031300d060960864801650304020105000420") + hashlib.sha256(data).digest()
    em = b"\x00\x01" + b"\xff" * (k - len(t) - 3) + b"\x00" + t
    m = int.from_bytes(em, "big")
    s = pow(m, d, n)
    if pow(s, e, n) != m:
        raise ValueError("RSA self-check failed (bad key)")
    return s.to_bytes(k, "big")


# --- CRX3 (protobuf header) -----------------------------------------------------------------------
def varint(x: int) -> bytes:
    out = bytearray()
    while True:
        b, x = x & 0x7F, x >> 7
        out.append(b | (0x80 if x else 0))
        if not x:
            return bytes(out)


def pb_bytes(field: int, val: bytes) -> bytes:
    return varint(field << 3 | 2) + varint(len(val)) + val


def extension_id(pub: bytes) -> str:
    return "".join(chr(ord("a") + int(c, 16)) for c in hashlib.sha256(pub).hexdigest()[:32])


def build_crx(zip_bytes: bytes, key: Path) -> tuple[bytes, str]:
    n, e, d = load_rsa_key(key)
    pub = public_key_der(n, e)
    signed_data = pb_bytes(1, hashlib.sha256(pub).digest()[:16])                   # SignedData.crx_id
    message = b"CRX3 SignedData\x00" + len(signed_data).to_bytes(4, "little") + signed_data + zip_bytes
    proof = pb_bytes(1, pub) + pb_bytes(2, rsa_sign_sha256(n, e, d, message))      # AsymmetricKeyProof
    header = pb_bytes(2, proof) + pb_bytes(10000, signed_data)                     # CrxFileHeader
    crx = b"Cr24" + (3).to_bytes(4, "little") + len(header).to_bytes(4, "little") + header + zip_bytes
    return crx, extension_id(pub)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("--ref", default="HEAD", help="git revision to package (default HEAD)")
    ap.add_argument("--out", default=str(ROOT.parent / "Keepit-Zip"), help="ZIP output folder")
    ap.add_argument("--crx-out", default=str(ROOT.parent / "Keepit-Crx"), help="CRX output folder")
    ap.add_argument("--key", default=os.environ.get("KEEPIT_CRX_KEY", str(ROOT.parent / "Keepit-key" / "Keepit - Test.pem")),
                    help="CRX private key (.pem), kept outside the repo")
    ap.add_argument("--no-crx", action="store_true", help="ZIP only")
    a = ap.parse_args()

    version = json.loads(git("show", f"{a.ref}:manifest.json"))["version"]
    files = release_files(a.ref)
    zip_bytes = build_zip(a.ref, files)
    out = Path(a.out).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)
    base = NAME.format(version=version)
    (out / f"{base}.zip").write_bytes(zip_bytes)
    print(f"ZIP  {out / (base + '.zip')}  ({len(files)} files, {len(zip_bytes):,} bytes)")
    if a.no_crx:
        return 0
    key = Path(a.key).expanduser()
    if not key.is_file():
        print(f"ERROR: CRX key not found: {key} (use --key, KEEPIT_CRX_KEY, or --no-crx)", file=sys.stderr)
        return 1
    crx, ext_id = build_crx(zip_bytes, key)
    crx_out = Path(a.crx_out).expanduser().resolve()
    crx_out.mkdir(parents=True, exist_ok=True)
    (crx_out / f"{base}.crx").write_bytes(crx)
    print(f"CRX  {crx_out / (base + '.crx')}  ({len(crx):,} bytes, extension ID {ext_id})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
