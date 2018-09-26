import { HttpsVirtualHost, VirtualHostLocation } from './https-virtual-host';


interface Proxy {
  srcProtocol: string;
  srcVirtualHost: string;
  srcPath: string;
  dstProtocol: string;
  dstAddress: string;
  dstPort: string;
  dstPath: string;
}

export class EnvironmentVariablesParser {

  parse(env: { [ key: string ]: string }) {

    // filter PROXY_* variables
    let filtered = this.filterVariables(env);

    // parse variables
    let proxies = this.parseProxies(filtered);

    // get https proxies
    let httpsVirtualHosts = this.groupHttpsProxies(proxies);

    return httpsVirtualHosts;
  }

  private groupHttpsProxies(proxies: Proxy[]) {

    let httpsProxies = proxies.filter(x=>x.srcProtocol == 'https');

    let virtualHosts: HttpsVirtualHost[] = [];
    for (let proxy of httpsProxies) {

      let vhost = virtualHosts.find(x=>x.virtualHost == proxy.srcVirtualHost);
      if (!vhost) {
        vhost = {
          virtualHost: proxy.srcVirtualHost,
          locations: []
        };
        virtualHosts.push(vhost);
      }

      let location: VirtualHostLocation = {
        path: proxy.srcPath ? proxy.srcPath : '/',
        proxyPass: {
          protocol: proxy.dstProtocol,
          host: proxy.dstAddress,
          port: proxy.dstPort,
          path: proxy.dstPath
        }
      };
      vhost.locations.push(location);
    }

    return virtualHosts;
  }

  private parseProxies(filtered: { [ key: string ]: string }) {
    let proxies: Proxy[] = [];
    for (let key in filtered) {
      let proxy = this.parseProxy(filtered[key]);
      if (proxy == null) {
        throw new Error(
          `Couldn't parse '${key}' variable with value '${filtered[key]}'. Valid value e.g. 'https://example.com/path->http://1.2.3.4:80/path'`);
      }
      proxies.push(proxy);
    }

    return proxies;
  }

  private parseProxy(val: string): Proxy | null {

    let regex = /^(\w+)\:\/\/([\w.-]+)(\/.*)?->(\w+)\:\/\/([\w.-]+)\:(\d+)(\/.*)?$/;
    let match = regex.exec(val);
    if (match == null) {
      return null;
    }

    return {
      srcProtocol: match[1],
      srcVirtualHost: match[2],
      srcPath: match[3],
      dstProtocol: match[4],
      dstAddress: match[5],
      dstPort: match[6],
      dstPath: match[7]
    };
  }
  
  // get environment variables which starts with PROXY_
  private filterVariables(variables: { [ key: string ]: string }) {
    
    let proxies: { [ key: string ]: string } = {};
    // let variables: { [ key: string ]: string } = process.env;
    for (let key in variables) {
      if (key.startsWith('PROXY_')) {
        proxies[key] = variables[key];
        // proxies.push(variables[key]);
      }
    }

    return proxies;
  }
}
