import { StackAssistView } from "../webview";
import { v4 as uuid } from 'uuid';
import * as moment from 'moment';

export enum MessageDirection {
    SENT,
    RECEIVED
}

export class Message {
    constructor(
        public text: string,
        public direction: MessageDirection,
        public timestamp: Date = new Date(),
        public message_id = uuid().toString()) { }

    public render(view: StackAssistView): string {
        return `
			<li class="sa-message-wrapper sa-message-${MessageDirection[this.direction].toLowerCase()}" id="${this.message_id}">
				<div class="sa-message">
					${this.renderContent(view)}
				</div>
			</li>
		`;
    }

    protected renderContent(view: StackAssistView): string {
        return `
			<div class="sa-message-bubble">
				<div class="sa-message-content">${this.text}</div>
				<div class="sa-message-timestamp">${moment(this.timestamp).format('HH:mm')}</div>
			</div>
		`;
    }
}