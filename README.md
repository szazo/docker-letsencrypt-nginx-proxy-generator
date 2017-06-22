Simple, statically configurable NGINX proxy container with [Let's Encrypt](https://letsencrypt.org/) automatic certificate renewal inspired by [docker-letsencrypt-nginx-proxy-companion](https://github.com/JrCs/docker-letsencrypt-nginx-proxy-companion).

Still in testing

## Features

* Proxies can be configured using environment variables
* Automatic certificate request and renewal using [Simp_le](https://github.com/zenhack/simp_le/)
* Automatic NGINX reload upon configuration change
* Multiple proxies can be defined for a single virtual host with different locations

## Configuration

### Example docker compose configuration

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
      - nginx_certs:/etc/nginx/certs
      - nginx_confd:/etc/nginx/conf.d
      - nginx_vhostd:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
  config-gen:
    image: szazo/letsencrypt-nginx-proxy-generator
    environment:
      - NGINX_CONTAINER=nginx-proxy
      - PROXY_1=https://apple.example.com->http://1.2.3.4:80
      - PROXY_2=https://banana.example.com->https://11.22.33.44:443
      - PROXY_3=https://banana.example.com/pear->http://22.33.44.55:80/cherry
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

### Proxies

Proxies can be defined with `PROXY_*` environment variables:
* The format: `PROTO://source.domain.name/optional-path->PROTO://target.host:PORT/optional-path` (currently only `https` source PROTO supported)
* Example: `https://apple.example.com/path->http://1.2.3.4:80/target-path`

### NGINX reload

In order for the container to be able to reload the NGINX using Docker API:
- pass the NGINX's container name using `NGINX_CONTAINER` environment variable,
- map the host's `/var/run/docker.sock` socket file into the container with the same path.

### Volumes

In order to allow the container to store generated configurations and certificates, map the following volumes:
* NGINX `/etc/nginx/certs` directory ⟷ `nginx_certs` volume ⟷ `/output/nginx_certs` directory for generated certificates.
* NGINX `/etc/nginx/conf.d` directory ⟷ `nginx_confd` volume ⟷ `/output/nginx_confd` directory for generated configurations.
* NGINX `/etc/nginx/vhost.d` directory ⟷ `nginx_vhostd` volume ⟷ `/output/nginx_vhostd` directory for common includes.
* NGINX `/usr/share/nginx/html` directory ⟷ `nginx_html` volume ⟷ `/output/nginx_html` directory for Let's Encrypt challenge files.

### Debug message

Debug messages can be enabled using `DEBUG` environment variable: `DEBUG=*`

### Diagram

The following diagrams shows the connection between the elements.

```
                                           .------------------------.
                                           | Let's Encrypt server   |
                     .---------------------|                        |
                     |                     '------------------------'
.--------------------|---------------.                  ^
| NGINX              v               |                  |
|      .---------------------------. |                  |
|      | .wellknown/acme-challenge | |                  |
|      |                           | |                  |
|      |                           | |                  |
|      '---------------------------' |                  |
|                                    |                  |
'------------------------------------'                  |
            |                                           |
            |                                           |
            |     .-----------------------------------. |
            |     | letsencrypt-nginx-proxy-generator | |
            |     |                                   |-'
            |     '-----------------------------------'
            |                       |
            |                       |
            v                       |
  .------------------.              |
  |     Volumes      |              |
  |------------------|              |
  | nginx_certs      |              |
  | nginx_confd      |<-------------'
  | nginx_vhostd     |
  | nginx_html       |
  '------------------'
```