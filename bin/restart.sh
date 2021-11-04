#!/usr/bin/env bash

# Local variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
APP_DIR="${SCRIPT_DIR}/.."
DIST_DIR="${SCRIPT_DIR}/../dist"

# Overridable environment variables
REMOTE_USER="${REMOTE_USER:-ec2-user}"
HOST="${HOST:-ec2-35-175-219-168.compute-1.amazonaws.com}"
KEYFILE="${KEYFILE:-${SCRIPT_DIR}/../../keys/wego-api.pem}"

ssh ${REMOTE_USER}@${HOST} -i ${KEYFILE} "sudo systemctl daemon-reload; sudo systemctl restart wego"
