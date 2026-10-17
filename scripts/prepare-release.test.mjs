import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./prepare-release.mjs', import.meta.url));

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'prepare-release-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const packages = {
        core: { name: '@test/core', version: '0.1.0' },
        addon: {
            name: '@test/addon', version: '0.2.0',
            dependencies: { '@test/core': '>=0.1.0', external: '^2.0.0' },
            peerDependencies: { '@test/core': '^0.1.0' },
            devDependencies: { '@test/core': '^0.1.0' },
            optionalDependencies: { '@test/core': '^0.1.0' }
        },
        private: { name: '@test/private', version: '0.0.1', private: true }
    };
    const lock = { lockfileVersion: 3, packages: { '': { name: 'root' } } };
    for (const [name, manifest] of Object.entries(packages)) {
        mkdirSync(join(root, 'packages', name), { recursive: true });
        writeFileSync(join(root, 'packages', name, 'package.json'), JSON.stringify(manifest));
        lock.packages[`packages/${name}`] = structuredClone(manifest);
    }
    writeFileSync(join(root, 'package-lock.json'), JSON.stringify(lock));
    const read = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
    const run = (tag, prerelease = 'false') => spawnSync(process.execPath, [script], {
        cwd: root, encoding: 'utf8',
        env: { ...process.env, RELEASE_TAG: tag, RELEASE_PRERELEASE: prerelease, GITHUB_OUTPUT: join(root, 'output') }
    });
    return { root, read, run };
}

test('versions public packages and internal dependencies, keeping the lockfile aligned', t => {
    const { root, read, run } = fixture(t);
    const result = run('v1.2.3');
    assert.equal(result.status, 0, result.stderr);
    const addon = read('packages/addon/package.json');
    assert.equal(read('packages/core/package.json').version, '1.2.3');
    assert.equal(addon.version, '1.2.3');
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        assert.equal(addon[section]['@test/core'], '1.2.3');
        assert.deepEqual(read('package-lock.json').packages['packages/addon'][section], addon[section]);
    }
    assert.equal(addon.dependencies.external, '^2.0.0');
    assert.equal(read('packages/private/package.json').version, '0.0.1');
    assert.equal(read('package-lock.json').packages['packages/private'].version, '0.0.1');
    assert.equal(read('package-lock.json').packages['packages/core'].version, '1.2.3');
    assert.match(readFileSync(join(root, 'output'), 'utf8'), /dist_tag=latest/);
});

for (const [tag, prerelease] of [['1.2.3-rc.1', 'false'], ['v1.2.3', 'true']]) {
    test(`uses next for prerelease ${tag} (GitHub prerelease: ${prerelease})`, t => {
        const { root, run } = fixture(t);
        const result = run(tag, prerelease);
        assert.equal(result.status, 0, result.stderr);
        assert.match(readFileSync(join(root, 'output'), 'utf8'), /dist_tag=next/);
    });
}

for (const tag of ['', 'release-1.2.3', 'v01.2.3', '1.2.3-01', '1.2.3\n', '1.2.3\nmalicious=value']) {
    test(`rejects invalid tag ${JSON.stringify(tag)} before editing packages`, t => {
        const { read, run } = fixture(t);
        assert.notEqual(run(tag).status, 0);
        assert.equal(read('packages/core/package.json').version, '0.1.0');
        assert.equal(read('package-lock.json').packages['packages/core'].version, '0.1.0');
    });
}
