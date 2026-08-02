import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const root = resolve();
const output = resolve(root, 'dist');

if (!output.startsWith(`${root}${sep}`)) {
  throw new Error('The build output must stay inside the project directory.');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of ['index.html', 'styles.css', 'script.js', 'config.js']) {
  await cp(resolve(root, file), resolve(output, file));
}

await cp(resolve(root, 'assets'), resolve(output, 'assets'), {
  recursive: true,
  filter: source => !source.includes(`${sep}source-media${sep}`)
});

console.log('Built static production files in dist/.');
