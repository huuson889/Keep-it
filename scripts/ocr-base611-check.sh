#!/usr/bin/env bash
# Chứng minh: cây hiện tại = v3.5.611 (4179a66) + ĐÚNG tầng OCR của demo.
# Mọi thay đổi so với 611 phải nằm trong danh sách trắng dưới đây; ngoài danh sách ⇒ lỗi.
set -euo pipefail
BASE="${BASE:-4179a66}"
cd "$(dirname "$0")/.."
changed=$(git diff --name-only "$BASE" HEAD -- . | sed 's|^Keep-it/||')
outside=$(echo "$changed" | grep -vE '^(js/ocr/|css/dashboard/ocr\.css$|vendor/ocr/|js/core/languages\.js$|js/dashboard/documents\.js$|pages/documents\.html$|manifest\.json$|PROJECT\.md$|AGENTS\.md$|docs/|scripts/ocr-base611-check\.sh$)' || true)
if [ -n "$outside" ]; then
  echo "✗ Có file NGOÀI phạm vi OCR (base 611 bị đụng):"
  echo "$outside"
  exit 1
fi
echo "✓ Ngoài phạm vi OCR: 0 file (base 611 nguyên vẹn)"
echo "✓ Số file đã đổi so với 611: $(echo "$changed" | wc -l)"
echo "✓ File thêm mới (611 không có):"
git diff --name-status "$BASE" HEAD -- . | awk '$1=="A"{print "   + " $2}'
