"""Exercise the Apache template with fake public content, never application data.
macOS: python3 backend/scripts/apache-smoke.py
Other Unix: pass --httpd and --modules for an installed Apache 2.4.
This tests routing/denial, not PHP execution or Windows runtime compatibility.
"""
import argparse
import pathlib
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--httpd', default='/usr/sbin/httpd')
parser.add_argument('--modules', default='/usr/libexec/apache2')
args = parser.parse_args()

def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]

with tempfile.TemporaryDirectory(prefix='vv-apache-') as temp:
    root = pathlib.Path(temp)
    project = root / 'htdocs' / 'Velvet-Vogue'
    public = project / 'backend' / 'public'
    public.mkdir(parents=True)
    (root / 'logs').mkdir()
    (public / 'index.php').write_text('front-controller-fixture')
    (public / 'debug.php').write_text('private-fixture')
    (public / '.env').write_text('private-fixture')
    for name in ['.env', 'composer.json', 'src/internal.php', 'config/database.php', 'database/schema.sql', 'storage/logs/app.log', 'vendor/autoload.php']:
        target = project / 'backend' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text('private-fixture')
    api_port, default_port = free_port(), free_port()
    template = (pathlib.Path(__file__).parents[1] / 'deploy/apache/xampp.conf').read_text()
    template = template.replace('C:/xampp/htdocs/Velvet-Vogue', str(project)).replace('8081', str(api_port))
    modules = ['mpm_prefork', 'authz_core', 'authz_host', 'unixd', 'dir', 'log_config', 'rewrite']
    config = '\n'.join(f'LoadModule {name}_module "{args.modules}/mod_{name}.so"' for name in modules)
    config += f'\nServerRoot "{root}"\nPidFile "{root}/httpd.pid"\nServerName localhost\nErrorLog "{root}/error.log"\n'
    config += f'Listen 127.0.0.1:{default_port}\nDocumentRoot "{root}/htdocs"\n<Directory "{root}/htdocs">\nRequire all granted\n</Directory>\n'
    config += f'Mutex file:{root} default\n'
    config += template
    config_path = root / 'httpd.conf'
    config_path.write_text(config)
    subprocess.run([args.httpd, '-t', '-f', str(config_path)], check=True)
    server = subprocess.Popen([args.httpd, '-DFOREGROUND', '-f', str(config_path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
    try:
        for attempt in range(50):
            try:
                with socket.create_connection(('127.0.0.1', api_port), timeout=0.2):
                    break
            except OSError:
                if server.poll() is not None:
                    raise RuntimeError(server.stderr.read().decode())
                time.sleep(0.1)
        cases = [(api_port, '/api/v1/health?check=1', 200), (api_port, '/index.php', 200), (api_port, '/.env', 403), (api_port, '/debug.php', 403)]
        for name in ['.env', 'composer.json', 'src/internal.php', 'config/database.php', 'database/schema.sql', 'storage/logs/app.log', 'vendor/autoload.php', 'public/index.php']:
            cases.append((default_port, '/Velvet-Vogue/backend/' + name, 403))
        for port, route, expected in cases:
            try:
                response = urllib.request.urlopen(f'http://127.0.0.1:{port}{route}')
            except urllib.error.HTTPError as error:
                response = error
            body = response.read().decode()
            assert response.status == expected, (route, response.status, expected, body, (root / 'logs/velvet-vogue-error.log').read_text())
            assert 'private-fixture' not in body, route
            if expected == 200:
                assert body == 'front-controller-fixture', body
        print(f'{len(cases)} Apache routing/private-path checks passed (fixture content, no PHP execution).')
    finally:
        server.terminate()
        server.communicate(timeout=10)
