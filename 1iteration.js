// GPT-4o Integration for Qualtrics - Plain Text Interface
// This code creates a simple text interface within Qualtrics that connects to Mistral AI

Qualtrics.SurveyEngine.addOnload(function() {
    // Configuration with hardcoded API key
    const MISTRAL_API_KEY = "C0JWs6KIzxchL0r8GrzvIwooTNe88sOJ"; // Your Mistral API key
    const MISTRAL_MODEL = "ministral-8b-latest"; // Using Mistral's small model
    
    // Create the main container
    const container = document.createElement("div");
    container.id = "gpt-container";
    container.style.width = "100%";
    container.style.maxWidth = "800px";
    container.style.margin = "0 auto";
    container.style.fontFamily = "Arial, sans-serif";
    
    // Input area
    const inputArea = document.createElement("div");
    inputArea.style.marginBottom = "20px";
    
    const userInputLabel = document.createElement("label");
    userInputLabel.htmlFor = "user-input";
    userInputLabel.textContent = "Your prompt:";
    userInputLabel.style.display = "block";
    userInputLabel.style.marginBottom = "8px";
    userInputLabel.style.fontWeight = "bold";
    
    const userInput = document.createElement("textarea");
    userInput.id = "user-input";
    userInput.rows = "4";
    userInput.style.width = "100%";
    userInput.style.padding = "10px";
    userInput.style.border = "1px solid #ccc";
    userInput.style.borderRadius = "4px";
    userInput.style.resize = "vertical";
    
    const sendButton = document.createElement("button");
    sendButton.textContent = "Submit";
    sendButton.id = "send-button";
    sendButton.style.marginTop = "10px";
    sendButton.style.padding = "8px 16px";
    sendButton.style.backgroundColor = "#0072bc";
    sendButton.style.color = "white";
    sendButton.style.border = "none";
    sendButton.style.borderRadius = "4px";
    sendButton.style.cursor = "pointer";
    
    // Loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "loading-indicator";
    loadingIndicator.textContent = "Processing your request...";
    loadingIndicator.style.display = "none";
    loadingIndicator.style.margin = "15px 0";
    loadingIndicator.style.fontStyle = "italic";
    loadingIndicator.style.color = "#666";
    
    // Response area
    const responseArea = document.createElement("div");
    responseArea.id = "response-area";
    responseArea.style.marginTop = "20px";
    responseArea.style.marginBottom = "25px";
    responseArea.style.display = "none";
    
    const responseLabel = document.createElement("div");
    responseLabel.textContent = "AI Response:";
    responseLabel.style.fontWeight = "bold";
    responseLabel.style.marginBottom = "10px";
    
    const responseContent = document.createElement("div");
    responseContent.id = "response-content";
    responseContent.style.padding = "15px";
    responseContent.style.backgroundColor = "#f8f9fa";
    responseContent.style.border = "1px solid #e9ecef";
    responseContent.style.borderRadius = "4px";
    responseContent.style.lineHeight = "1.6";
    responseContent.style.minHeight = "100px";
    
    // Final idea submission section (initially hidden completely)
    const finalIdeaSection = document.createElement("div");
    finalIdeaSection.id = "final-idea-section";
    finalIdeaSection.style.marginTop = "15px";
    finalIdeaSection.style.marginBottom = "20px";
    finalIdeaSection.style.border = "1px solid #ddd";
    finalIdeaSection.style.borderRadius = "4px";
    finalIdeaSection.style.overflow = "hidden";
    finalIdeaSection.style.display = "none"; // Initially hidden completely
    
    // Toggle button to show/hide the final idea submission
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "► Submit the final idea";
    toggleButton.style.width = "100%";
    toggleButton.style.padding = "10px";
    toggleButton.style.backgroundColor = "#f8f8f8";
    toggleButton.style.border = "none";
    toggleButton.style.borderBottom = "1px solid #ddd";
    toggleButton.style.textAlign = "left";
    toggleButton.style.fontSize = "16px";
    toggleButton.style.fontWeight = "bold";
    toggleButton.style.cursor = "pointer";
    
    // Container for the final idea input (initially hidden)
    const finalIdeaContent = document.createElement("div");
    finalIdeaContent.style.padding = "15px";
    finalIdeaContent.style.display = "none"; // Initially collapsed
    
    // Final idea label
    const finalIdeaLabel = document.createElement("label");
    finalIdeaLabel.htmlFor = "final-idea";
    finalIdeaLabel.textContent = "Based on your interaction with the AI, please submit the final idea. You can just copy and paste it from the chat or type it yourself into the box below:";
    finalIdeaLabel.style.display = "block";
    finalIdeaLabel.style.marginBottom = "10px";
    finalIdeaLabel.style.fontWeight = "bold";
    
    // Final idea textarea
    const finalIdeaInput = document.createElement("textarea");
    finalIdeaInput.id = "final-idea";
    finalIdeaInput.rows = "6";
    finalIdeaInput.style.width = "100%";
    finalIdeaInput.style.padding = "10px";
    finalIdeaInput.style.border = "1px solid #ccc";
    finalIdeaInput.style.borderRadius = "4px";
    finalIdeaInput.style.resize = "vertical";
    
    // Assemble the final idea section
    finalIdeaContent.appendChild(finalIdeaLabel);
    finalIdeaContent.appendChild(finalIdeaInput);
    
    finalIdeaSection.appendChild(toggleButton);
    finalIdeaSection.appendChild(finalIdeaContent);
    
    // Instruction message
    const instructionMessage = document.createElement("div");
    instructionMessage.id = "instruction-message";
    instructionMessage.textContent = "Please submit your prompt before continuing with the survey.";
    instructionMessage.style.padding = "10px";
    instructionMessage.style.textAlign = "center";
    instructionMessage.style.fontWeight = "bold";
    instructionMessage.style.color = "#333333";
    instructionMessage.style.marginTop = "20px";
    
    // Append elements to the DOM
    responseArea.appendChild(responseLabel);
    responseArea.appendChild(responseContent);
    
    inputArea.appendChild(userInputLabel);
    inputArea.appendChild(userInput);
    inputArea.appendChild(document.createElement("br"));
    inputArea.appendChild(sendButton);
    
    container.appendChild(responseArea);
    container.appendChild(loadingIndicator);
    container.appendChild(inputArea);
    container.appendChild(instructionMessage);
    // Note: finalIdeaSection will be appended dynamically after completion
    
    // Add the interface to the question container
    const questionContainer = this.getQuestionContainer();
    questionContainer.appendChild(container);
    
    // Hidden input to store the conversation for Qualtrics to record
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "QR~" + this.questionId;
    hiddenInput.name = "QR~" + this.questionId;
    questionContainer.appendChild(hiddenInput);
    
    // Flag to track if user has interacted
    let hasInteracted = false;
    // Flag to track if final idea has been entered
    let hasFinalIdea = false;
    
    // Disable the "Next" button initially
    function disableNextButton() {
        const nextButton = document.querySelector('#NextButton');
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.style.backgroundColor = "#cccccc";
            nextButton.style.cursor = "not-allowed";
            nextButton.title = "Please submit your prompt and final idea before continuing";
        }
    }
    
    // Enable the "Next" button after interaction AND final idea
    function enableNextButton() {
        if (hasInteracted && hasFinalIdea) {
            const nextButton = document.querySelector('#NextButton');
            if (nextButton) {
                nextButton.disabled = false;
                nextButton.style.backgroundColor = "";
                nextButton.style.cursor = "pointer";
                nextButton.title = "";
                instructionMessage.style.display = "none";
            }
        }
    }
    
    // Re-disable the "Next" button if requirements aren't met
    function checkRequirements() {
        if (!hasInteracted || !hasFinalIdea) {
            disableNextButton();
            instructionMessage.style.display = "block";
            
            if (!hasInteracted) {
                instructionMessage.textContent = "Please submit your prompt before continuing.";
            } else if (!hasFinalIdea) {
                instructionMessage.textContent = "";
            }
        } else {
            enableNextButton();
        }
    }
    
    // Call to disable the next button when the page loads
    disableNextButton();
    
    // Conversation data structure
    let conversation = {
        userPrompt: "",
        aiResponse: "",
        finalIdea: ""
    };
    
    // Simple string to track conversation history for the embedded data field
    let conversationHistoryText = "";
    
    // Flag to track if we've added the final idea to the conversation history
    let finalIdeaAddedToHistory = false;
    
    // Store the interval ID so we can clear it later
    let finalIdeaCheckIntervalId = null;
    
    // Setup a timer to watch for changes to the finalIdea field
    finalIdeaCheckIntervalId = setInterval(function() {
        // If we have a final idea and haven't added it to history yet
        if (conversation.finalIdea && !finalIdeaAddedToHistory && conversation.finalIdea.trim() !== "") {
            // Add it to the conversation history
            if (conversationHistoryText !== "") {
                conversationHistoryText += " || ";
            }
            conversationHistoryText += "FINAL IDEA: " + conversation.finalIdea;
            
            // Update the embedded data field
            try {
                Qualtrics.SurveyEngine.setEmbeddedData('convo_hist', conversationHistoryText);
                console.log("Updated convo_hist with final idea: " + conversationHistoryText);
                finalIdeaAddedToHistory = true;
            } catch (e) {
                console.error("Error updating convo_hist with final idea:", e);
            }
        }
    }, 1000); // Check every second
    
    // Number of iterations counter
    let iterationCount = 0;
    
    // Update the hidden input and embedded data with the conversation
    function updateHiddenInput() {
        // Update hidden input for standard Qualtrics data collection
        hiddenInput.value = JSON.stringify(conversation);
        
        // Update Qualtrics embedded data fields
        try {
            // Set the embedded data
            Qualtrics.SurveyEngine.setEmbeddedData('final_idea', conversation.finalIdea);
            Qualtrics.SurveyEngine.setEmbeddedData('no_iterations', iterationCount);
            
            console.log("Embedded data updated successfully");
        } catch (e) {
            console.error("Error updating embedded data:", e);
        }
    }
    
    // Function to call the OpenAI API
    async function callOpenAI(prompt) {
        try {
            loadingIndicator.style.display = "block";
            
            // Debug message in console
            console.log("Calling Mistral API with model:", MISTRAL_MODEL);
            
            // Create headers with Authorization
            const headers = {
                "Content-Type": "application/json",
                "Authorization": 'Bearer ' + MISTRAL_API_KEY.trim()
            };
            
            const requestBody = {
                model: MISTRAL_MODEL,
                messages: [
                    { role: "system", content: "You are a helpful assistant for generating a creative toy idea for children aged 5-11. You must follow these strict constraints: Only use paper clips, water bottles, and paper bags as materials. Do not introduce any other materials. Generate only one idea at a time. Do not propose multiple ideas at once. The toy should be suitable for the target age group. IMPORTANT: Do not generate any toy ideas unless explicitly asked by the user. If the user's message does not explicitly ask for a toy idea, engage in a conversation to understand what kind of toy they are looking for. When generating an idea, clearly describe how the toy is assembled and how children can play with it. Stay within these boundaries while being as imaginative as possible! You will only have 1 iterations with the user. So, the user cannot answer. HENCE IMPORTANT: Do not ask questions as the user cannot answer but instead make sure that you propose ONE IDEA." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                top_p: 1,
                max_tokens: 800,
                stream: false,
                presence_penalty: 0,
                frequency_penalty: 0,
                response_format: {
                    type: "text"
                },
                n: 1,
                safe_prompt: false
            };
            
            console.log("Sending request to Mistral API...");
            
            const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            // Log response status for debugging
            console.log("API Response status:", response.status, response.statusText);
            
            const data = await response.json();
            console.log("API Response data:", JSON.stringify(data).substring(0, 200) + "...");
            
            if (!response.ok) {
                console.error("Error response:", JSON.stringify(data));
                const errorMsg = data.error && typeof data.error === 'string' ? data.error : 
                                (data.error && data.error.message ? data.error.message : JSON.stringify(data));
                throw new Error(`Mistral API error (${response.status}): ${errorMsg}`);
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error("Unexpected response format:", JSON.stringify(data));
                throw new Error("Invalid response format from Mistral API");
            }
            
            loadingIndicator.style.display = "none";
            return data.choices[0].message.content;
        } catch (error) {
            loadingIndicator.style.display = "none";
            console.error("Error calling Mistral API:", error);
            return "Sorry, there was an error communicating with the AI: " + error.message;
        }
    }
    
    // Function to handle submitting a prompt
    async function submitPrompt() {
        const prompt = userInput.value.trim();
        
        if (prompt === "") return;
        
        // Increment iteration count
        iterationCount++;
        
        // Store the user's prompt
        conversation.userPrompt = prompt;
        
        // Show response area before making the request so layout appears immediately
        responseArea.style.display = "block";
        
        // Disable input and button to prevent further submissions
        userInput.disabled = true;
        sendButton.disabled = true;
        sendButton.style.backgroundColor = "#cccccc";
        sendButton.style.cursor = "not-allowed";
        
        // Call the API and get the response
        const response = await callOpenAI(prompt);
        
        // Store and display the AI response
        conversation.aiResponse = response;
        
        // Simply append this interaction to the conversation history text in the same format as 4iteration.js
        conversationHistoryText = "USER: " + prompt + " || AI: " + response;
        
        // Directly update the embedded data field
        try {
            Qualtrics.SurveyEngine.setEmbeddedData('convo_hist', conversationHistoryText);
            console.log("Updated convo_hist with: " + conversationHistoryText);
        } catch (e) {
            console.error("Error updating convo_hist:", e);
        }
        
        // Update the hidden input with the conversation data
        updateHiddenInput();
        
        // Format the response (handle basic markdown)
        let formattedContent = response
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code style='background-color:#f0f0f0;padding:2px 4px;border-radius:3px;font-family:monospace;'>$1</code>")
            .replace(/```([\s\S]*?)```/g, "<pre style='background-color:#f0f0f0;padding:10px;border-radius:4px;overflow-x:auto;'><code>$1</code></pre>");
        
        // Convert line breaks to <br>
        formattedContent = formattedContent.replace(/\n/g, "<br>");
        
        // Display the response
        responseContent.innerHTML = formattedContent;
        
        // Mark as interacted and enable the next button
        hasInteracted = true;
        checkRequirements();
        
        // Add a completion note that mentions the final idea requirement
        const completionNote = document.createElement("div");
        completionNote.id = "completion-message";
        completionNote.style.marginTop = "20px";
        completionNote.style.padding = "10px";
        completionNote.style.backgroundColor = "#f2f2f2"; // Gray background
        completionNote.style.color = "#333333"; // Dark gray text
        completionNote.style.borderRadius = "4px";
        completionNote.style.border = "1px solid #e0e0e0"; // Light gray border
        completionNote.style.textAlign = "center";
        completionNote.style.fontWeight = "bold";
        completionNote.textContent = "Please submit the final idea before continuing with the survey.";
        container.appendChild(completionNote);
        
        // Add final idea section AFTER the completion message
        // First remove it if it's already in the DOM somewhere else
        if (finalIdeaSection.parentNode) {
            finalIdeaSection.parentNode.removeChild(finalIdeaSection);
        }
        // Then add it after the completion message
        container.appendChild(finalIdeaSection);
        
        // Show the final idea section (but content remains collapsed until clicked)
        finalIdeaSection.style.display = "block";
    }
    
    // Event listeners
    sendButton.addEventListener("click", submitPrompt);
    
    userInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter" && e.ctrlKey) {
            submitPrompt();
            e.preventDefault();
        }
    });
    
    // Toggle the final idea section visibility
    toggleButton.addEventListener("click", function() {
        if (finalIdeaContent.style.display === "none") {
            finalIdeaContent.style.display = "block";
            toggleButton.textContent = "▼ Submit the final idea";
        } else {
            finalIdeaContent.style.display = "none";
            toggleButton.textContent = "► Submit the final idea";
        }
    });
    
    // Add event listener to auto-save the final idea when the user types
    finalIdeaInput.addEventListener("input", function() {
        // Store the idea as the user types
        conversation.finalIdea = finalIdeaInput.value.trim();
        // Update the hidden input with the conversation data and embedded data
        updateHiddenInput();
        
        // Check if there's content and update the final idea status
        hasFinalIdea = finalIdeaInput.value.trim() !== "";
        
        // Update Next button state
        checkRequirements();
        
        // Provide visual feedback on the input field
        if (hasFinalIdea) {
            finalIdeaInput.style.borderColor = "#28a745";
            finalIdeaInput.style.outline = "none";
            // Update the completion message
            const completionMessage = document.getElementById("completion-message");
            if (completionMessage) {
                completionMessage.textContent = "Thank you for the submissions. You may now continue with the survey.";
            }
        } else {
            finalIdeaInput.style.borderColor = "#dc3545";
            // Update the completion message
            const completionMessage = document.getElementById("completion-message");
            if (completionMessage) {
                completionMessage.textContent = "Please submit the final idea before continuing with the survey.";
            }
        }
    });
    
    // Update embedded data on page load to initialize values
    updateHiddenInput();
});

Qualtrics.SurveyEngine.addOnReady(function() {
    // Code to run when the question is ready (fully loaded)
});

Qualtrics.SurveyEngine.addOnUnload(function() {
    // Cleanup code to run when the question is unloaded
    if (finalIdeaCheckIntervalId) {
        clearInterval(finalIdeaCheckIntervalId);
        console.log("Cleared finalIdeaCheckInterval on unload");
    }
});
