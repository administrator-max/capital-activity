#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# update_dashboard.sh
# Usage: ./update_dashboard.sh "path/to/Capital_Activity_Dashboard - 2026-04-07.html"
#
# Otomatis overwrite index.html, commit, dan push ke GitHub + Heroku
# ─────────────────────────────────────────────────────────────

set -e

NEW_FILE="$1"

if [ -z "$NEW_FILE" ]; then
  echo "❌  Usage: ./update_dashboard.sh \"path/to/new_dashboard.html\""
  exit 1
fi

if [ ! -f "$NEW_FILE" ]; then
  echo "❌  File tidak ditemukan: $NEW_FILE"
  exit 1
fi

echo "📄  Menyalin file baru ke index.html..."
cp "$NEW_FILE" index.html

echo "📦  Git add + commit..."
git add index.html
git commit -m "chore: update dashboard $(date '+%Y-%m-%d %H:%M')"

echo "🔀  Push ke GitHub..."
git push origin main

echo "🚀  Push ke Heroku..."
git push heroku main

echo ""
echo "✅  Dashboard berhasil di-update dan di-deploy!"
