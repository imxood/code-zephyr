import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ZephyrView {

    constructor(context: vscode.ExtensionContext) {
        const view = vscode.window.createTreeView('zephyr_develop_view', { treeDataProvider: ZephyrConfigDataProvider(), showCollapseAll: true });
        vscode.commands.registerCommand('testView.reveal', async () => {
            const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
            if (key) {
                await view.reveal({ key }, { focus: true, select: false });
            }
        });
    }
}

const tree = {
    'configure': {},
    'build': {},
    'flash': {},
    'clean': {}
};
let nodes = {};

function ZephyrConfigDataProvider(): vscode.TreeDataProvider<{ key: string }> {
    return {
        getChildren: (element: { key: string }): { key: string }[] => {
            return getChildren(element ? element.key : undefined).map(key => getNode(key));
        },
        getTreeItem: (element: { key: string }): vscode.TreeItem => {
            const treeItem = getTreeItem(element.key);
            treeItem.id = element.key;
            return treeItem;
        },
        getParent: ({ key }: { key: string }): { key: string } => {
            const parentKey = key.substring(0, key.length - 1);
            return parentKey ? new Key(parentKey) : void 0;
        }
    };
}

function getChildren(key: string): string[] {
    if (!key) {
        return Object.keys(tree);
    }
    let treeElement = getTreeElement(key);
    if (treeElement) {
        return Object.keys(treeElement);
    }
    return [];
}

function getTreeItem(key: string): vscode.TreeItem {
    const treeElement = getTreeElement(key);
    return {
        label: key,
        tooltip: `Tooltip for ${key}`,
        collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        command: {
            command: 'zephyr.develop',
            title: '',
            arguments: [key]
        }
    };
}

function getTreeElement(element): any {
    let parent = tree;
    for (let i = 0; i < element.length; i++) {
        parent = parent[element.substring(0, i + 1)];
        if (!parent) {
            return null;
        }
    }
    return parent;
}

function getNode(key: string): { key: string } {
    if (!nodes[key]) {
        nodes[key] = new Key(key);
    }
    return nodes[key];
}

class Key {
    constructor(readonly key: string) { }
}
