import { Proxy } from './proxy';

export class EnvironmentVariablesParser {

  parse(env: { [ key: string ]: string }) {

    // filter PROXY_* variables
    let filtered = this.filterVariables(env);

    // parse variables
    let proxies: Proxy[] = [];
    for (let key in filtered) {
      let proxy = this.parseProxy(filtered[key]);
      if (proxy == null) {
        throw new Error(
          `Couldn't parse '${key}' variable with value '${filtered[key]}'. Valid value e.g. 'https://example.com->http://1.2.3.4:80'`);
      }
      proxies.push(proxy);
    }

    return proxies;
  }

  private parseProxy(val: string): Proxy | null {

    let regex = /^(\w+)\:\/\/([\w.]+)->(\w+)\:\/\/([\w.]+)\:(\d+)$/;
    let match = regex.exec(val);
    if (match == null) {
      return null;
    }

    return {
      srcProtocol: match[1],
      srcVirtualHost: match[2],
      dstProtocol: match[3],
      dstAddress: match[4],
      dstPort: match[5]
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
