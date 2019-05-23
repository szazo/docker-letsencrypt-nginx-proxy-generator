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
    let proxyVarsFiltered = this.filterVariables(env, 'PROXY_');

    // filter ACME_CHALLENGE_PROXY_* variables
    let acmeChallengeVarsFiltered = this.filterVariables(env, 'ACME_CHALLENGE_PROXY_');

    // parse variables
    let proxies = this.parseProxies(proxyVarsFiltered);
    let acmeChallengeProxies = this.parseProxies(acmeChallengeVarsFiltered);
    this.validateAcmeChallengeProxies(acmeChallengeProxies);

    // get https proxies
    let httpsVirtualHosts = this.groupHttpsProxies(proxies, acmeChallengeProxies);

    return httpsVirtualHosts;
  }

  private validateAcmeChallengeProxies(acmeChallengeProxies: Proxy[]) {
    for (let acmeChallengeProxy of acmeChallengeProxies) {
      if (acmeChallengeProxy.srcPath && acmeChallengeProxy.srcPath != '/')
        throw new Error(`Error in acme challenge proxy config of vhost ${acmeChallengeProxy.srcVirtualHost}: ${acmeChallengeProxy.srcPath} source path not supported here, use only without path!`);
    }
  }

  private groupHttpsProxies(proxies: Proxy[], acmeChallengeProxies: Proxy[]) {

    let httpsProxies = proxies.filter(x=>x.srcProtocol == 'https');

    let virtualHosts: HttpsVirtualHost[] = [];
    for (let proxy of httpsProxies) {

      let vhost = virtualHosts.find(x=>x.virtualHost == proxy.srcVirtualHost);
      if (!vhost) {
        vhost = {
          virtualHost: proxy.srcVirtualHost,
          locations: [],
          fallbackAcmeChallengeLocation: null,
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

    for (let proxy of acmeChallengeProxies) {

      let vhost = virtualHosts.find(x=>x.virtualHost == proxy.srcVirtualHost);
      if (vhost) {
        vhost.fallbackAcmeChallengeLocation = {
          path: proxy.srcPath ? proxy.srcPath : '/',
          proxyPass: {
            protocol: proxy.dstProtocol,
            host: proxy.dstAddress,
            port: proxy.dstPort,
            path: proxy.dstPath
          }
        };
      }
    }

    return virtualHosts;
  }

  private parseProxies(filtered: { [ key: string ]: string }) {
    let proxies: Proxy[] = [];
    for (let key in filtered) {
      let proxy = this.parseProxy(key, filtered[key]);
      proxies.push(proxy);
    }

    return proxies;
  }

  private parseProxy(variable: string, val: string): Proxy {

    let regex = /^(\w+)\:\/\/([\w.-]+)(\/.*)?->(\w+)\:\/\/([\w.-]+)\:(\d+)(\/.*)?$/;
    let match = regex.exec(val);
    if (match == null) {
      throw new Error(
        `Couldn't parse '${variable}' variable with value '${val}'. Valid value e.g. 'https://example.com/path->http://1.2.3.4:80/path'`);
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

  // get environment variables which starts with prefix
  private filterVariables(variables: { [ key: string ]: string }, prefix: string) {
    
    let proxies: { [ key: string ]: string } = {};
    for (let key in variables) {
      if (key.startsWith(prefix)) {
        proxies[key] = variables[key];
      }
    }

    return proxies;
  }
}
