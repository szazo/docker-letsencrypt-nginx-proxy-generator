import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

export class ConfigPreparer {

  constructor(private nginxVhostdDir: string) {
  }

  prepare() {
    mkdirp.sync(this.nginxVhostdDir);

    const files = ['acme-challenge-location', 'acme-challenge-location-with-fallback'];

    for (const file of files) {
      fs.writeFileSync(path.join(this.nginxVhostdDir, file),
      fs.readFileSync(path.join(
        __dirname, `templates/${file}.conf`)));
    }
  }
}
