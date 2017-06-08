import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as debug from 'debug';

import { Proxy } from './proxy';
import { CertificateClient,
         RequestCertificateResult } from './certificate-client';

export enum DomainCertificateResult {
  success,
  renewNotRequired,
  error
}

interface DomainResult {
  domain: string;
  result: DomainCertificateResult;
}

export class CertificateGenerator {

  constructor(
    private certsDir: string,
    private certificateClient: CertificateClient) {
  }
  
  async generate(domains: string[]) {

    let results: DomainResult[] = [];
    
    for (let domain of domains) {

      let certDir = path.join(this.certsDir, domain);
      mkdirp.sync(certDir);

      let cwd = process.cwd();
      process.chdir(certDir);
      try {
        let result = await this.certificateClient.request(domain);
        results.push({ domain: domain, result: this.mapResult(result)});
      }
      catch (err) {
        // there was error with the domain, add the result
        results.push({ domain: domain, result: DomainCertificateResult.error });
        console.error(err);
      }
      finally {
        // change current directory back
        process.chdir(cwd);
      }
    }

    return results;
  }

  private mapResult(result: RequestCertificateResult) {
    switch (result) {
    case RequestCertificateResult.renewNotRequired:
      return DomainCertificateResult.renewNotRequired;
    case RequestCertificateResult.success:
      return DomainCertificateResult.success;
    default:
      throw new Error('not supported');
    }
  }
}

