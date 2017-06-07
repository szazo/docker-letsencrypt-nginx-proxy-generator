import { EnvironmentVariablesParser } from './environment-variables-parser';
import { ConfigPreparer } from './config-preparer';
import { ConfigGenerator } from './config-generator';
import { CertificateGenerator } from './certificate-generator';
import { CertificateClient } from './certificate-client';
import { Main } from './main';
import { NginxReloader } from './nginx-reloader';

let args = process.argv.slice(2);

if (args.length != 4) {
  console.log('USAGE: node refresh-certs.js <nginx-confd-dir> <nginx-vhostd-dir> <nginx-html-dir> <nginx-certs-dir>');
  process.exit(1);
} else {

  let nginxConfdDir = args[0];
  let nginxVhostdDir = args[1];
  let nginxHtmlDir = args[2];
  let nginxCertsDir = args[3];

  let main = new Main(new EnvironmentVariablesParser(),
                      new ConfigGenerator(nginxCertsDir, nginxConfdDir),
                      new ConfigPreparer(nginxVhostdDir),
                      new CertificateGenerator(nginxCertsDir,
                                               new CertificateClient(
                                                 '/simp_le/venv/bin/simp_le',
                                                 nginxHtmlDir)),
                      new NginxReloader());
  main.start()
        .then((result) => {

          if (result.success.length > 0) {
            console.log(`Certificate successfully requested / renewed for the following domains:`, result.success.map(x=>x.domain));
          }
          
          if (result.errors.length > 0) {
            console.error(`Couldn't request certificate for the following domains, see log for details:`, result.errors.map(x=>x.domain));
            process.exit(1);
          }
        })
        .catch((err) => {
          console.error(err);

          process.exit(1);
        });
}

