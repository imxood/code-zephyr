/**
 * This module promise-ifies some NodeJS APIs that are frequently used in this
 * ext.
 */ /** */

import * as util from 'util';

import * as fs_ from 'fs';
import * as path from 'path';

import * as rimraf from 'rimraf';

/**
 * Wrappers for the `fs` module.
 *
 * Also has a few utility functions
 */
export namespace fs {

export function exists(fspath: string): Promise<boolean> {
  return new Promise<boolean>((resolve, _reject) => { fs_.exists(fspath, res => resolve(res)); });
}

export const readFile = util.promisify(fs_.readFile);

export const writeFile = util.promisify(fs_.writeFile);

export const readdir = util.promisify(fs_.readdir);

export const mkdir = util.promisify(fs_.mkdir);

export const mkdtemp = util.promisify(fs_.mkdtemp);

export const rename = util.promisify(fs_.rename);

export const stat = util.promisify(fs_.stat);

/**
 * Try and stat() a file. If stat() fails for *any reason*, returns `null`.
 * @param filePath The file to try and stat()
 */
export async function tryStat(filePath: fs_.PathLike): Promise<fs_.Stats|null> {
  try {
    return await stat(filePath);
  } catch (_e) {
    // Don't even bother with the error. Any number of things might have gone
    // wrong. Probably one of: Non-existing file, bad permissions, bad path.
    return null;
  }
}

export const readlink = util.promisify(fs_.readlink);

export const unlink = util.promisify(fs_.unlink);

export const appendFile = util.promisify(fs_.appendFile);

/**
 * Creates a directory and all parent directories recursively. If the file
 * already exists, and is not a directory, just return.
 * @param fspath The directory to create
 */
export async function mkdir_p(fspath: string): Promise<void> {
  const parent = path.dirname(fspath);
  if (!await exists(parent)) {
    await mkdir_p(parent);
  } else {
    if (!(await stat(parent)).isDirectory()) {
      throw new Error('Cannot create ${fspath}: ${parent} is a non-directory');
    }
  }
  if (!await exists(fspath)) {
    await mkdir(fspath);
  } else {
    if (!(await stat(fspath)).isDirectory()) {
      throw new Error('Cannot mkdir_p on ${fspath}. It exists, and is not a directory!');
    }
  }
}

/**
 * Copy a file from one location to another.
 * @param inpath The input file
 * @param outpath The output file
 */
export function copyFile(inpath: string, outpath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const reader = fs_.createReadStream(inpath);
    reader.on('error', e => reject(e));
    reader.on('open', _fd => {
      const writer = fs_.createWriteStream(outpath);
      writer.on('error', e => reject(e));
      writer.on('open', _fd2 => { reader.pipe(writer); });
      writer.on('close', () => resolve());
    });
  });
}

/**
 * Create a hard link of an existing file
 * @param inPath The existing file path
 * @param outPath The new path to the hard link
 */
export function hardLinkFile(inPath: string, outPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs_.link(inPath, outPath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Remove a directory recursively. **DANGER DANGER!**
 * @param dirpath Directory to remove
 */
export function rmdir(dirpath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    rimraf(dirpath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
}
