import { exec } from 'child_process';

export enum RequestCertificateResult {
  success,
  renewNotRequired,
}

export class CertificateClient {

  constructor(private simp_lePath: string,
              private wwwRoot: string) {
  }
  
  async request(domain: string) {
    let cmd = `${this.simp_lePath} -f account_reg.json -f account_key.json -f key.pem -f fullchain.pem -d ${domain} --default_root ${this.wwwRoot}`;

    return new Promise<RequestCertificateResult>((resolve, reject) => {

      let exitCode = 0;
      
      exec(cmd, (err: any, stdout: string, stderr: string) => {

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
