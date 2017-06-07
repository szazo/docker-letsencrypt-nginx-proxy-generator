import * as http from 'http';

export class NginxReloader {

  async reload() {

		let nginxContainer = process.env['NGINX_CONTAINER'];
		if (!nginxContainer) {
			throw new Error('NGINX_CONTAINER environment variable is missing, please set it to the nginx\' full container name.');
		}

    return new Promise((resolve, reject) => {

			let signal = 'SIGHUP';
			let path = `/containers/${nginxContainer}/kill?signal=${signal}`;
			let method = 'POST';
			
			let options = {
				socketPath: '/var/run/docker.sock',
				path: path,
				method: method
			};

			let request = http.request(options, (response) => {

				if (response.statusCode < 200 || response.statusCode > 299) {
					reject(new Error('Failed to load page, status code: ' + response.statusCode));
					return;
				}
				
				let body = '';
				response.on('data', chunk => body += chunk);
				response.on('end', () => resolve(body));
			});

			request.on('error', err => {
				reject(err)
			});
			
			request.end();
		});
	}
}

