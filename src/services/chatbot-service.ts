import { ChatbotClient } from "../clients/chatbot-client";
import { ChatSession } from "../models/chat-session";
import { Message, MessageDirection } from "../models/message";
import { ResultsMessage } from "../models/results-message";
import { TooManyResultsMessage } from "../models/too-many-results-message";

export class ChatbotService {
    
    constructor(private chatbotClient: ChatbotClient) {}

    public getChatbotMessage(session: ChatSession, message: Message | null, callback: (message: Message) => void, errorCallback: () => void = ()=>{}) {
        this.chatbotClient.interact(session.createChatbotRequest(message), chatbotResponse => {
            session.context = chatbotResponse.context
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
        }, errorCallback);
    }
}