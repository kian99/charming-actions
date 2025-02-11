import * as artifact from '@actions/artifact';
import { exec } from '@actions/exec';
import * as fs from 'fs';
import * as glob from '@actions/glob';

class Artifact {
  async uploadLogs() {
    const basePath = '/home/runner/snap/charmcraft/common/cache/charmcraft/log';
    const sudoPath = '/root/snap/charmcraft/common/cache/charmcraft/log';
    // We're running some charmcraft commands as sudo as others as a
    // regular user - we want to capture both.

    // First check if the path created by sudo invocations of charmcraft
    // exists.
    const dirExistsExitCode = await exec('sudo', ['test', '-d', sudoPath], {
      ignoreReturnCode: true,
    });
    if (dirExistsExitCode === 0) {
      // Make sure the directory we're copying to exists as well.
      if (!fs.existsSync(basePath)) {
        await exec('mkdir', ['-p', basePath]);
      }
      await exec('sudo', ['cp', '-r', `${sudoPath}/.`, basePath]);
    }

    if (!fs.existsSync(basePath)) {
      return 'No charmcraft logs generated, skipping artifact upload.';
    }

    const globber = await glob.create(`${basePath}/*.log`);
    const files = await globber.glob();
    const artifacts = artifact.create();

    const result = await artifacts.uploadArtifact(
      'charmcraft-logs',
      files,
      basePath
    );

    return `Artifact upload result: ${JSON.stringify(result)}`;
  }
}

export { Artifact };
