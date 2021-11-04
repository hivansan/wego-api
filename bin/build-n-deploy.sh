#!/usr/bin/env bash

# Local variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
APP_DIR="${SCRIPT_DIR}/.."
DIST_DIR="${SCRIPT_DIR}/../dist"

# Overridable environment variables
REMOTE_USER="${REMOTE_USER:-ec2-user}"
HOST="${HOST:-ec2-35-175-219-168.compute-1.amazonaws.com}"
KEYFILE="${KEYFILE:-${SCRIPT_DIR}/../../keys/wego-api.pem}"

# DO THE THING (https://www.youtube.com/watch?v=ojhTu9aAa_Y)

echo "Building app..."
npm run build
cp ./*.json ${DIST_DIR}

echo "Syncing to remote..."
rsync -azP -e "ssh -i ${KEYFILE}" \
  ${DIST_DIR}/ ${REMOTE_USER}@${HOST}:~/app

rsync -azP -e "ssh -i ${KEYFILE}" --rsync-path="sudo rsync" \
  ${APP_DIR}/system/ ${REMOTE_USER}@${HOST}:/etc/systemd/system/

echo "Installing dependencies..."
ssh ${REMOTE_USER}@${HOST} -i ${KEYFILE} 'bash -s' < ${SCRIPT_DIR}/depends.sh


echo "Restarting service..."
REMOTE_USER=${REMOTE_USER} HOST=${HOST} KEYFILE=${KEYFILE} ${SCRIPT_DIR}/restart.sh

echo "Done"