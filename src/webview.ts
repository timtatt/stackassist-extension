import { dir, time } from 'console';
import * as vscode from 'vscode';
import axios from 'axios';
import { ChatbotClient, ChatbotRequest, ChatbotResult } from './chatbot-client';
import { v4 as uuid } from 'uuid';
import * as moment from 'moment';

export class StackAssistView {
	private extensionUri: vscode.Uri;
	private chatbotClient: ChatbotClient;
	private panel: vscode.WebviewPanel;
	private session: ChatSession = new ChatSession();
	private messages: Message[] = [];

	constructor(extensionUri: vscode.Uri, panel: vscode.WebviewPanel, chatbotClient: ChatbotClient) {
		this.extensionUri = extensionUri;
		this.panel = panel;
		this.chatbotClient = chatbotClient;

		panel.webview.onDidReceiveMessage(event => {
			switch (event.command) {
				case 'sendMessage':
					const message = new Message(event.text, MessageDirection.SENT)
					this.messages.push(message);
					panel.webview.postMessage({
						command: 'newMessage',
						renderedMessage: message.render()
					})
					this.getChatbotMessage(message.text, receivedMessage => {
						panel.webview.postMessage({
							command: 'newMessage',
							renderedMessage: receivedMessage.render()
						})
					});
					return;
				case 'resetChat':
					this.resetChat();
					return;
				case 'checkConnectivity':
					this.checkConnectivity();
					return;
			}
		})

		panel.webview.html = this.render(panel.webview);

		this.checkConnectivity();
		setInterval(() => this.checkConnectivity(), 5000);
	}

	static createPanel(context: vscode.ExtensionContext, chatbotClient: ChatbotClient) {
		const panel = vscode.window.createWebviewPanel('stackassist', 'StackAssist', vscode.ViewColumn.Two, {
			enableScripts: true,
		});

		return new StackAssistView(context.extensionUri, panel, chatbotClient);
	}

	private checkConnectivity() {
		this.chatbotClient.checkConnectivity(connected => 
			this.panel.webview.postMessage({
				command: 'connectivityChanged',
				connected: connected
			}))
	}

	private resetChat() {
		this.messages = [];
	}

	private getChatbotMessage(input: string, callback: (message: Message) => void) {
		this.chatbotClient.interact(this.session.createChatbotRequest(input), chatbotResponse => {
			console.log(chatbotResponse);
			var message;
			switch (chatbotResponse.response_type) {
				case 'RESULTS':
					message = new ResultsMessage(
						chatbotResponse.text, 
						chatbotResponse.timestamp, 
						chatbotResponse.results);
					break;
				case 'TOO_MANY_RESULTS':
					message = new TooManyResultsMessage(
						chatbotResponse.text, 
						chatbotResponse.timestamp, 
						chatbotResponse.results, 
						chatbotResponse.suggested_context);
					break;
				default:
					message = new Message(
						chatbotResponse.text,
						MessageDirection.RECEIVED,
						chatbotResponse.timestamp);
			}
			callback(message)
		})
	}

	private render(webview: vscode.Webview) {
		const fontAwesomeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'resources/style/fontawesome/css', 'all.min.css'));
		const stylesheetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'resources/style', 'stackassist.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'resources/scripts', 'stackassist.js'));

		return `
				<html>
					<head>
						<meta charset="UTF-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" /> 
						<title>StackAssist</title>
						<link rel="stylesheet" href="${fontAwesomeUri}" />
						<link rel="stylesheet" href="${stylesheetUri}" />
					</head>
					<body>
						<div class="sa-wrapper" id="sa-wrapper">
							<div class="sa-toolbar">
								<button id="sa-button-reset-chat">Reset Chat</button>
							</div>
							<div class="sa-alert-wrapper">
								<div id="sa-alert-lost-connection" class="sa-alert">
									<div class="sa-alert-message">Unable to connect to StackAssist server</div>
									<a class="sa-alert-action" id="sa-button-check-connection">
										<i class="fas fa-sync"></i>
									</a>
								</div>
							</div>
							<div class="sa-conversation">
								<ul class="sa-chat" id="sa-list-chat">
									${this.renderMessages()}
								</ul>
								<div class="sa-conversation-buffer"></div>
							</div>
							<div class="sa-footer">
								<ul class="sa-context">
									<li class="sa-context-item">docker</li>
									<li class="sa-context-item">network</li>
								</ul>
								<form action="#" id="sa-form-send-message">
									<input type="text" name="message" id="sa-field-message" placeholder="Start typing.." />
									<button type="submit">Send</button>
								</form>
							</div>
						</div>
						<script src="${scriptUri}"></script>
					</body>
				</html>
			`;
	}

	private renderMessages() {
		return this.messages.map(message => message.render()).join('')
	}
}

enum MessageDirection {
	SENT,
	RECEIVED
}

class Message {
	timestamp: Date;
	text: string;
	direction: MessageDirection;

	constructor(text: string, direction: MessageDirection, timestamp: Date = new Date()) {
		this.text = text;
		this.direction = direction;
		this.timestamp = timestamp;
	}

	public render() {
		return `
			<li class="sa-message-wrapper sa-message-${MessageDirection[this.direction].toLowerCase()}">
				<div class="sa-message">
					<div class="sa-message-content">${this.text}</div>
					<div class="sa-message-timestamp">${moment(this.timestamp).format('HH:mm')}</div>
				</div>
			</li>
		`;
	}
}

class ResultsMessage extends Message {
	results: ChatbotResult[] = [];

	constructor(text: string, timestamp: Date, results: ChatbotResult[]) {
		super(text, MessageDirection.RECEIVED, timestamp)
		this.results = results;
	}
}

class TooManyResultsMessage extends ResultsMessage {
	suggested_context: string[] = [];
	
	constructor(text: string, timestamp: Date, results: ChatbotResult[], suggested_context: string[]) {
		super(text, timestamp, results);
		this.suggested_context = suggested_context;
	}
}

class ChatSession {
	session_id: string;
	context: string[];
	messages: any = {};

	constructor() {
		this.session_id = uuid().toString()
		this.context = [];
	}

	public createChatbotRequest(input: string): ChatbotRequest {
		return new ChatbotRequest(this.session_id, input, this.context);
	}

}