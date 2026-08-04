// Jest ejecuta setupFiles antes de importar los archivos de test (y por tanto
// antes de que AppModule evalúe su ConfigModule.forRoot({ validationSchema })).
// globalSetup ya arrancó los contenedores y escribió las URLs en
// .testcontainers/test-env.json; aquí se inyectan al proceso del worker.
import { readFileSync } from 'fs';
import { join } from 'path';

const envFile = join(__dirname, '..', '..', '.testcontainers', 'test-env.json');
const env = JSON.parse(readFileSync(envFile, 'utf-8')) as Record<string, string>;
for (const [key, value] of Object.entries(env)) {
  process.env[key] = value;
}
