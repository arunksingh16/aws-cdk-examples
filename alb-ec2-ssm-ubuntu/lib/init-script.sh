#! /bin/bash
# ubuntu init script
sudo su
apt-get update
apt-get install -y jq
mkdir /tmp/ssm
cd /tmp/ssm