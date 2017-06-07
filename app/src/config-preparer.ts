import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

export class ConfigPreparer {

  constructor(private nginxVhostdDir: string) {
  }

  prepare() {
    mkdirp.sync(this.nginxVhostdDir);

    fs.writeFileSync(path.join(this.nginxVhostdDir, 'default'),
                     fs.readFileSync(path.join(
                       __dirname, 'templates/well-known-location.conf')));
  }
}
