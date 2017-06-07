import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

const ejs = require('ejs');
import { Proxy } from './proxy';

export class ConfigGenerator {

  constructor(
    private nginxCertsDir: string,
    private nginxConfdDir: string) {
  }
  
  generate(proxies: Proxy[]) {

    let core = ejs.render(this.loadFile(path.join(
      __dirname, 'templates/core.ejs')), {});
    let vhostsConfig = this.generateVhostsConfig(proxies);

    let config = core + '\n' + vhostsConfig;

    this.ensureConfdDir();
    let outputFilePath = path.join(this.nginxConfdDir, 'default.conf');
    this.saveFile(outputFilePath, config);
  }

  private ensureConfdDir() {
    mkdirp.sync(this.nginxConfdDir);
  }

  private generateVhostsConfig(proxies: Proxy[]) {

    let config = '';
    for (let proxy of proxies) {
      let templateName = this.resolveVhostTemplate(proxy.srcVirtualHost);
      config += this.renderTemplate(proxy, templateName);
      config += '\n\n';
    }

    return config;
  }

  private resolveVhostTemplate(virtualHost: string) {
    let certPath = path.join(this.nginxCertsDir, virtualHost, 'fullchain.pem');

    // use http if there is no already created cert
    let templateName = 'vhost-http.ejs';
    if (fs.existsSync(certPath)) {
      templateName = 'vhost-https.ejs';
    }

    return templateName;
  }

  private renderTemplate(proxy: Proxy, templateName: string) {
    let params = {
      vhost: proxy.srcVirtualHost,
      protocol: proxy.dstProtocol,
      server: proxy.dstAddress,
      port: proxy.dstPort
    };

    let template = this.loadFile(path.join(__dirname,
                                           `templates/${templateName}`));
    return ejs.render(template, params);
  }

  private loadFile(filename: string) {
    return fs.readFileSync(filename, 'utf8')
  }

  private saveFile(filename: string, content: string) {
    fs.writeFileSync(filename, content, 'utf8');
  }
}
