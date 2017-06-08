import { Proxy } from './proxy';
import { ConfigGenerator } from './config-generator';
import { CertificateGenerator, DomainCertificateResult } from './certificate-generator';
import { ConfigPreparer } from './config-preparer';
import { EnvironmentVariablesParser } from './environment-variables-parser';
import { NginxReloader, NginxReloadResult } from './nginx-reloader';
import * as debug from 'debug';

let d = debug('Main');

export class Main {

  constructor(
    private variableParser: EnvironmentVariablesParser,
    private configGenerator: ConfigGenerator,
    private configPreparer: ConfigPreparer,
    private certificateGenerator: CertificateGenerator,
    private nginxReloader: NginxReloader) {
  }
  
  async start() {

    // copy default config
    d('preparing configuration directory...');
    this.prepareConfig();

    // parse the environment variables
    d('parsing environment variables...');
    let proxies = this.parseProxies();
    d('parsed proxies', proxies);
    
    // generate nginx config, maybe with http only
    d('generating configuration...');
    this.generateConfig(proxies);

    // reload it
    d('reloading NGINX...');
    await this.reloadNginx();

    // request the certificates
    d('requesting certificates...');
    let certificatesResult = await this.requestCertificates(proxies);
    d('certificate request result', certificatesResult);
    
    if (certificatesResult.success.length > 0) {

      // there were succeeded domains
      
      // generate new config with https
      d('there are new certificates, generating config again...');
      this.generateConfig(proxies);

      // reload the nginx finally
      d('reloading NGINX...');
      await this.reloadNginx();
    }

    d('process finished');

    return certificatesResult;
  }

  private parseProxies() {
    return this.variableParser.parse(process.env);
  }

  private prepareConfig() {
    this.configPreparer.prepare();
  }

  private generateConfig(proxies: Proxy[]) {
    this.configGenerator.generate(proxies);
  }

  private async requestCertificates(proxies: Proxy[]) {
    
    let results = await this.certificateGenerator.generate(
      proxies.map(x=>x.srcVirtualHost));

    let errors = results.filter(x=>x.result == DomainCertificateResult.error);
    let success = results.filter(x=>x.result == DomainCertificateResult.success);
    let notChanged = results.filter(x=>x.result == DomainCertificateResult.renewNotRequired);

    return {
      success: success,
      errors: errors,
      notChanged: notChanged
    };
  }

  private async reloadNginx() {

    try {
      let result = await this.nginxReloader.reload();

      if (result == NginxReloadResult.success) {
        return;
      }

      if (result == NginxReloadResult.missingEnvironmentVariable) {
        console.error('NGINX_CONTAINER environment variable is missing, please set it to the nginx\' full container name.');
      }
    } catch (err) {
      console.error(`Couldn't reload the NGINX, continuing, error: `, err);
    }
  }
}
