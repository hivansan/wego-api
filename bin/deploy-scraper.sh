#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DIST_DIR="${SCRIPT_DIR}/../dist"

HOST1="${HOST1:-wego-scraper}"
HOST2="${HOST2:-wego-scraper-10k}"

# ssh -t wego-scraper "cd api && git pull && npm run build"
npm run build 
cp ./*.json ${DIST_DIR}

cp ~/Dropbox/_digitalhedge/envs/wego-prod-env.txt ${DIST_DIR}/.env

rsync -azP ${DIST_DIR}/ ${HOST1}:/home/ubuntu/api/ --exclude public
rsync -azP ${DIST_DIR}/ ${HOST2}:/home/ubuntu/api/ --exclude public


ssh ${HOST1} "cd ~/api; npm i;"
ssh ${HOST2} "cd ~/api; npm i;"