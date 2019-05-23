import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

const ejs = require('ejs');
import { HttpsVirtualHost, VirtualHostLocation } from './https-virtual-host';

export class ConfigGenerator {

  constructor(
    private nginxCertsDir: string,
    private nginxConfdDir: string) {
  }
  
  generate(vhosts: HttpsVirtualHost[]) {

    let core = ejs.render(this.loadFile(path.join(
      __dirname, 'templates/core.ejs')), {});
    let vhostsConfig = this.generateVhostsConfig(vhosts);

    let config = core + '\n' + vhostsConfig;

    this.ensureConfdDir();
    let outputFilePath = path.join(this.nginxConfdDir, 'default.conf');

    this.saveFile(outputFilePath, config);
  }

  private ensureConfdDir() {
    mkdirp.sync(this.nginxConfdDir);
  }

  private generateVhostsConfig(vhosts: HttpsVirtualHost[]) {

    let config = '';
    for (let vhost of vhosts) {
      let templateName = this.resolveVhostTemplate(vhost.virtualHost);
      config += this.renderVhost(vhost, templateName);
      config += '\n\n';
    }

    return config;
  }

  // Check whether there is certificate file for the virtual host.
  // If found, use the https template; otherwise the http one.
  private resolveVhostTemplate(virtualHost: string) {
    let certPath = path.join(this.nginxCertsDir, virtualHost, 'fullchain.pem');

    // use http if there is no already created cert
    let templateName = 'vhost-http.ejs';
    if (fs.existsSync(certPath)) {
      templateName = 'vhost-https.ejs';
    }

    return templateName;
  }

  private renderVhost(vhost: HttpsVirtualHost, templateName: string) {

    let locations = vhost.locations
          .map(x => this.renderLocation(x))
          .reduce((prev, current) => prev + current);

    const acmeChallengeLocation = this.renderAcmeChallengeLocation(vhost.fallbackAcmeChallengeLocation);

    let params = {
      vhost: vhost.virtualHost,
      locations: locations,
      acme_challenge_location: acmeChallengeLocation,
    };

    let template = this.loadFile(path.join(__dirname,
                                           `templates/${templateName}`));
    return ejs.render(template, params);
  }

  private renderLocation(location: VirtualHostLocation) {

    let proxyPass = location.proxyPass;
    
    let params = {
      path: location.path,
      destinationProtocol: proxyPass.protocol,
      destinationServer: proxyPass.host,
      destinationPort: proxyPass.port,
      destinationPath: proxyPass.path
    }

    let template = this.loadFile(path.join(__dirname,
                                           `templates/location.ejs`));
    return ejs.render(template, params);
  }

  private renderAcmeChallengeLocation(location: VirtualHostLocation) {
    let params = {};
    let tmplFile;

    if (location) {
      const proxyPass = location.proxyPass;

      params = {
        destinationProtocol: proxyPass.protocol,
        destinationServer: proxyPass.host,
        destinationPort: proxyPass.port,
        destinationPath: proxyPass.path
      }

      tmplFile = `templates/acme-challenge-location-with-fallback.ejs`;
    } else {
      tmplFile = `templates/acme-challenge-location.ejs`;
    }

    const tmpl = this.loadFile(path.join(__dirname, tmplFile));
    return ejs.render(tmpl, params);
  }

  private loadFile(filename: string) {
    return fs.readFileSync(filename, 'utf8')
  }

  private saveFile(filename: string, content: string) {
    fs.writeFileSync(filename, content, 'utf8');
  }
}
