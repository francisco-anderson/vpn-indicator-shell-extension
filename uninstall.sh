#!/bin/bash -e

dir=~/.local/share/gnome-shell/extensions/vpn-snx-indicator@als.kz

if [ -d $dir ]; then
  rm -rf $dir
  echo "success"
fi
