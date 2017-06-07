import { Proxy } from './proxy';
import { ConfigGenerator } from './config-generator';
import { CertificateGenerator, DomainCertificateResult } from './certificate-generator';
import { ConfigPreparer } from './config-preparer';
import { EnvironmentVariablesParser } from './environment-variables-parser';
import { NginxReloader } from './nginx-reloader';
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
    this.prepareConfig();

    // parse the environment variables
    let proxies = this.parseProxies();
    
    // generate nginx config, maybe with http only
    this.generateConfig(proxies);

    // reload it
    await this.reloadNginx();

    // request the certificates
    let certificatesResult = await this.requestCertificates(proxies);
    
    if (certificatesResult.success.length > 0) {

      // there were succeeded domains
      
      // generate new config with https
      this.generateConfig(proxies);

      // reload the nginx finally
      await this.reloadNginx();
    }

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
    this.nginxReloader.reload();
  }
}
