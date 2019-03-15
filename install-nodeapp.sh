#!/bin/bash
usage(){
    echo "Copy and install a nodejs app ."
    echo ""
    echo "Usage: $0 <ssh address>"
    echo "(i.e. $0 rob@192.168.0.240)"
    echo ""
}


if [ -z "$1" ]
then
    usage
    echo "You must specify ssh address: <user>@<ip-address>."
    exit 1
fi

echo "[INFO] Connecting to host..."
MAIN_DIR=`basename "$PWD"`

# copy the daemon
scp -r ../$MAIN_DIR $1:

# install configurations and set up automatic start
ssh -t $1 <<EOF 
cd $MAIN_DIR
npm install
sudo cp -R ./config/* /
sudo pm2 start main.js
sudo pm2 update
sudo pm2 startup
EOF
