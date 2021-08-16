import axios from 'axios'

export class ChatbotClient {
    private baseUri = "http://stackassist.timtattersall.com.au:5000";

    private getHeaders() {
        return {
            'X-Security-Code': 'st@ckass!st'
        }
    }

    public checkConnectivity(callback: (connected: boolean) => void) {
        axios.get(this.baseUri + '/ping', {
            headers: this.getHeaders()
        })
        .then(_ => callback(true))
        .catch(_ => callback(false))
    }

    public interact(request: ChatbotRequest, callback: (chatbotResponse: ChatbotResponse) => void, errorCallback: () => void) {
        axios.post(this.baseUri + '/chatbot/interact', request, {
            headers: this.getHeaders()
        })
        .then(response => callback(Object.assign(new ChatbotResponse(), response.data.response)))
        .catch(() => errorCallback());
    }

    public estimateContextCounts(context: string[], suggestedContext: string[], callback: (estimateResponse: ChatbotEstimateResponse) => void) {
        axios.post(this.baseUri + '/chatbot/estimate', {
            context: context,
            suggested_context: suggestedContext,
        }, {
            headers: this.getHeaders()
        }).then(response => callback(Object.assign(new ChatbotEstimateResponse(), response.data.response)))
    }

}

export class ChatbotRequest {
    constructor(
        public session_id: string, 
        public message_id: string, 
        public message: string, 
        public context: string[],
        public use_google_search: boolean = false) {}
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
    favicon: string = '';
    external: boolean = false;
}