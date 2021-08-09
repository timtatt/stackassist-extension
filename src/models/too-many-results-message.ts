import { ResultsMessage } from "./results-message";
import { ChatbotResult } from "../chatbot-client";
import * as moment from 'moment';

export class TooManyResultsMessage extends ResultsMessage {
    constructor(text: string, timestamp: Date, message_id: string, results: ChatbotResult[], public suggested_context: string[] = []) {
        super(text, timestamp, message_id, results);
    }

    public renderContent(): string {
        var html = `
			<div class="sa-message-bubble">
				<div class="sa-message-content">${this.text}</div>
				<div class="sa-message-timestamp">${moment(this.timestamp).format('HH:mm')}</div>
			</div>
			<form class="sa-additional-context">
				<div class="sa-context-grid">
		`;

        for (var context of this.suggested_context) {
            html += `
				<label class="sa-context-option">
					<input type="checkbox" name="${context}" value="true">
					<span class="sa-context-option-inner">
						<span>${context}</span>
						<span class="counter">-</span>
					</span>
				</label>
			`;
        }

        html += `
				</div>
				<div class="sa-message-footer">
					<button class="sa-message-footer-button"><i class="fas fa-plus"></i>Add to Search</button>
				</div>
			</form>
		`;
        return html;
    }
}

