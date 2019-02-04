// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';

import { ZephyrView } from './ZephyrView';
import { ZephyrDev } from './ZephyrDev';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const zephyrDev = new ZephyrDev();

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let command1 = vscode.commands.registerCommand('zephyr.helloWorld', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    let command2 = vscode.commands.registerCommand('zephyr.develop', (key) => {
        switch (key) {
            case "configure":
                zephyrDev.configure();
                break;

            case "build":
                zephyrDev.build();
                break;

            case "flash":
                zephyrDev.flash();
                break;

            case "clean":
                zephyrDev.clean();
                break;
        }
    });

    context.subscriptions.push(command2);

    new ZephyrView(context);

    console.log('extension "code-test" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() { }
