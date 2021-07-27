const vscode = acquireVsCodeApi();
const chatList = document.getElementById('sa-list-chat')
const sendMessageForm = document.getElementById('sa-form-send-message')
const messageField = document.getElementById('sa-field-message');
const resetChatButton = document.getElementById('sa-button-reset-chat');
const wrapper = document.getElementById('sa-wrapper');

document.getElementById('sa-button-check-connection').addEventListener('click', event => {
    vscode.postMessage({
        command: 'checkConnectivity'
    });
});

sendMessageForm.addEventListener('submit', event => {
    event.preventDefault();
    event.stopPropagation();

    var value = messageField.value;

    if (value.trim() != '') {
        vscode.postMessage({
            command: 'sendMessage',
            text: messageField.value,
        })

        messageField.value = ""
    }
});

resetChatButton.addEventListener('click', event => {
    chatList.innerHTML = '';
    vscode.postMessage({
        command: 'resetChat',
    });
})

document.addEventListener('click', event => {
    if (!sendMessageForm.contains(event.target) 
        && window.getSelection().getRangeAt(0).collapsed == true) {
        messageField.focus();
    }
})

window.addEventListener('message', event => {
    switch (event.data.command) {
        case 'newMessage':
            chatList.innerHTML += event.data.renderedMessage;
            return;
        case 'connectivityChanged':
            if (event.data.connected === true && wrapper.classList.contains('sa-lost-connection')) {
                wrapper.classList.remove('sa-lost-connection');
                messageField.disabled = false;
                sendMessageForm.querySelector('button').disabled = false;
            } else if (event.data.connected === false && !wrapper.classList.contains('sa-lost-connection')) {
                wrapper.classList.add('sa-lost-connection');
                messageField.disabled = true;
                sendMessageForm.querySelector('button').disabled = true;
            }
    }
})