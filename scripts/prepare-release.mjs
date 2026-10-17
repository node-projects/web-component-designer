import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const version = (process.env.RELEASE_TAG ?? '').replace(/^v/, '');
const numeric = '(0|[1-9][0-9]*)';
const identifier = '(?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)';
const semver = new RegExp(`^${numeric}\\.${numeric}\\.${numeric}(?:-${identifier}(?:\\.${identifier})*)?$`);
if (version !== version.trim() || !semver.test(version)) {
    throw new Error('Release tag must be an npm version such as v1.2.3 or v1.2.3-rc.1.');
}

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const packages = readdirSync('packages', { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
        const path = `packages/${entry.name}`;
        return { path, manifest: readJson(`${path}/package.json`) };
    })
    .filter(pkg => !pkg.manifest.private);
const names = new Set(packages.map(pkg => pkg.manifest.name));
const lock = readJson('package-lock.json');

for (const { path, manifest } of packages) {
    manifest.version = version;
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        for (const name of Object.keys(manifest[section] ?? {})) {
            if (names.has(name)) manifest[section][name] = version;
        }
    }
    const locked = lock.packages[path];
    locked.version = version;
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        if (manifest[section]) locked[section] = { ...manifest[section] };
    }
    writeJson(`${path}/package.json`, manifest);
}
writeJson('package-lock.json', lock);

const distTag = version.includes('-') || process.env.RELEASE_PRERELEASE === 'true' ? 'next' : 'latest';
if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ndist_tag=${distTag}\n`);
}
console.log(`Prepared ${packages.length} packages at ${version} (npm tag: ${distTag}).`);
