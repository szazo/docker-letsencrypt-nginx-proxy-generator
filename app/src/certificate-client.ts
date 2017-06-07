import { exec } from 'child_process';
import * as debug from 'debug';

let d = debug('CertificateClient');

export enum RequestCertificateResult {
  success,
  renewNotRequired,
}

export class CertificateClient {

  constructor(private simp_lePath: string,
              private wwwRoot: string) {
  }
  
  async request(domain: string) {
    let cmd = `${this.simp_lePath} -f account_key.json -f key.pem -f fullchain.pem -d ${domain} --default_root ${this.wwwRoot}`;

    return new Promise<RequestCertificateResult>((resolve, reject) => {

      let exitCode = 0;
      
      exec(cmd, (err: any, stdout: string, stderr: string) => {

        d(`simp_le stdout for ${domain}`, stdout);
        
        if (err) {
          if (exitCode == 1) {
            resolve(RequestCertificateResult.renewNotRequired);
            return;
          }

          reject(err);
          return;
        }

        resolve(RequestCertificateResult.success);
        
      }).on('exit', code => {
        exitCode = code;
      });
    });
  }
}
