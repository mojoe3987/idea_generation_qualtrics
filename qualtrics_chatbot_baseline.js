Qualtrics.SurveyEngine.addOnload(function() {
    var questionContainer = this.getQuestionContainer();
    var chatHistory = []; // Array to store all messages
    
    // CONFIGURATION - UPDATE THESE VALUES
    var BACKEND_API_URL = 'https://your-app.render.com'; // Your Render backend URL
    var API_SECRET_KEY = 'your-secret-key'; // Your API secret key
    var STUDY_ID = 'dining_table_study_baseline'; // BASELINE condition study ID
    
    // Add CSS for copy protection
    var style = document.createElement('style');
    style.textContent = `
        .no-copy {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        .no-copy::selection {
            background: transparent;
        }
        
        .no-copy::-moz-selection {
            background: transparent;
        }
        
        .protected-content {
            pointer-events: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
    `;
    document.head.appendChild(style);
    
    // Add copy protection event listeners
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.no-copy') || e.target.closest('.protected-content')) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.target.closest('.no-copy') || e.target.closest('.protected-content')) {
            if (e.ctrlKey && (e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88 || e.keyCode === 83)) {
                e.preventDefault();
            }
        }
    });
    
    // Create main container
    var mainContainer = document.createElement('div');
    mainContainer.style.cssText = 'max-width: 600px; margin: 20px auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;';
    
    // Create chat header
    var chatHeader = document.createElement('div');
    chatHeader.innerHTML = '<h3 style="margin: 0; color: #333; font-weight: 500;">Idea Generation Assistant</h3>';
    chatHeader.style.cssText = 'background: #f8f9fa; padding: 16px; border-bottom: 1px solid #ddd; text-align: center;';
    
    // Create chat box with copy protection
    var chatBox = document.createElement('div');
    chatBox.id = 'chatbox';
    chatBox.className = 'no-copy';
    chatBox.style.cssText = 'height: 400px; overflow-y: auto; padding: 16px; background-color: #fff;';
    
    // Create input container
    var inputContainer = document.createElement('div');
    inputContainer.style.cssText = 'display: flex; padding: 16px; background: #f8f9fa; border-top: 1px solid #ddd; gap: 8px;';
    
    var input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = 'flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 14px;';
    input.placeholder = 'Type your message here...';
    
    var sendBtn = document.createElement('button');
    sendBtn.innerHTML = 'Send';
    sendBtn.style.cssText = 'padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
    
    // Button hover effect
    sendBtn.addEventListener('mouseenter', function() {
        this.style.background = '#0056b3';
    });
    sendBtn.addEventListener('mouseleave', function() {
        this.style.background = '#007bff';
    });

    // Assemble the interface
    inputContainer.appendChild(input);
    inputContainer.appendChild(sendBtn);
    
    mainContainer.appendChild(chatHeader);
    mainContainer.appendChild(chatBox);
    mainContainer.appendChild(inputContainer);
    questionContainer.appendChild(mainContainer);

    // Function to create message bubbles
    function createMessageBubble(sender, message, isUser) {
        var messageWrapper = document.createElement('div');
        messageWrapper.style.cssText = 'margin-bottom: 12px;';
        
        var senderLabel = document.createElement('div');
        senderLabel.innerHTML = sender;
        senderLabel.style.cssText = 'font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #666;';
        
        var messageBubble = document.createElement('div');
        var bubbleStyle = isUser 
            ? 'background: #e3f2fd; border-left: 3px solid #2196f3; margin-left: 20px;'
            : 'background: #f5f5f5; border-left: 3px solid #666;';
        
        messageBubble.style.cssText = 'padding: 12px; border-radius: 4px; word-wrap: break-word; line-height: 1.4; ' + bubbleStyle;
        messageBubble.innerHTML = message;
        
        messageWrapper.appendChild(senderLabel);
        messageWrapper.appendChild(messageBubble);
        
        return messageWrapper;
    }

    // Add initial welcome message
    var welcomeMessage = createMessageBubble('Assistant', 'Hello! I\'m here to help you generate creative ideas. Please make a request.', false);
    chatBox.appendChild(welcomeMessage);
    
    // Add initial bot message to chat history
    chatHistory.push({
        sender: "Assistant",
        message: "Hello! I'm here to help you generate creative ideas. Please make a request.",
        timestamp: new Date().toISOString()
    });

    function saveChatToQualtrics() {
        var chatJSON = JSON.stringify(chatHistory);
        Qualtrics.SurveyEngine.setEmbeddedData('chatHistory', chatJSON);
    }

    function showTypingIndicator() {
        var typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.style.cssText = 'margin-bottom: 12px;';
        
        var senderLabel = document.createElement('div');
        senderLabel.innerHTML = 'Assistant';
        senderLabel.style.cssText = 'font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #666;';
        
        var typingBubble = document.createElement('div');
        typingBubble.style.cssText = 'padding: 12px; border-radius: 4px; background: #f5f5f5; border-left: 3px solid #666; color: #666;';
        typingBubble.innerHTML = 'Thinking...';
        
        typingDiv.appendChild(senderLabel);
        typingDiv.appendChild(typingBubble);
        chatBox.appendChild(typingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        return typingDiv;
    }

    async function callBackendAPI(userMessage) {
        // Build conversation history for backend
        var messages = [];
        
        // Add chat history to context (last 10 messages)
        var recentHistory = chatHistory.slice(-10);
        for (var i = 0; i < recentHistory.length; i++) {
            var historyItem = recentHistory[i];
            if (historyItem.sender === "User") {
                messages.push({
                    role: "user",
                    content: historyItem.message
                });
            } else if (historyItem.sender === "Assistant") {
                messages.push({
                    role: "assistant",
                    content: historyItem.message
                });
            }
        }

        // Call backend API with RAG DISABLED
        const response = await fetch(BACKEND_API_URL + '/api/generate-diverse-idea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + API_SECRET_KEY
            },
            body: JSON.stringify({
                currentMessage: userMessage,
                conversationHistory: messages,
                studyId: STUDY_ID,
                participantId: Qualtrics.SurveyEngine.getEmbeddedData('ResponseID') || 'anonymous',
                sessionId: Qualtrics.SurveyEngine.getEmbeddedData('Q_Session') || '',
                useRAG: false  // RAG DISABLED for baseline condition
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    }

    sendBtn.onclick = function() {
        var userMsg = input.value.trim();
        if (!userMsg) {
            input.style.borderColor = '#dc3545';
            setTimeout(function() {
                input.style.borderColor = '#ddd';
            }, 2000);
            return;
        }
        
        // Disable input while processing
        input.disabled = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = 'Sending...';
        
        // Add user message to history
        chatHistory.push({
            sender: "User",
            message: userMsg,
            timestamp: new Date().toISOString()
        });
        
        // Add user message to display
        var userMessage = createMessageBubble('You', userMsg, true);
        chatBox.appendChild(userMessage);
        
        input.value = '';
        
        // Show typing indicator
        var typingIndicator = showTypingIndicator();

        // Call backend API
        callBackendAPI(userMsg)
        .then(function(botResponse) {
            // Remove typing indicator
            chatBox.removeChild(typingIndicator);
            
            // Add bot response
            var botMessage = createMessageBubble('Assistant', botResponse, false);
            chatBox.appendChild(botMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
            
            // Add bot response to history
            chatHistory.push({
                sender: "Assistant",
                message: botResponse,
                timestamp: new Date().toISOString()
            });
            
            // Save updated chat to Qualtrics
            saveChatToQualtrics();
        })
        .catch(function(err) {
            console.error("Error:", err);
            var errorMsg = "Sorry, I'm having trouble connecting to the service. Please try again.";
            
            // Remove typing indicator
            if (chatBox.contains(typingIndicator)) {
                chatBox.removeChild(typingIndicator);
            }
            
            // Add error message
            var errorMessage = createMessageBubble('Assistant', errorMsg, false);
            chatBox.appendChild(errorMessage);
            
            // Add error to history
            chatHistory.push({
                sender: "Assistant",
                message: errorMsg,
                timestamp: new Date().toISOString()
            });
            
            // Save updated chat to Qualtrics
            saveChatToQualtrics();
        })
        .finally(function() {
            // Re-enable input
            input.disabled = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send';
            input.focus();
        });
    };
    
    // Allow Enter key to send message
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !input.disabled) {
            sendBtn.click();
        }
    });
    
    // Save chat when participant moves to next question
    Qualtrics.SurveyEngine.addOnUnload(function() {
        saveChatToQualtrics();
    });
});