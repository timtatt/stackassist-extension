import { v4 as uuid } from 'uuid';
import { Message } from './message';
import { ChatbotRequest } from '../chatbot-client';

export class ChatSession {
    session_id: string;
    context: string[];
    messages: any = {};
    chronologicalMessages: string[] = [];
    useGoogleSearch: boolean = true;

    constructor() {
        this.session_id = uuid().toString()
        this.context = [];
    }

    public createChatbotRequest(message: Message | null): ChatbotRequest {
        return message == null ?
            new ChatbotRequest(
                this.session_id,
                uuid().toString(),
                '',
                this.context,
                this.useGoogleSearch) :
            new ChatbotRequest(
                this.session_id,
                message.message_id,
                message.text,
                this.context,
                this.useGoogleSearch);
    }

    public addMessage(message: Message) {
        this.messages[message.message_id] = message;
        this.chronologicalMessages.push(message.message_id);
    }

    public getMessagesChronologically(): Message[] {
        return this.chronologicalMessages.map(message_id => this.messages[message_id]);
    }

    public toggleGoogleSearch(useGoogleSearch: boolean) {
        this.useGoogleSearch = useGoogleSearch;
    }

}