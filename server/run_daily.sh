#!/usr/bin/env bash
set -euo pipefail
ROOT=/root/mulsallim_ai
STAMP=$(date -Is)
echo "[$STAMP] start"
python3 "$ROOT/collect_krc.py" 4423010045 "$ROOT/data/tapjeong_365d.csv"
python3 "$ROOT/evaluate_forecast.py" "$ROOT/data/tapjeong_365d.csv" --out "$ROOT/models/tapjeong_metrics.json"
echo "[$(date -Is)] done"
