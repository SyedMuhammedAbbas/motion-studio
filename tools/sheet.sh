#!/bin/sh
# sheet.sh out.png cols width file1 file2 ...  (tile stills into a contact sheet)
out=$1; cols=$2; w=$3; shift 3
l=$(mktemp); for f in "$@"; do printf "file '%s'\nduration 1\n" "$(cd "$(dirname "$f")" && pwd -W)/$(basename "$f")" >> $l; done
n=$#; rows=$(( (n + cols - 1) / cols ))
ffmpeg -loglevel error -y -f concat -safe 0 -i $l -vf "scale=$w:-1,tile=${cols}x${rows}" -frames:v 1 $out; rm $l
