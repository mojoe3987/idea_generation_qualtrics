// GPT-4o Integration for Qualtrics - Plain Text Interface (4 Iterations)
// This code creates a simple text interface within Qualtrics that connects to Mistral AI
// and allows for 4 iterations with the AI

Qualtrics.SurveyEngine.addOnload(function() {
    // Configuration with hardcoded API key
    const MISTRAL_API_KEY = "C0JWs6KIzxchL0r8GrzvIwooTNe88sOJ"; // Your Mistral API key
    const MISTRAL_MODEL = "ministral-8b-latest"; // Using Mistral's small model
    
    // Current iteration tracker
    let currentIteration = 1;
    const maxIterations = 4;
    
    // Flag to track if user has completed all iterations
    let allIterationsCompleted = false;
    // Flag to track if final idea has been entered
    let hasFinalIdea = false;
    
    // Create the main container
    const container = document.createElement("div");
    container.id = "gpt-container";
    container.style.width = "100%";
    container.style.maxWidth = "800px";
    container.style.margin = "0 auto";
    container.style.fontFamily = "Arial, sans-serif";
    
    // Conversation history display
    const conversationHistory = document.createElement("div");
    conversationHistory.id = "conversation-history";
    conversationHistory.style.marginBottom = "25px";
    
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
    
    // Input area
    const inputArea = document.createElement("div");
    inputArea.id = "input-area";
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
    
    // Create a counter that will initially be hidden
    const counterContainer = document.createElement("div");
    counterContainer.style.marginTop = "15px";
    counterContainer.style.marginBottom = "15px";
    counterContainer.style.padding = "8px";
    counterContainer.style.backgroundColor = "#f2f2f2";
    counterContainer.style.borderRadius = "4px";
    counterContainer.style.textAlign = "center";
    counterContainer.style.display = "none"; // Hide initially
    
    // Use simpler counter text structure
    const iterationText = document.createElement("span");
    iterationText.textContent = "Completed iterations: ";
    iterationText.style.fontWeight = "bold";
    
    const counterNumber = document.createElement("span");
    counterNumber.textContent = "0";
    counterNumber.style.fontWeight = "bold";
    counterNumber.id = "iteration-number";
    
    // Assemble the counter
    counterContainer.appendChild(iterationText);
    counterContainer.appendChild(counterNumber);
    
    // Instruction message
    const instructionMessage = document.createElement("div");
    instructionMessage.id = "instruction-message";
    instructionMessage.textContent = "Please complete at least 4 iterations with the AI.";
    instructionMessage.style.padding = "10px";
    instructionMessage.style.textAlign = "center";
    instructionMessage.style.fontWeight = "bold";
    instructionMessage.style.color = "#333333";
    instructionMessage.style.marginTop = "20px";
    
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
    
    // Append elements to the DOM
    responseArea.appendChild(responseLabel);
    responseArea.appendChild(responseContent);
    
    inputArea.appendChild(userInputLabel);
    inputArea.appendChild(userInput);
    inputArea.appendChild(document.createElement("br"));
    inputArea.appendChild(sendButton);
    
    container.appendChild(conversationHistory);
    container.appendChild(responseArea);
    container.appendChild(loadingIndicator);
    container.appendChild(inputArea);
    container.appendChild(counterContainer);
    container.appendChild(instructionMessage);
    // Note: finalIdeaSection will be appended dynamically after the completion message
    
    // Add the interface to the question container
    const questionContainer = this.getQuestionContainer();
    questionContainer.appendChild(container);
    
    // Hidden input to store the conversation for Qualtrics to record
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "QR~" + this.questionId;
    hiddenInput.name = "QR~" + this.questionId;
    questionContainer.appendChild(hiddenInput);
    
    // Disable the "Next" button initially
    function disableNextButton() {
        const nextButton = document.querySelector('#NextButton');
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.style.backgroundColor = "#cccccc";
            nextButton.style.cursor = "not-allowed";
            nextButton.title = "Please complete all 4 iterations and submit the final idea before continuing";
        }
    }
    
    // Enable the "Next" button after all iterations AND final idea
    function enableNextButton() {
        if (allIterationsCompleted && hasFinalIdea) {
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
        if (!allIterationsCompleted || !hasFinalIdea) {
            disableNextButton();
            instructionMessage.style.display = "block";
            
            if (!allIterationsCompleted) {
                instructionMessage.textContent = "Please complete at least 4 iterations with the AI.";
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
        iterations: [],
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
    
    // Update hidden input for standard Qualtrics data collection
    function updateHiddenInput() {
        // Update hidden input for standard Qualtrics data collection
        hiddenInput.value = JSON.stringify(conversation);
        
        // Update Qualtrics embedded data fields
        try {
            // Set the embedded data
            Qualtrics.SurveyEngine.setEmbeddedData('final_idea', conversation.finalIdea);
            Qualtrics.SurveyEngine.setEmbeddedData('no_iterations', conversation.iterations.length);
            
            console.log("Embedded data updated successfully");
        } catch (e) {
            console.error("Error updating embedded data:", e);
        }
    }
    
    // Simple function to update the counter display
    function updateCounter(iteration) {
        // Only show counter if we've completed at least one iteration
        if (iteration <= 1) {
            counterContainer.style.display = "none";
            return;
        }
        
        // Show the counter for all iterations after the first
        counterContainer.style.display = "block";
        
        // Clear previous content
        counterContainer.innerHTML = '';
        
        // Number to display is completed iterations (iteration - 1)
        const completedIterations = iteration - 1;
        
        // Create text component
        const completedText = document.createElement("span");
        completedText.textContent = "Completed iterations: ";
        completedText.style.fontWeight = "bold";
        
        // Create number component
        const completedNumber = document.createElement("span");
        completedNumber.textContent = completedIterations;
        completedNumber.style.fontWeight = "bold";
        
        // No color change regardless of number of iterations completed
        
        // Append both components to the counter
        counterContainer.appendChild(completedText);
        counterContainer.appendChild(completedNumber);
    }
    
    // Function to add a new entry to the conversation history display
    function addToConversationHistory(prompt, response) {
        // Create container for this iteration
        const iterationContainer = document.createElement("div");
        iterationContainer.className = "iteration";
        iterationContainer.style.marginBottom = "25px";
        iterationContainer.style.padding = "10px";
        iterationContainer.style.backgroundColor = "#f9f9f9";
        iterationContainer.style.border = "1px solid #e9ecef";
        iterationContainer.style.borderRadius = "4px";
        
        // Add iteration header
        const iterationHeader = document.createElement("div");
        iterationHeader.textContent = `Iteration ${currentIteration}`;
        iterationHeader.style.fontWeight = "bold";
        iterationHeader.style.marginBottom = "10px";
        iterationHeader.style.paddingBottom = "5px";
        iterationHeader.style.borderBottom = "1px solid #e9ecef";
        
        // Add user prompt
        const promptDiv = document.createElement("div");
        promptDiv.style.marginBottom = "10px";
        
        const promptLabel = document.createElement("div");
        promptLabel.textContent = "Your prompt:";
        promptLabel.style.fontWeight = "bold";
        promptLabel.style.fontSize = "14px";
        promptLabel.style.marginBottom = "5px";
        
        const promptContent = document.createElement("div");
        promptContent.textContent = prompt;
        promptContent.style.padding = "8px";
        promptContent.style.backgroundColor = "#e6f7ff";
        promptContent.style.borderRadius = "4px";
        
        promptDiv.appendChild(promptLabel);
        promptDiv.appendChild(promptContent);
        
        // Add AI response
        const responseDiv = document.createElement("div");
        
        const responseLabel = document.createElement("div");
        responseLabel.textContent = "AI Response:";
        responseLabel.style.fontWeight = "bold";
        responseLabel.style.fontSize = "14px";
        responseLabel.style.marginBottom = "5px";
        
        const responseContent = document.createElement("div");
        // Format the response (handle basic markdown)
        let formattedContent = response
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code style='background-color:#f0f0f0;padding:2px 4px;border-radius:3px;font-family:monospace;'>$1</code>")
            .replace(/```([\s\S]*?)```/g, "<pre style='background-color:#f0f0f0;padding:10px;border-radius:4px;overflow-x:auto;'><code>$1</code></pre>");
        
        // Convert line breaks to <br>
        formattedContent = formattedContent.replace(/\n/g, "<br>");
        
        responseContent.innerHTML = formattedContent;
        responseContent.style.padding = "8px";
        responseContent.style.backgroundColor = "#f0f0f0";
        responseContent.style.borderRadius = "4px";
        
        responseDiv.appendChild(responseLabel);
        responseDiv.appendChild(responseContent);
        
        // Assemble the iteration container
        iterationContainer.appendChild(iterationHeader);
        iterationContainer.appendChild(promptDiv);
        iterationContainer.appendChild(responseDiv);
        
        // Add to conversation history
        conversationHistory.appendChild(iterationContainer);
        
        // Scroll to the bottom of the conversation history
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }
    
    // Function to call the OpenAI API
    async function callOpenAI(prompt) {
        try {
            // Show loading indicator
            const loadingIndicator = document.getElementById("loading-indicator");
            loadingIndicator.style.display = "block";
            
            // Prepare conversation history for the API
            const messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant for generating a creative toy idea for children aged 5-11. You must follow these strict constraints: Only use paper clips, water bottles, and paper bags as materials. Do not introduce any other materials. Generate only one idea at a time. Do not propose multiple ideas at once. The toy should be suitable for the target age group. IMPORTANT: Do not generate any toy ideas unless explicitly asked by the user. If the user's message does not explicitly ask for a toy idea, engage in a conversation to understand what kind of toy they are looking for. When the user asks for help improving an existing idea, provide constructive suggestions while maintaining the material constraints. Your improvements should be specific and actionable. When generating an idea, clearly describe how the toy is assembled and how children can play with it. Stay within these boundaries while being as imaginative as possible! You have multiple iterations with the user. Please make the interaction interactive and potentially ask questions at the end of each iteration with the focus on improving the idea. However, when asking these questions always keep the material restrictions in mind."
                }
            ];
            
            // Add conversation history from previous iterations
            if (conversation && conversation.iterations) {
                conversation.iterations.forEach(iter => {
                    messages.push({ "role": "user", "content": iter.userPrompt });
                    messages.push({ "role": "assistant", "content": iter.aiResponse });
                });
            }
            
            // Add the current prompt
            messages.push({ "role": "user", "content": prompt });
            
            console.log("Calling Mistral API with model:", MISTRAL_MODEL);
            
            // Prepare the request options for Mistral API
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + MISTRAL_API_KEY.trim(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": MISTRAL_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "top_p": 1,
                    "max_tokens": 800,
                    "stream": false,
                    "presence_penalty": 0,
                    "frequency_penalty": 0,
                    "response_format": {
                        "type": "text"
                    },
                    "n": 1,
                    "safe_prompt": false
                })
            };
            
            console.log("Sending request to Mistral API...");
            
            // Make the API call
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', options);
            
            // Log response status for debugging
            console.log("API Response status:", response.status, response.statusText);
            
            const data = await response.json();
            console.log("API Response data:", JSON.stringify(data).substring(0, 200) + "...");
            
            // Hide loading indicator
            loadingIndicator.style.display = "none";
            
            if (!response.ok) {
                console.error("Error response:", JSON.stringify(data));
                const errorMsg = data.error && typeof data.error === 'string' ? data.error : 
                                (data.error && data.error.message ? data.error.message : JSON.stringify(data));
                throw new Error(`Mistral API error (${response.status}): ${errorMsg}`);
            }
            
            // Check if we received a valid response
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error("Unexpected response format:", JSON.stringify(data));
                throw new Error("Invalid response format from Mistral API");
            }
            
            return data.choices[0].message.content;
        } catch (error) {
            // Hide loading indicator
            const loadingIndicator = document.getElementById("loading-indicator");
            loadingIndicator.style.display = "none";
            
            // Display error message
            console.error("Error calling Mistral API:", error);
            return "Sorry, there was an error communicating with the AI: " + error.message;
        }
    }
    
    // Function to handle submitting a prompt
    async function submitPrompt() {
        const prompt = userInput.value.trim();
        
        if (prompt === "") return;
        
        // Clear the input field for the next iteration
        userInput.value = "";
        
        // Disable UI during API call
        userInput.disabled = true;
        sendButton.disabled = true;
        
        // Show response area
        responseArea.style.display = "block";
        
        // Call the API and get the response
        const response = await callOpenAI(prompt);
        
        // Store this iteration
        conversation.iterations.push({
            iteration: currentIteration,
            userPrompt: prompt,
            aiResponse: response,
            timestamp: new Date().toISOString()
        });
        
        // Simply append this interaction to the conversation history text
        if (conversationHistoryText !== "") {
            conversationHistoryText += " || ";
        }
        conversationHistoryText += "USER: " + prompt + " || AI: " + response;
        
        // Directly update the embedded data field
        try {
            Qualtrics.SurveyEngine.setEmbeddedData('convo_hist', conversationHistoryText);
            console.log("Updated convo_hist with: " + conversationHistoryText);
        } catch (e) {
            console.error("Error updating convo_hist:", e);
        }
        
        // Update the hidden input with the conversation data
        updateHiddenInput();
        
        // Add this exchange to the conversation history display
        addToConversationHistory(prompt, response);
        
        // Clear the current response area
        responseContent.innerHTML = "";
        responseArea.style.display = "none";
        
        // Increment iteration counter
        currentIteration++;
        
        // Update the counter display
        updateCounter(currentIteration);
        
        // Check if we've completed the required iterations
        if (currentIteration > maxIterations && !allIterationsCompleted) {
            // Mark the required iterations as completed
            allIterationsCompleted = true;
            
            // Create and add completion message with gray styling
            const completionMessage = document.createElement("div");
            completionMessage.id = "completion-message";
            completionMessage.style.margin = "20px 0";
            completionMessage.style.padding = "15px";
            completionMessage.style.backgroundColor = "#f2f2f2"; // Gray background
            completionMessage.style.color = "#333333"; // Dark gray text
            completionMessage.style.borderRadius = "4px";
            completionMessage.style.textAlign = "center";
            completionMessage.style.fontWeight = "bold";
            completionMessage.style.border = "1px solid #e0e0e0"; // Light gray border
            completionMessage.textContent = "You have completed the required 4 iterations. You can submit the final idea and continue with the survey, or keep interacting with the AI.";
            container.appendChild(completionMessage);
            
            // Add final idea section AFTER the completion message
            // First remove it if it's already in the DOM somewhere else
            if (finalIdeaSection.parentNode) {
                finalIdeaSection.parentNode.removeChild(finalIdeaSection);
            }
            // Then add it after the completion message
            container.appendChild(finalIdeaSection);
            
            // Show the final idea section (but content remains collapsed until clicked)
            finalIdeaSection.style.display = "block";
            
            // Check requirements (won't enable button until final idea is provided)
            checkRequirements();
        }
        
        // Re-enable input unless we're done
        userInput.disabled = false;
        sendButton.disabled = false;
        sendButton.style.backgroundColor = "#0072bc";
        sendButton.style.cursor = "pointer";
        
        // Focus on the input field for convenience
        userInput.focus();
    }
    
    // Initialize the counter display
    updateCounter(currentIteration);
    
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
            
            // Focus on the input field
            setTimeout(() => {
                finalIdeaInput.focus();
            }, 100);
        } else {
            finalIdeaContent.style.display = "none";
            toggleButton.textContent = "► Submit the final idea";
        }
    });
    
    // Add event listener to auto-save the final idea when the user types
    finalIdeaInput.addEventListener("input", function() {
        // Get the final idea text
        const finalIdea = finalIdeaInput.value.trim();
        
        // Store it in the conversation object
        conversation.finalIdea = finalIdea;
        
        // DIRECTLY save to embedded data for reliability
        console.log("Directly saving final idea: " + finalIdea);
        Qualtrics.SurveyEngine.setEmbeddedData('final_idea', finalIdea);
        
        // Also update hidden input as a backup
        try {
            hiddenInput.value = JSON.stringify(conversation);
        } catch (e) {
            console.log("Error updating hidden input: " + e.message);
        }
        
        // Check if there's content and update the final idea status
        hasFinalIdea = finalIdea !== "";
        
        // Update Next button state
        checkRequirements();
        
        // Provide visual feedback on the input field
        if (hasFinalIdea) {
            finalIdeaInput.style.borderColor = "#28a745";
            finalIdeaInput.style.outline = "none";
            // Update the completion message if it exists
            const completionMessage = document.getElementById("completion-message");
            if (completionMessage) {
                completionMessage.textContent = "You have completed all requirements. You may now continue with the survey.";
            }
        } else {
            finalIdeaInput.style.borderColor = "#dc3545";
            // Update the completion message if it exists
            const completionMessage = document.getElementById("completion-message");
            if (completionMessage) {
                completionMessage.textContent = "You have completed 4 iterations. Please submit the final idea before continuing with the survey.";
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