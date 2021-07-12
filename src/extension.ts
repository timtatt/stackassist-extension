// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StackAssistView } from './webview';

export function activate(context: vscode.ExtensionContext) {

	StackAssistView.createPanel(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('stackassist.start', () => {
			StackAssistView.createPanel(context);
		})
	)
}

export function deactivate() { }
