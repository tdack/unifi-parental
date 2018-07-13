#!/bin/bash
trap "exit" INT TERM ERR
trap "kill 0" EXIT

DEBUG=unifi-parental:* npm start --prefix /usr/local/src/unifi-parental >> /usr/local/src/unifi-parental/cloudkey/unifi-parental.log 2>&1

wait