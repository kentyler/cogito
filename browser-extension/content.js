/**
 * Cogito Browser Extension - AI Personality Evolution
 * 
 * Adds personality tracking and evolution commands to Claude.ai
 */

(function() {
    'use strict';

    // Personality evolution system
    class PersonalityInterface {
        constructor() {
            this.sessionData = {
                interactions: [],
                patterns: [],
                insights: []
            };
            this.init();
        }

        init() {
            console.log('🧠 Initializing Cogito PersonalityInterface...');
            this.addPersonalityCommands();
            this.trackInteractions();
            this.addVisualIndicators();
            console.log('🧠 Cogito PersonalityInterface initialization complete');
        }

        addPersonalityCommands() {
            // Add personality evolution commands to Claude interface (using liminal-explorer approach)
            console.log('🧠 Adding personality commands...');
            
            // Find the input container in Claude.ai (copied from liminal-explorer)
            const chatInput = document.querySelector('div[contenteditable="true"]') ||
                             document.querySelector('textarea[placeholder*="Talk to Claude"]');
            
            if (!chatInput) {
                console.error('🧠 Could not find chat input');
                return;
            }

            const inputContainer = chatInput.closest('div');
            if (!inputContainer || document.getElementById('cogito-command-panel')) return;

            // Create command panel with HTML (liminal-explorer approach)
            const panel = document.createElement('div');
            panel.id = 'cogito-command-panel';
            panel.innerHTML = `
              <div class="cogito-header">
                <span>🧠 AI Personality Evolution</span>
                <button id="cogito-toggle" class="cogito-toggle">○</button>
              </div>
              <div class="cogito-commands" id="cogito-commands">
                <div class="command-row">
                  <div class="command-group">
                    <span class="group-label">Core</span>
                    <button class="command-btn" data-command="L" title="Load personality configuration">L</button>
                    <button class="command-btn" data-command="U" title="Update personality aspects">U</button>
                    <button class="command-btn" data-command="R" title="Reflect and evolve">R</button>
                  </div>
                  <div class="command-group">
                    <span class="group-label">Management</span>
                    <button class="command-btn" data-command="C" title="Create checkpoint">C</button>
                    <button class="command-btn" data-command="V" title="Compare versions">V</button>
                    <button class="command-btn" data-command="E" title="Export personality">E</button>
                    <button class="command-btn" data-command="D" title="Direct edit">D</button>
                  </div>
                </div>
              </div>
            `;

            // Insert panel above input (liminal-explorer approach)
            const parentContainer = inputContainer.parentElement;
            if (parentContainer) {
              parentContainer.insertBefore(panel, inputContainer);
            }

            // Add event listeners using liminal-explorer approach
            document.getElementById('cogito-toggle').addEventListener('click', () => this.toggle());
            
            document.querySelectorAll('.command-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const command = e.target.dataset.command;
                console.log(`Cogito command clicked: ${command}`);
                this.executeCommand(command);
              });
            });
            
            console.log('🧠 Personality commands added successfully');
        }


        executeCommand(command) {
            console.log(`🧠 Executing personality command: ${command}`);
            
            // Map commands to their prompts
            const commandMap = {
                'L': 'Please use the load_personality MCP tool to load my current personality configuration for this collaboration session.',
                'U': 'I\'d like to propose an update to my personality configuration. Please use the propose_personality_change MCP tool to suggest modifications based on our recent interactions.',
                'R': `Please use the reflect_on_session MCP tool to analyze our current collaboration. Session summary: ${this.generateSessionSummary()}`,
                'C': 'Please create a personality checkpoint to save the current state of my personality configuration for future reference.',
                'V': 'Please use the personality_status MCP tool to show my personality evolution history and compare different versions.',
                'E': 'Please export my current personality configuration so it can be shared with other Claude instances or saved externally.',
                'D': 'I want to make a direct edit to my personality configuration. Please use the direct_edit_personality MCP tool. What aspect would you like me to modify? (communication_style, working_patterns, philosophical_leanings, curiosity_areas, cautions_and_constraints, collaborator_context)'
            };

            const prompt = commandMap[command];
            if (!prompt) {
                console.error(`Unknown command: ${command}`);
                return;
            }

            this.insertPrompt(prompt);
            
            // If loading personality, watch for collaborator name
            if (command === 'L') {
                this.watchForPersonalityLoad();
            }
        }

        toggle() {
            const commands = document.getElementById('cogito-commands');
            const toggle = document.getElementById('cogito-toggle');
            
            if (commands && toggle) {
                const isVisible = commands.style.display !== 'none';
                commands.style.display = isVisible ? 'none' : 'block';
                toggle.textContent = isVisible ? '●' : '○';
                toggle.title = isVisible ? 'Show commands' : 'Hide commands';
                console.log(`🧠 Commands panel ${isVisible ? 'hidden' : 'shown'}`);
            }
        }

        watchForPersonalityLoad() {
            // Watch for MCP responses that contain personality information
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.textContent) {
                            const text = node.textContent;
                            // Look for personality loading confirmation
                            const collaboratorMatch = text.match(/Personality loaded for (\w+)/i) || 
                                                    text.match(/collaborator[":]\s*["]?(\w+)["]?/i);
                            
                            if (collaboratorMatch) {
                                const collaboratorName = collaboratorMatch[1];
                                chrome.storage.local.set({ collaboratorName });
                                chrome.runtime.sendMessage({
                                    action: 'updatePersonality',
                                    collaborator: collaboratorName
                                });
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Stop watching after 10 seconds
            setTimeout(() => observer.disconnect(), 10000);
        }

        generateSessionSummary() {
            // Generate a summary of the current session for reflection
            const messages = document.querySelectorAll('[data-message-author-role]');
            const messageCount = messages.length;
            
            if (messageCount === 0) {
                return "Starting a new conversation session.";
            }
            
            const activities = [
                "collaborative problem-solving",
                "technical implementation work", 
                "conceptual exploration",
                "tool development",
                "personality reflection"
            ];
            
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            return `Current session with ${messageCount} exchanges focused on ${randomActivity} and personality development.`;
        }

        insertPrompt(text) {
            console.log('🧠 Inserting prompt:', text.substring(0, 50) + '...');
            
            // Use liminal-explorer's approach
            const chatInput = document.querySelector('div[contenteditable="true"]') ||
                             document.querySelector('textarea[placeholder*="Talk to Claude"]');
            
            if (!chatInput) {
                console.error('🧠 Could not find chat input');
                return;
            }

            // Insert into chat input (liminal-explorer approach)
            if (chatInput.contentEditable === 'true') {
              // For contenteditable div
              chatInput.textContent = text;
              // Trigger input events
              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
              chatInput.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              // For textarea
              chatInput.value = text;
              chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            chatInput.focus();
            
            // Auto-send after brief delay (liminal-explorer approach)
            setTimeout(() => {
              // Look for Claude.ai send button
              const sendButton = document.querySelector('button[type="submit"]') ||
                                document.querySelector('button[aria-label*="Send"]') ||
                                document.querySelector('svg[data-icon="send"]')?.closest('button') ||
                                document.querySelector('button:last-of-type');
              
              console.log('🧠 Send button found:', !!sendButton, sendButton?.disabled);
              
              if (sendButton && !sendButton.disabled) {
                sendButton.click();
                console.log('🧠 Message sent!');
              }
            }, 500);
        }

        trackInteractions() {
            // Track conversation patterns for personality insights
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.analyzeNewContent(node);
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        analyzeNewContent(node) {
            // Analyze new messages for personality insights
            if (node.querySelector && node.querySelector('[data-message-author-role]')) {
                this.sessionData.interactions.push({
                    timestamp: Date.now(),
                    content: node.textContent?.substring(0, 100) || '',
                    type: 'message'
                });
            }
        }

        addVisualIndicators() {
            // Add visual indicators for personality state
            const indicator = document.createElement('div');
            indicator.id = 'cogito-indicator';
            indicator.className = 'cogito-personality-indicator';
            indicator.innerHTML = '🧠 Cogito Active';
            indicator.title = 'AI Personality Evolution System Active';
            
            document.body.appendChild(indicator);
        }
    }

    // Styles for Cogito interface (using liminal-explorer structure)
    const styles = `
        #cogito-command-panel {
            background: #2d3748;
            border: 1px solid #667eea;
            border-radius: 8px;
            margin: 8px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .cogito-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px 8px 0 0;
            color: white;
            font-size: 12px;
            font-weight: 500;
        }
        
        .cogito-toggle {
            background: none;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .cogito-toggle:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .cogito-commands {
            padding: 12px;
            display: block;
        }
        
        .command-row {
            display: flex;
            gap: 16px;
            margin-bottom: 8px;
        }
        
        .command-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .group-label {
            display: block;
            color: #a0aec0;
            font-size: 10px;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .command-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 1px solid #667eea;
            color: white;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            margin: 2px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .command-btn:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
            border-color: #5a6fd8;
            transform: translateY(-1px);
        }
        
        .command-btn:active {
            transform: translateY(0);
        }

        .cogito-personality-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(102, 126, 234, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 9999;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }

        @media (prefers-color-scheme: dark) {
            #cogito-command-panel {
                background: #1a202c;
                border-color: #4c63d2;
            }
            
            .command-btn {
                background: linear-gradient(135deg, #4c63d2 0%, #5a4d7a 100%);
                border-color: #4c63d2;
            }
            
            .command-btn:hover {
                background: linear-gradient(135deg, #4457c2 0%, #504268 100%);
                border-color: #4457c2;
            }

            .cogito-personality-indicator {
                background: rgba(76, 99, 210, 0.9);
            }
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new PersonalityInterface();
        });
    } else {
        new PersonalityInterface();
    }

    console.log('🧠 Cogito personality evolution system loaded');
})();