#!/bin/bash

set -e

cd "$(dirname $0)/../tcec-chess.com"

source ../scripts/tcec-live-files.inc.sh

rm -v -f $livefiles
