import { StackAssistView } from "../views/webview";
import { Message, MessageDirection } from "./message";
import { ChatbotResult } from "../clients/chatbot-client";
import * as moment from 'moment';

export class ResultsMessage extends Message {
    constructor(text: string, timestamp: Date, message_id: string, public results: ChatbotResult[] = []) {
        super(text, MessageDirection.RECEIVED, timestamp, message_id)
    }

    public renderContent(view: StackAssistView): string {
        var html = `
			<div class="sa-message-bubble">
				<div class="sa-message-content">${this.text}</div>
				<div class="sa-message-timestamp">${moment(this.timestamp).format('HH:mm')}</div>
			</div>
			<ul class="sa-results">
		`;

        for (var result of this.results) {
            html += this.renderResult(view, result);
        }

        html += `	
			</ul>
			<div class="sa-message-footer">`;

        if (view.getSession().useGoogleSearch == true) {
            html += `<button class="sa-message-footer-button sa-button-small sa-button-reduce-search"><i class="fas fa-compress-alt"></i>Reduce to StackOverflow Search</button>`;
        } else {
            html += `<button class="sa-message-footer-button sa-button-small sa-button-expand-search"><i class="fas fa-arrows-alt-h"></i>Expand to Web Search</button>`;
        }

        html += `
			</div>
		`;

        return html;
    }

    private renderResult(view: StackAssistView, result: ChatbotResult) {
        const iconUrl = result.favicon ? result.favicon : view.getResource('icons', 'stackoverflow.svg');
        var html = `
			<li class="sa-result ${result.external ? 'sa-result-external' : ''}" data-url="${result.url}">
				<div class="sa-result-preview">
					<div class="sa-result-thumbnail">
						<img src="${iconUrl}" />
					</div>
					<div class="sa-result-content">
						<div class="sa-result-title">${result.title}</div>
		`;

        if (result.score != null) {
            html += `
				<div class="sa-result-subtitle">
					Score: ${result.score}
				</div>
			`;
        } else if (result.url != '') {
            html += `
				<div class="sa-result-subtitle">
					${result.url}
				</div>
			`;
        }


        html += `
					</div>
					<button class="sa-result-navigate">
						<i class="fas ${result.external ? 'fa-external-link-alt' : 'fa-chevron-right'}"></i>
					</button>
				</div>
		`;

        if (result.external == false) {
            html += `
				<div class="sa-result-details">
					<div class="sa-result-answer">${result.content}</div>
					<a href="${result.url}" class="sa-button sa-button-orange sa-button-small">View on StackOverflow</a>
				</div>
			`;
        }

        html += `</li>`;

        return html;
    }
}