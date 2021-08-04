import axios from 'axios'

export class ChatbotClient {
    private base_uri = "http://localhost:5000";

    private getHeaders() {
        return {
            'X-Security-Code': 'st@ckass!st'
        }
    }

    public checkConnectivity(callback: (connected: boolean) => void) {
        axios.get(this.base_uri + '/ping', {
            headers: this.getHeaders()
        })
        .then(_ => callback(true))
        .catch(_ => callback(false))
    }

    public interact(request: ChatbotRequest, callback: (chatbotResponse: ChatbotResponse) => void) {
        axios.post(this.base_uri + '/chatbot/interact', request, {
            headers: this.getHeaders()
        }).then(response => callback(Object.assign(new ChatbotResponse(), response.data.response)))
    }

    public estimateContextCounts(context: string[], suggested_context: string[], callback: (estimateResponse: ChatbotEstimateResponse) => void) {
        axios.post(this.base_uri + '/chatbot/estimate', {
            context: context,
            suggested_context: suggested_context,
        }, {
            headers: this.getHeaders()
        }).then(response => callback(Object.assign(new ChatbotEstimateResponse(), response.data.response)))
    }

}

export class ChatbotRequest {
    session_id:  string;
    message_id: string;
    message:  string;
    context:  string[];

    constructor(session_id: string, message_id: string, message: string, context: string[]) {
        this.session_id = session_id;
        this.message_id = message_id;
        this.message = message;
        this.context = context;
    }
}

export class ChatbotResponse {
    context:  string[] = [];
    response_type:  string = '';
    results:  ChatbotResult[] = [];
    suggested_context:  string[] = [];
    text:  string = '';
    timestamp:  Date = new Date();
    message_id: string = '';
}

export class ChatbotEstimateResponse {
    count: number = 0;
    estimates: any = {};
}

export class ChatbotResult {
    content: string = '';
    title: string = '';
    snippet: string = '';
    url: string = '';
    score: number = 0;
}