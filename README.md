Simple, statically configurable NGINX proxy container with [Let's Encrypt](https://letsencrypt.org/) automatic certificate renewal inspired by [docker-letsencrypt-nginx-proxy-companion](https://github.com/JrCs/docker-letsencrypt-nginx-proxy-companion).

Still in testing


### Features

* Proxies can be configured using environment variables
* Automatic certificate request and renewal using [Simp_le](https://github.com/zenhack/simp_le/)
* Automatic NGINX reload upon configuration change

### Example docker compose configuration:

```yaml
version: '2'
services:
  nginx:
    image: nginx
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - nginx_certs:/etc/nginx/certs
      - nginx_confd:/etc/nginx/conf.d
      - nginx_vhostd:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
  config-gen:
    image: szazo/static-letsencrypt-nginx-proxy-gen
    environment:
      - PROXY_1=https://apple.example.com->http://1.2.3.4:80
      - PROXY_2=https://banana.example.com->http://11.22.33.44:443
      - NGINX_CONTAINER=nginx-proxy
      - DEBUG=*
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - nginx_certs:/output/nginx_certs
      - nginx_confd:/output/nginx_confd
      - nginx_vhostd:/output/nginx_vhostd
      - nginx_html:/output/nginx_html
volumes:
  nginx_certs:
  nginx_confd:
  nginx_vhostd:
  nginx_html:
```

