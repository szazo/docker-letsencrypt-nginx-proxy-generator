#!/bin/sh

trap "exit 0;" SIGTERM

while true;
do
		sleep 5 &
		wait

		node ./build/refresh-certs.js /output/nginx_confd /output/nginx_vhostd /output/nginx_html /output/nginx_certs

done
