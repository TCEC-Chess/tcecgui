#!/bin/bash

set -e

cd "$(dirname $0)/../tcec-chess.com"

source ../scripts/tcec-live-files.inc.sh

# backup live files if any exist
livefiles_exist=

for file in $livefiles
do
    if [ -f $file ]
    then
	livefiles_exist=1
    fi
done

if [ $livefiles_exist ]
then
    backup="/tmp/tcec-live-backup.tar.xz"
    echo "Backing up live files to $backup"
    tar cfJ "$backup" --ignore-failed-read $livefiles
fi

# create curl args and run curl
echo "$livefiles" | sed -r -e 's/[[:space:]]+/ /g' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | tr ' ' '\n' |
    sed -r 's@(.*)@-o \1 https://tcec-chess.com/\1@' |
    xargs curl --create-dirs --parallel-max 10 --parallel
