/**
 * Wrappers and utilities around the NodeJS `child_process` module.
 */ /** */

import * as proc from 'child_process';
import * as iconv from 'iconv-lite';

import { createLogger } from './logging';

const log = createLogger('proc');

export interface EnvironmentVariables { [key: string]: string; }

export interface ExecutionOptions {
    environment?: EnvironmentVariables;
    shell?: boolean;
    silent?: boolean;
    cwd?: string;
    encoding?: BufferEncoding;
    outputEncoding?: string;
}

export interface ExecutionResult {
    retc: number | null;
    stdout: string;
    stderr: string;
}

export interface Subprocess {
    result: Promise<ExecutionResult>;
    child: proc.ChildProcess;
}

function mergeEnvironment(...env: EnvironmentVariables[]): EnvironmentVariables {
    return env.reduce((acc, vars) => {
        if (process.platform === 'win32') {
            // Env vars on windows are case insensitive, so we take the ones from
            // active env and overwrite the ones in our current process env
            const norm_vars = Object.getOwnPropertyNames(vars).reduce<EnvironmentVariables>((acc2, key: string) => {
                acc2[key.toUpperCase()] = vars[key];
                return acc2;
            }, {});
            return { ...acc, ...norm_vars };
        } else {
            return { ...acc, ...vars };
        }
    }, {});
}

/**
 * Escape a string so it can be used as a regular expression
 */
function escapeStringForRegex(str: string): string { return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'); }

/**
 * Replace all occurrences of `needle` in `str` with `what`
 * @param str The input string
 * @param needle The search string
 * @param what The value to insert in place of `needle`
 * @returns The modified string
 */
export function replaceAll(str: string, needle: string, what: string) {
    const pattern = escapeStringForRegex(needle);
    const re = new RegExp(pattern, 'g');
    return str.replace(re, what);
}

export function normalizeEnvironmentVarname(varname: string) {
    return process.platform == 'win32' ? varname.toLocaleLowerCase() : varname;
}

export function execute(command: string, args: string[], options?: ExecutionOptions): Subprocess {
    if (options && options.silent !== true) {
        log.info('Executing command: '
            // This is only shown to the user
            + [command]
                .concat(args)
                .map(a => a.replace('"', '\"'))
                .map(a => /[ \n\r\f;\t]/.test(a) ? `"${a}"` : a)
                .join(' '));
    }
    if (!options) {
        options = {};
    }
    const final_env = mergeEnvironment(process.env as EnvironmentVariables, options.environment || {});

    const spawn_opts: proc.SpawnOptions = {
        env: final_env,
        shell: !!options.shell,
    };

    if (options && options.cwd) {
        spawn_opts.cwd = options.cwd;
    }

    const child: proc.ChildProcess = proc.spawn(command, args, spawn_opts);

    if (options.encoding)
        child.stdout.setEncoding(options.encoding);

    const encoding = options.outputEncoding ? options.outputEncoding : 'utf8';

    const result = new Promise<ExecutionResult>((resolve, reject) => {

        let stdout_acc = '';
        let line_acc = '';
        let stderr_acc = '';
        let stderr_line_acc = '';

        child.on('error', err => { reject(err); });

        child.stdout.on('data', (data: Uint8Array) => {
            const str = iconv.decode(Buffer.from(data), encoding);
            const lines = str.split('\n').map(l => l.endsWith('\r') ? l.substr(0, l.length - 1) : l);
            while (lines.length > 1) {
                line_acc += lines[0];
                line_acc = '';
                // Erase the first line from the list
                lines.splice(0, 1);
            }
            console.assert(lines.length, 'Invalid lines', JSON.stringify(lines));
            line_acc += lines[0];
            stdout_acc += str;
        });

        child.stderr.on('data', (data: Uint8Array) => {
            const str = data.toString();
            const lines = str.split('\n').map(l => l.endsWith('\r') ? l.substr(0, l.length - 1) : l);
            while (lines.length > 1) {
                stderr_line_acc += lines[0];
                stderr_line_acc = '';
                // Erase the first line from the list
                lines.splice(0, 1);
            }
            console.assert(lines.length, 'Invalid lines', JSON.stringify(lines));
            stderr_line_acc += lines[0];
            stderr_acc += str;
        });

        // Don't stop until the child stream is closed, otherwise we might not read
        // the whole output of the command.
        child.on('close', retc => {
            try {
                resolve({ retc, stdout: stdout_acc, stderr: stderr_acc });
            } catch (_) {
                // No error handling since Rollbar has taken the error.
                resolve({ retc, stdout: stdout_acc, stderr: stderr_acc });
            }
        });
    });

    return { child, result };
}
