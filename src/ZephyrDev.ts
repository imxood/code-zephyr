import * as vscode from 'vscode';
import * as iconv from 'iconv-lite';
import * as proc from './proc'
import * as logging from './logging'
import { expandString } from './expand'

const log = logging.createLogger('zephyr');

export class ZephyrDev {

    config: vscode.WorkspaceConfiguration;

    cmakePath: string;
    buildDirectory: string;
    configureArgs: [];
    environment: string;
    sourceDirectory: string;

    async getConfig() {

        log.info("zephyr config:");

        this.config = vscode.workspace.getConfiguration('zephyr', vscode.Uri.parse(vscode.workspace.rootPath));

        this.cmakePath = this.config.get<string>("cmakePath");
        this.buildDirectory = this.config.get<string>("buildDirectory");
        this.configureArgs = this.config.get<[]>("configureArgs");
        // this.environment = this.config.get<string>("environment");
        this.sourceDirectory = this.config.get<string>("sourceDirectory");

        var opts = {
            vars: {
                workspaceRoot: vscode.workspace.rootPath,
                workspaceFolder: '',
                userHome: '',
                buildKit: '',
                buildType: '',
                generator: '',
                workspaceRootFolderName: ''
            },
        };

        this.cmakePath = await expandString(this.cmakePath, opts);
        this.buildDirectory = await expandString(this.buildDirectory, opts);
        // this.configureArgs = await expandString(this.configureArgs, opts);
        this.sourceDirectory = await expandString(this.sourceDirectory, opts);

        log.info("cmakePath: ", this.cmakePath);
        log.info("buildDirectory: ", this.buildDirectory);
        log.info("configureArgs: ", this.configureArgs);
        // log.info("environment: ", this.environment);
        log.info("sourceDirectory: ", this.sourceDirectory);

    }

    async configure() {

        log.info("configure()");

        await this.getConfig();

        const res = await proc.execute(this.cmakePath, this.configureArgs, { shell: true }).result;

        if (res.retc === 0) {
            log.info(res.stdout);
            log.info("configure success");
        } else {
            log.error(res.stderr);
            log.error("configure error");
        }
    }

    async build() {

        log.info("build()");

        await this.getConfig();

        const res = await proc.execute("pwd", [], { shell: true }).result;
        if (res.retc === 0) {
            log.info(res.stdout);
            log.info("build success");
        } else {
            log.error(res.stderr);
            log.error("build error");
        }
    }

    async flash() {

        log.info("flash()");

        await this.getConfig();

        const res = await proc.execute("pwd", [], { shell: true }).result;
        if (res.retc === 0) {
            log.info(res.stdout);
            log.info("flash success");
        } else {
            log.error(res.stderr);
            log.error("flash error");
        }
    }

    async clean() {

        log.info("clean()");

        await this.getConfig();

        const res = await proc.execute("pwd", [], { shell: true }).result;
        if (res.retc === 0) {
            log.info(res.stdout);
            log.info("clean success");
        } else {
            log.error(res.stderr);
            log.error("clean error");
        }
    }
}


