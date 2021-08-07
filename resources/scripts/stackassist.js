($ => {
    $(() => {
        const vscode = acquireVsCodeApi();
        const chatList = $('#sa-list-chat');
        const sendMessageForm = $('#sa-form-send-message');
        const messageField = $('#sa-field-message');
        const resetChatButton = $('#sa-button-reset-chat');
        const wrapper = $('#sa-wrapper');
        const context = $('.sa-context');

        $('#sa-button-check-connection').on('click', event => {
            vscode.postMessage({
                command: 'checkConnectivity'
            });
        });

        sendMessageForm.on('submit', event => {
            event.preventDefault();
            event.stopPropagation();

            var value = messageField.val().trim();

            if (value != '') {
                wrapper.addClass('sa-loading');
                vscode.postMessage({
                    command: 'sendMessage',
                    text: value,
                })

                messageField.val('')
            }
        });

        resetChatButton.on('click', event => {
            chatList.html('');
            context.html('');
            wrapper.removeClass('sa-loading');
            vscode.postMessage({
                command: 'resetChat',
            });
        })

        $(document).on('click', event => {
            if (!$.contains(sendMessageForm, event.target)
                && window.getSelection().getRangeAt(0).collapsed == true) {
                messageField.focus();
            }
        })

        context.on('click', '.sa-context-item', event => {
            const element = $(event.currentTarget);
            const contextItem = element.text();
            vscode.postMessage({
                command: 'removeContext',
                context: [contextItem]
            });
        })

        window.addEventListener('message', event => {
            switch (event.data.command) {
                case 'newMessage':
                    if (event.data.direction == 'received') {
                        wrapper.removeClass('sa-loading');
                    }

                    var element = $(event.data.renderedMessage);
                    context.html(event.data.renderedContext);
                    registerMessageEvents(element);
                    chatList.append(element)
                    return;
                case 'connectivityChanged':
                    if (event.data.connected === true && wrapper.hasClass('sa-lost-connection')) {
                        wrapper.removeClass('sa-lost-connection');
                        messageField.disabled = false;
                        sendMessageForm.find('button').disabled = false;
                    } else if (event.data.connected === false && !wrapper.hasClass('sa-lost-connection')) {
                        wrapper.addClass('sa-lost-connection');
                        wrapper.removeClass('sa-loading');
                        messageField.disabled = true;
                        sendMessageForm.find('button').disabled = true;
                    }
                    return;
                case 'estimatesReceived':
                    const message = chatList.find('#' + event.data.message_id);
                    message.find('.sa-additional-context .sa-context-option').each((i, e) => {
                        const element = $(e);
                        const checkbox = element.find('input[type=checkbox]');
                        const estimate = checkbox.is(':checked') ? 
                            event.data.count :
                            event.data.estimates[checkbox.attr('name')];

                        element.find('.counter').html(estimate);
                    });
                    return;
            }
        })

        const getEstimates = (form) => {
            var selected_context = [];
            var suggested_context = [];

            const message = form.closest('.sa-message-wrapper');
            form.closest('.sa-additional-context')
                .find('input[type=checkbox]')
                .each((i, e) => {
                    var element = $(e);
                    if (element.is(':checked')) {
                        selected_context.push(element.attr('name'));
                    } else {
                        suggested_context.push(element.attr('name'));
                    }
                });

            vscode.postMessage({
                command: 'getEstimates',
                message_id: message.attr('id'),
                selected_context,
                suggested_context
            });
        }

        const registerMessageEvents = (messageElement) => {
            getEstimates(messageElement.find('.sa-additional-context'));
            messageElement.find('.sa-context-option input').on('change', event => {
                const form = $(event.target);
                getEstimates(form);
            });

            messageElement.find('.sa-additional-context').on('submit', event => {
                event.preventDefault();
                event.stopPropagation();

                const form = $(event.target);
                var additional_context = [];
                form.find('input[type=checkbox]:checked').each((i, e) => {
                    const element = $(e);
                    additional_context.push(element.attr('name'));
                    element.prop('disabled', true);
                });
                vscode.postMessage({
                    command: 'addContext',
                    additional_context
                });
            });

            messageElement.find('.sa-button-reduce-search').on('click', event => {
                $(event.currentTarget).attr('disabled', true);
                wrapper.addClass('sa-loading');
                vscode.postMessage({
                    command: 'changeScope',
                    useGoogleSearch: false,
                });
            });

            messageElement.find('.sa-button-expand-search').on('click', event => {
                $(event.currentTarget).attr('disabled', true);
                wrapper.addClass('sa-loading');
                vscode.postMessage({
                    command: 'changeScope',
                    useGoogleSearch: true,
                });
            });

            messageElement.find('.sa-result').each((i, e) => {
                const result = $(e);
                if (result.hasClass('sa-result-external')) {
                    result.on('click', event => {
                        const url = $(event.currentTarget).data('url');
                        vscode.postMessage({
                            command: 'openUrl',
                            url: url,
                        });
                    });
                } else {
                    result.find('.sa-result-preview').on('click', event => {
                        const result = $(event.currentTarget).parent();
                        result.toggleClass('expanded');
                        result.find('.sa-result-details').slideToggle(200);
                    });
                }
            });            
        }
    })
})(jQuery)