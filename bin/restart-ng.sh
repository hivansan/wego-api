#!/usr/bin/env bash

# Local variables
HOST="${HOST:-wego-prod-1}"

ssh ${HOST} "cd ~/api; pm2 restart /home/ubuntu/api/ecosystem.config.js;"