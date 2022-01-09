#!/usr/bin/env bash

# Local variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

APP_DIR="${SCRIPT_DIR}/.."
DIST_DIR="${SCRIPT_DIR}/../dist"

# Overridable environment variables
HOST1="${HOST:-wego-prod-1}"
HOST2="${HOST:-wego-prod-2}"

echo "Starting."

echo "Building API..."
npm run build
cp ./*.json ${DIST_DIR}
cp ./admins.json ${DIST_DIR}/server
cp -R ./admin ${DIST_DIR}
cp ${APP_DIR}/ecosystem.config.js ${DIST_DIR}


rsync -azP ${DIST_DIR}/ ${HOST1}:~/api
rsync -azP ${DIST_DIR}/ ${HOST2}:~/api

echo "Installing dependencies..."
# ssh ${HOST} 'bash -s' < ${SCRIPT_DIR}/depends.sh

scp ~/Dropbox/_digitalhedge/envs/wego-prod-env.txt ${HOST1}:~/api/.env
scp ~/Dropbox/_digitalhedge/envs/wego-prod-env.txt ${HOST2}:~/api/.env

echo "Restarting service..."
HOST=${HOST1} ${SCRIPT_DIR}/restart-ng.sh
HOST=${HOST2} ${SCRIPT_DIR}/restart-ng.sh

echo "Done"