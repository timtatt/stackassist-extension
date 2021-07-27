// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StackAssistView } from './webview';
import axios from 'axios'
import { ChatbotClient } from './chatbot-client';

export function activate(context: vscode.ExtensionContext) {
	const chatbotClient = new ChatbotClient();
	const view = StackAssistView.createPanel(context, chatbotClient);

	context.subscriptions.push(
		vscode.commands.registerCommand('stackassist.start', () => {
			StackAssistView.createPanel(context, chatbotClient);
		})
	)
}

export function deactivate() { }
