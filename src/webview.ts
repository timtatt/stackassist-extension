import { dir } from 'console';
import * as vscode from 'vscode';
import axios from 'axios';

export class StackAssistView {
	private extensionUri: vscode.Uri;
	private panel?: vscode.WebviewPanel;
	private messages: Message[] = [
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message", MessageDirection.RECEIVED),
		new Message("This is a chat message that I sent", MessageDirection.SENT),
		new Message("This is a chat message", MessageDirection.RECEIVED),
	];

	constructor(extensionUri: vscode.Uri, panel: vscode.WebviewPanel) {
		this.extensionUri = extensionUri;

		panel.webview.onDidReceiveMessage(event => {
			switch (event.command) {
				case 'sendMessage':
					const message = new Message(event.text, MessageDirection.SENT)
					this.messages.push(message);
					panel.webview.postMessage({
						command: 'newMessage',
						renderedMessage: message.render()
					})
					this.getResponse(message.message, receivedMessage => {
						panel.webview.postMessage({
							command: 'newMessage',
							renderedMessage: receivedMessage.render()
						})
					});
					return;
				case 'resetChat':
					this.resetChat();
					return;
			}
		})

		panel.webview.html = this.render(panel.webview);
	}

	static createPanel(context: vscode.ExtensionContext) {
		const panel = vscode.window.createWebviewPanel('stackassist', 'Stack Assist', vscode.ViewColumn.Two, {
			enableScripts: true,
		});

		return new StackAssistView(context.extensionUri, panel);
	}

	private resetChat() {
		this.messages = [];
	}

	private getResponse(input: string, callback: (message: Message) => void) {
		axios.post('http://localhost:5000/chatbot/interact', {
			message: input,
			session_id: 'someuuid',
			context: []
		}, {
			headers: {
				'X-Security-Code': 'st@ckass!st'
			}
		}).then(response => {
			console.log(response)
			callback(new Message(response.data.message, MessageDirection.RECEIVED, new Date(response.data.timestamp)))
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
						<div class="sa-wrapper">
							<div class="sa-toolbar">
								<button id="sa-button-reset-chat">Reset Chat</button>
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
	message: string;
	direction: MessageDirection;

	constructor(message: string, direction: MessageDirection, timestamp: Date = new Date()) {
		this.message = message;
		this.direction = direction;
		this.timestamp = timestamp;
	}

	private getMessageSender() {
		switch (this.direction) {
			case MessageDirection.SENT:
				return 'You';
			case MessageDirection.RECEIVED:
				return 'StackAssist Bot';
		}
	}

	public render() {
		return `
			<li class="sa-message-wrapper sa-message-${MessageDirection[this.direction].toLowerCase()}">
				<div class="sa-message">
					<div class="sa-message-content">${this.message}</div>
					<div class="sa-message-timestamp">12:40</div>
				</div>
			</li>
		`;
	}
}