import * as vscode from 'vscode';
import { ChatbotClient } from './chatbot-client';
import { Message, MessageDirection } from './models/message';
import { ResultsMessage } from './models/results-message';
import { TooManyResultsMessage } from './models/too-many-results-message';
import { ChatSession } from './models/chat-session';

export class StackAssistView {
	private extensionUri:  vscode.Uri;
	private chatbotClient:  ChatbotClient;
	private panel:  vscode.WebviewPanel;
	private session:  ChatSession = new ChatSession();

	constructor(extensionUri: vscode.Uri, panel: vscode.WebviewPanel, chatbotClient: ChatbotClient) {
		this.extensionUri = extensionUri;
		this.panel = panel;
		this.chatbotClient = chatbotClient;

		panel.webview.onDidReceiveMessage(event => {
			switch (event.command) {
				case 'sendMessage':
					const message = new Message(event.text, MessageDirection.SENT)
					this.session.addMessage(message)
					panel.webview.postMessage({
						command: 'newMessage',
						direction: 'sent',
						renderedMessage: message.render(this)
					})
					this.getChatbotMessage(message, receivedMessage => {
						panel.webview.postMessage({
							command: 'newMessage',
							direction: 'received',
							renderedContext: this.renderContext(),
							renderedMessage: receivedMessage.render(this)
						})
					});
					return;
				case 'changeScope':
					this.session.useGoogleSearch = event.useGoogleSearch;
					this.updateSessionParameters();
				case 'openUrl':
					vscode.env.openExternal(vscode.Uri.parse(event.url))
					return;
				case 'resetChat':
					this.resetChat();
					return;
				case 'checkConnectivity':
					this.checkConnectivity();
					return;
				case 'addContext':
					this.session.context = this.session.context.concat(event.additional_context);
					this.updateSessionParameters();
					return;
				case 'removeContext':
					this.session.context = this.session.context.filter(item => !event.context.includes(item))
					this.updateSessionParameters();
					return;
				case 'getEstimates':
					this.chatbotClient.estimateContextCounts(this.session.context.concat(event.selected_context), event.suggested_context, response => {
						panel.webview.postMessage({
							command: 'estimatesReceived',
							message_id: event.message_id,
							count: response.count,
							estimates: response.estimates
						})
					})
					return;
			}
		})

		panel.webview.html = this.render();

		this.checkConnectivity();
		setInterval(() => this.checkConnectivity(), 30000);
	}

	static createPanel(context: vscode.ExtensionContext, chatbotClient: ChatbotClient) {
		const panel = vscode.window.createWebviewPanel('stackassist', 'StackAssist', vscode.ViewColumn.Two, {
			enableScripts: true,
		});

		return new StackAssistView(context.extensionUri, panel, chatbotClient);
	}

	private updateSessionParameters() {
		this.getChatbotMessage(null, receivedMessage => {
			this.panel.webview.postMessage({
				command: 'newMessage',
				direction: 'received',
				renderedContext: this.renderContext(),
				renderedMessage: receivedMessage.render(this)
			})
		});
	}

	private checkConnectivity() {
		this.chatbotClient.checkConnectivity(connected => 
			this.panel.webview.postMessage({
				command: 'connectivityChanged',
				connected: connected
			}))
	}

	private resetChat() {
		this.session = new ChatSession();
	}

	private getChatbotMessage(message: Message | null, callback: (message: Message) => void) {
		this.chatbotClient.interact(this.session.createChatbotRequest(message), chatbotResponse => {
			this.session.context = chatbotResponse.context
			var message;
			switch (chatbotResponse.response_type) {
				case 'RESULTS':
					console.log(chatbotResponse.results)
					message = new ResultsMessage(
						chatbotResponse.text, 
						chatbotResponse.timestamp, 
						chatbotResponse.message_id,
						chatbotResponse.results);
					break;
				case 'TOO_MANY_RESULTS':
					message = new TooManyResultsMessage(
						chatbotResponse.text, 
						chatbotResponse.timestamp, 
						chatbotResponse.message_id,
						chatbotResponse.results, 
						chatbotResponse.suggested_context);
					break;
				default:
					message = new Message(
						chatbotResponse.text,
						MessageDirection.RECEIVED,
						chatbotResponse.timestamp,
						chatbotResponse.message_id);
			}
			callback(message)
		})
	}

	public getResource(type: string, filename: string) {
		return this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'resources/' + type, filename));
	}

	public getSession() {
		return this.session;
	}

	private render() {
		return `
				<html>
					<head>
						<meta charset="UTF-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" /> 
						<title>StackAssist</title>
						<link rel="stylesheet" href="${this.getResource('style/fontawesome/css', 'all.min.css')}" />
						<link rel="stylesheet" href="${this.getResource('style', 'stackassist.css')}" />
					</head>
					<body>
						<div class="sa-wrapper" id="sa-wrapper">
							<div class="sa-toolbar">
								<button id="sa-button-reset-chat"><i class="fas fa-trash"></i>Reset Chat</button>
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
								<div class="sa-typing">
									<div class="sa-ellipsis">
										<span></span>
										<span></span>
										<span></span>
									</div>
								</div>
								<ul class="sa-chat" id="sa-list-chat">
									${this.renderMessages()}
								</ul>
								<div class="sa-conversation-buffer"></div>
							</div>
							<div class="sa-footer">
								<ul class="sa-context">${this.renderContext()}</ul>
								<form action="#" id="sa-form-send-message">
									<input type="text" name="message" id="sa-field-message" placeholder="Start typing.." />
									<button type="submit">Send</button>
								</form>
							</div>
						</div>
						<script src="${this.getResource('scripts', 'jquery-3.6.0.min.js')}"></script>
						<script src="${this.getResource('scripts', 'stackassist.js')}"></script>
					</body>
				</html>
			`;
	}

	private renderContext() {
		var html = '';
		for (var context of this.session.context) {
			html += `<li class="sa-context-item">${context}</li>`;
		} 
		return html;
	}

	private renderMessages() {
		return this.session.getMessagesChronologically()
			.map(message => message.render(this)).join('');
	}
}
