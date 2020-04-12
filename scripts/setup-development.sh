#!/bin/bash

set -e

cd "$(dirname $0)/../tcec-chess.com"
npm install

../scripts/download-tcec-live-files-for-testing.sh
