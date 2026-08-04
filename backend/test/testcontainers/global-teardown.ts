import { stopTestContainers } from './connection';

export default async function globalTeardown(): Promise<void> {
  await stopTestContainers();
}
