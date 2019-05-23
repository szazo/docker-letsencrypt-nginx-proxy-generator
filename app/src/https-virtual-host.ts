export interface HttpsVirtualHost {
  virtualHost: string;
  locations: VirtualHostLocation[];
  fallbackAcmeChallengeLocation: VirtualHostLocation | null;
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
