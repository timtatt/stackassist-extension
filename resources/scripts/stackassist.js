const vscode = acquireVsCodeApi();
const chatList = document.getElementById('sa-list-chat')
const sendMessageForm = document.getElementById('sa-form-send-message')
const messageField = document.getElementById('sa-field-message');
const resetChatButton = document.getElementById('sa-button-reset-chat');

sendMessageForm.addEventListener('submit', event => {
    event.preventDefault();
    event.stopPropagation();

    vscode.postMessage({
        command: 'sendMessage',
        text: messageField.value,
    })

    messageField.value = ""
});

resetChatButton.addEventListener('click', event => {
    chatList.innerHTML = '';
    vscode.postMessage({
        command: 'resetChat',
    });
})

document.addEventListener('click', event => {
    if (sendMessageForm.contains(event.target)) {
        console.log('contains form element')
    } else {
        messageField.focus();
    }
})

window.addEventListener('message', event => {
    switch (event.data.command) {
        case 'newMessage':
            chatList.innerHTML += event.data.renderedMessage;
            return;
    }
})