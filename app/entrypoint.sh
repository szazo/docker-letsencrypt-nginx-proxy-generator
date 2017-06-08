#!/bin/sh

trap "exit 0;" INT

while true;
do
		node ./build/refresh-certs.js /output/nginx_confd /output/nginx_vhostd /output/nginx_html /output/nginx_certs

		# 60 * 60 * 24 = 1 day
		sleep 86400 &
		wait
		
done
