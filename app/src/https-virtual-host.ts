export interface HttpsVirtualHost {
  virtualHost: string;
  locations: VirtualHostLocation[];
}

export interface VirtualHostLocation {
  path:string;
  proxyPass: ProxyPassUrl;
}

interface ProxyPassUrl {
  protocol: string;
  host: string;
  port: string;
  path: string;
}
