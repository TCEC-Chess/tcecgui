#!/bin/bash

set -e

cd "$(dirname $0)/../tcec-chess.com"
node cluster.js --port 8080
