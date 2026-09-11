#!/usr/bin/env bash
set -e
apt-get update -qq && apt-get install -y -qq tesseract-ocr tesseract-ocr-eng 2>/dev/null || true
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
