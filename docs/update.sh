#!/bin/sh

set -e

# config
tempfolder=/var/tmp
webfolder=/var/tmp/xmpp-web-html

# check folder
read -p "This will delete $webfolder/*, is this correct? (Y/N) " choice
if [ "$choice" != "Y" ]
then
  echo "Aborting..."
  exit 0
fi

# get latest version
version=$(curl --silent https://api.github.com/repos/nioc/xmpp-web/releases/latest | jq --raw-output .tag_name)

# download
echo Downloading https://github.com/nioc/xmpp-web/releases/latest/download/xmpp-web-$version.tar.gz
curl --location --silent https://github.com/nioc/xmpp-web/releases/latest/download/xmpp-web-$version.tar.gz --output $tempfolder/xmpp-web.tar.gz

# unpack
echo Unpacking $tempfolder/xmpp-web.tar.gz
tar -xzf $tempfolder/xmpp-web.tar.gz --directory $tempfolder

# backup local.js
cp $webfolder/local.js $tempfolder/local.js.bk
echo Previous config saved as $tempfolder/local.js.bak

# move to web folder
rm $webfolder/* -r
mv -f $tempfolder/xmpp-web/* $webfolder/

# restore local.js.bak
mv $tempfolder/local.js.bk $webfolder/local.js.bak
echo Your config was saved as $webfolder/local.js.bak, you need to compare and edit default $webfolder/local.js

# set owner
chown www-data $webfolder/ -R

# cleaning
rm $tempfolder/xmpp-web -r
rm $tempfolder/xmpp-web.tar.gz
