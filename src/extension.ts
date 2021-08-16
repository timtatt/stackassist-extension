// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StackAssistView } from './views/webview';
import axios from 'axios'
import { ChatbotClient } from './clients/chatbot-client';

export function activate(context: vscode.ExtensionContext) {
	const chatbotClient = new ChatbotClient();
	// StackAssistView.createPanel(context, chatbotClient);

	context.subscriptions.push(
		vscode.commands.registerCommand('stackassist.start', () => {
			StackAssistView.createPanel(context, chatbotClient);
		})
	)
}

export function deactivate() { }
