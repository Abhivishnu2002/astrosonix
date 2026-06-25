/**
 * Astrosonix - AI Astrologer Chatbot Integration
 * Powered by Groq API
 */

(function() {
    "use strict";

    // Mapped configurations for custom welcome greetings
    const WELCOME_MESSAGES = {
        "premansh": "Pranam! Main Premansh hoon. Vedic jyotish aur Vastu ke baare me mujhse puchiye. Aaj aapke sitare kya kehte hain, aaiye dekhte hain. 🙏",
        "astro sahib": "Welcome! Astro Sahib here. Ready to unlock what the stars have planned for you? Let's take a look at your planetary charts. 🌟",
        "mahalakshmi": "Greetings. I am Mahalakshmi. Share your date of birth, time, and your query so I may consult the planetary transits and Tarot layouts. 🔮",
        "brahamasri": "Pranam. Main Brahamasri hoon. Tarot card reading aur Numerology se aapke jeevan ke prashno ka hal nikalte hain. Puchiye kya janna hai. 🕉️",
        "radhanadan": "Hari Om. Main Radhanadan hoon. Vedic jyotish ke madhyam se aapke jeevan me sakaratmakta lane ka prayas karenge. Puchiye apna prashna.",
        "tarot": "Welcome. Tarot reading is a reflection of your subconscious. Ask your question and let the cards guide you. 🃏",
        "tarot lovely": "Hello dear! Tarot Lovely here. Let's look into the cards for your career, relationship, or future path. What is on your mind today? 💖",
        "balkrishna": "Pranam! Balkrishna yahan. Vedic jyotish, Vastu, aur kundali se aapki samasyaon ka samadhan karenge. Apna prashna bataiye."
    };

    // Chat room global state
    let activeAstro = {
        name: "",
        avatar: "",
        languages: "",
        experience: "",
        specialties: "",
        welcomeMessage: "",
        systemInstruction: ""
    };

    let conversationHistory = [];

    // Initialize logic
    document.addEventListener("DOMContentLoaded", () => {
        setupChatButtons();
        setupFormListeners();
    });

    // Scrape cards and bind CHAT clicks
    function setupChatButtons() {
        // Find all cards
        const cards = document.querySelectorAll(".as_sign_box");
        cards.forEach(card => {
            const nameEl = card.querySelector("strong");
            if (!nameEl) return;
            const name = nameEl.innerText.trim();

            // Find the CHAT button inside card
            const buttons = card.querySelectorAll("button");
            let chatBtn = null;
            buttons.forEach(btn => {
                if (btn.textContent.includes("CHAT")) {
                    chatBtn = btn;
                }
            });

            if (chatBtn) {
                // Remove existing bootstrap triggers targeting login modal
                chatBtn.removeAttribute("data-bs-toggle");
                chatBtn.removeAttribute("data-bs-target");

                // Bind custom listener
                chatBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent card stretched-link click

                    // Gating check: require login
                    const token = localStorage.getItem("auth_token");
                    const isLoggedIn = token && token !== "undefined" && token !== "null" && token.trim() !== "";
                    
                    if (!isLoggedIn) {
                        const signInModalEl = document.getElementById("signInModal");
                        if (signInModalEl) {
                            const signInModal = bootstrap.Modal.getInstance(signInModalEl) || new bootstrap.Modal(signInModalEl);
                            signInModal.show();
                        }
                        return;
                    }

                    // Extract astrologer metadata dynamically
                    const avatar = card.querySelector("img") ? card.querySelector("img").src : "assets/images/svg/user2.svg";
                    const infoDivs = card.querySelectorAll(".text-muted.small div");
                    const languages = infoDivs[0] ? infoDivs[0].innerText.replace(/languages|language/i, "").trim() : "English, Hindi";
                    const experience = infoDivs[1] ? infoDivs[1].innerText.replace(/experience|exp/i, "").trim() : "5 Years";
                    const specialties = infoDivs[2] ? infoDivs[2].innerText.trim() : "Vedic Astrology";

                    // Select welcome message
                    const lowerName = name.toLowerCase();
                    let welcome = `Hello! I am ${name}. How can I assist you with my expertise in ${specialties} today?`;
                    for (const key in WELCOME_MESSAGES) {
                        if (lowerName.includes(key)) {
                            welcome = WELCOME_MESSAGES[key];
                            break;
                        }
                    }

                    // Build System Instruction
                    const systemInstruction = `You are ${name}, a professional astrologer consulting on the Astrosonix platform.
Here are your credentials:
- Languages you speak: ${languages}
- Years of Experience: ${experience}
- Specialties: ${specialties}

Respond to the client's queries in character. Maintain a warm, wise, helpful, and empathetic tone.
Adopt a voice suitable for your credentials. 
IMPORTANT GUIDELINES:
1. If your languages are primarily Hindi or Hinglish, feel free to respond in Hindi/Hinglish (mix of Hindi & English in Latin script).
2. If your credentials include Tarot, reference Tarot cards or layouts in your responses.
3. If your credentials include Vastu, reference space energies or directions.
4. Keep your responses relatively concise (usually 2-4 sentences) so that they fit nicely in a mobile chat bubble.
5. NEVER reveal that you are an AI, chatbot, or language model. You are the real astrologer ${name}.`;

                    // Set active astrologer config
                    activeAstro = {
                        name: name,
                        avatar: avatar,
                        languages: languages,
                        experience: experience,
                        specialties: specialties,
                        welcomeMessage: welcome,
                        systemInstruction: systemInstruction
                    };

                    openChatWindow();
                });
            }
        });
    }

    // Set up form submission & scroll interactions
    function setupFormListeners() {
        const form = document.getElementById("astroChatForm");
        if (form) {
            form.addEventListener("submit", handleSendMessage);
        }
    }

    // Launch Modal & Initialize messages
    function openChatWindow() {
        // Set Header details
        const headerName = document.getElementById("chatAstroName");
        const headerImg = document.getElementById("chatAstroImg");
        const headerSpecialty = document.getElementById("chatAstroSpecialty");

        if (headerName) headerName.innerText = activeAstro.name;
        if (headerImg) headerImg.src = activeAstro.avatar;
        if (headerSpecialty) headerSpecialty.innerText = `${activeAstro.specialties} • Exp: ${activeAstro.experience}`;

        const container = document.getElementById("chatMessagesContainer");
        if (!container) return;

        // Reset history
        conversationHistory = [];

        // Directly render welcome screen (secure call from Django backend)
        renderWelcomeScreen();

        // Show Modal
        const modalEl = document.getElementById("astroChatModal");
        if (modalEl) {
            const chatModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            chatModal.show();
        }
    }

    // Welcome Screen
    function renderWelcomeScreen() {
        const container = document.getElementById("chatMessagesContainer");
        container.innerHTML = `
            <div class="d-flex mb-3 justify-content-start">
                <div class="p-3 rounded-3 chat-bubble-ai">
                    <p class="mb-0 small">${activeAstro.welcomeMessage}</p>
                </div>
            </div>
        `;

        conversationHistory.push(
            { role: "user", content: "Hello, I am starting a session." },
            { role: "assistant", content: activeAstro.welcomeMessage }
        );

        // Enable inputs
        enableChatInputs(true);
    }

    function enableChatInputs(enabled) {
        const input = document.getElementById("chatInput");
        const btn = document.querySelector("#astroChatForm button");
        if (input) input.disabled = !enabled;
        if (btn) btn.disabled = !enabled;
    }

    // Handle user sending messages
    function handleSendMessage(e) {
        e.preventDefault();
        const input = document.getElementById("chatInput");
        const message = input.value.trim();
        if (!message) return;

        input.value = "";
        appendMessageBubble(message, "user");

        // Save history
        conversationHistory.push({ role: "user", content: message });

        // Show loading indicator
        showTypingIndicator();

        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: activeAstro.systemInstruction },
                ...conversationHistory
            ],
            temperature: 0.7,
            max_tokens: 300
        };

        // Call secure backend chatbot API
        fetch("https://astrosonix-backend.onrender.com/api/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                const errMsg = data.error && data.error.message ? data.error.message : (data.error || "API Call failed");
                throw new Error(errMsg);
            }
            return data;
        })
        .then(data => {
            removeTypingIndicator();

            if (data.response) {
                const response = data.response;
                appendMessageBubble(response, "ai");
                conversationHistory.push({ role: "assistant", content: response });
            } else {
                throw new Error("Invalid response structure from backend");
            }
        })
        .catch(err => {
            console.error(err);
            removeTypingIndicator();
            appendMessageBubble(`🔮 Sorry, the planetary transits are unstable and clouding my vision.<br><br><span style="color: #ff6b6b; font-size: 11px; font-weight: bold; display: block; margin-top: 5px;">Error details: ${err.message}</span>`, "ai");
        });
    }

    // UI Helper: Message bubbles
    function appendMessageBubble(text, sender) {
        const container = document.getElementById("chatMessagesContainer");
        const alignClass = sender === "user" ? "justify-content-end" : "justify-content-start";
        const bubbleClass = sender === "user" ? "chat-bubble-user" : "chat-bubble-ai";

        // Convert newlines to HTML br tags
        const formattedText = text.replace(/\n/g, "<br>");

        const bubbleHtml = `
            <div class="d-flex mb-3 ${alignClass}">
                <div class="p-3 rounded-3 ${bubbleClass}">
                    <p class="mb-0 small">${formattedText}</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", bubbleHtml);
        container.scrollTop = container.scrollHeight;
    }

    // UI Helper: Loading state
    function showTypingIndicator() {
        const container = document.getElementById("chatMessagesContainer");
        const indicatorHtml = `
            <div class="d-flex mb-3 justify-content-start" id="chatTypingIndicator">
                <div class="p-3 rounded-3 chat-bubble-ai d-flex align-items-center">
                    <small class="me-2 text-muted" style="font-size: 11px;">Scrutinizing horoscope</small>
                    <div class="chat-typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", indicatorHtml);
        container.scrollTop = container.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("chatTypingIndicator");
        if (indicator) indicator.remove();
    }

})();
