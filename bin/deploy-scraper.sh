#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DIST_DIR="${SCRIPT_DIR}/../dist"

# ssh -t wego-scraper "cd api && git pull && npm run build"
npm run build 
rsync -azP ${DIST_DIR}/ wego-scraper:/home/ubuntu/api/
rsync -azP ${DIST_DIR}/ wego-scraper-10k:/home/ubuntu/api/
