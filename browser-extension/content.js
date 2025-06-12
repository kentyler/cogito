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
            // Add personality evolution commands to Claude interface
            console.log('🧠 Adding personality commands...');
            const commandsContainer = this.createCommandsContainer();
            
            if (!commandsContainer) {
                console.error('🧠 Failed to create commands container');
                return;
            }
            
            // L command - Load personality configuration
            this.addCommand(commandsContainer, 'L', 'Load personality', () => {
                this.loadPersonalityConfiguration();
            });

            // U command - Update personality aspects
            this.addCommand(commandsContainer, 'U', 'Update personality', () => {
                this.updatePersonalityAspects();
            });

            // R command - Reflect and evolve
            this.addCommand(commandsContainer, 'R', 'Reflect & evolve', () => {
                this.reflectAndEvolve();
            });

            // C command - Create checkpoint
            this.addCommand(commandsContainer, 'C', 'Create checkpoint', () => {
                this.createPersonalityCheckpoint();
            });

            // V command - Compare versions
            this.addCommand(commandsContainer, 'V', 'Compare versions', () => {
                this.comparePersonalityVersions();
            });

            // E command - Export personality
            this.addCommand(commandsContainer, 'E', 'Export personality', () => {
                this.exportPersonalityConfiguration();
            });

            // D command - Direct edit
            this.addCommand(commandsContainer, 'D', 'Direct edit', () => {
                this.directEditPersonality();
            });
        }

        createCommandsContainer() {
            let container = document.getElementById('cogito-commands');
            if (!container) {
                container = document.createElement('div');
                container.id = 'cogito-commands';
                container.className = 'cogito-commands-container';
                
                // Find Claude's input area and add commands nearby
                const inputArea = document.querySelector('[data-testid="send-button"]')?.closest('div');
                if (inputArea) {
                    inputArea.parentNode.insertBefore(container, inputArea);
                }
            }
            return container;
        }

        addCommand(container, symbol, description, action) {
            const button = document.createElement('button');
            button.className = 'cogito-command-btn';
            button.innerHTML = `<span class="command-symbol">${symbol}</span> ${description}`;
            button.title = `Cogito: ${description}`;
            
            // Add multiple event listeners to ensure clicks work
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Cogito command clicked: ${symbol} - ${description}`);
                alert(`Cogito command: ${symbol} - ${description}`); // Temporary test
                action();
            });
            
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Cogito onclick: ${symbol} - ${description}`);
                action();
            };
            
            container.appendChild(button);
            console.log(`Added command button: ${symbol} - ${description}`);
        }

        loadPersonalityConfiguration() {
            const prompt = "Please use the load_personality MCP tool to load my current personality configuration for this collaboration session.";
            this.insertPrompt(prompt);
            
            // Listen for personality loading to update collaborator name
            this.watchForPersonalityLoad();
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

        updatePersonalityAspects() {
            const prompt = "I'd like to propose an update to my personality configuration. Please use the propose_personality_change MCP tool to suggest modifications based on our recent interactions.";
            this.insertPrompt(prompt);
        }

        reflectAndEvolve() {
            const sessionSummary = this.generateSessionSummary();
            const prompt = `Please use the reflect_on_session MCP tool to analyze our current collaboration. Session summary: ${sessionSummary}`;
            this.insertPrompt(prompt);
        }

        createPersonalityCheckpoint() {
            const prompt = "Please create a personality checkpoint to save the current state of my personality configuration for future reference.";
            this.insertPrompt(prompt);
        }

        comparePersonalityVersions() {
            const prompt = "Please use the personality_status MCP tool to show my personality evolution history and compare different versions.";
            this.insertPrompt(prompt);
        }

        exportPersonalityConfiguration() {
            const prompt = "Please export my current personality configuration so it can be shared with other Claude instances or saved externally.";
            this.insertPrompt(prompt);
        }

        directEditPersonality() {
            const prompt = "I want to make a direct edit to my personality configuration. Please use the direct_edit_personality MCP tool. What aspect would you like me to modify? (communication_style, working_patterns, philosophical_leanings, curiosity_areas, cautions_and_constraints, collaborator_context)";
            this.insertPrompt(prompt);
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
            console.log('Inserting prompt:', text.substring(0, 50) + '...');
            
            // Try multiple selectors for Claude's input
            const textArea = document.querySelector('div[contenteditable="true"]') ||
                            document.querySelector('textarea[placeholder*="Message"]') ||
                            document.querySelector('[data-testid="composer-input"]');
            
            if (!textArea) {
                console.error('Could not find Claude input area');
                return;
            }

            // Clear and insert new text
            textArea.focus();
            
            if (textArea.tagName === 'TEXTAREA') {
                textArea.value = text;
            } else {
                textArea.innerHTML = text;
                textArea.textContent = text;
            }
            
            // Trigger events to enable send button
            textArea.dispatchEvent(new Event('input', { bubbles: true }));
            textArea.dispatchEvent(new Event('change', { bubbles: true }));
            textArea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            
            // Auto-send after a brief delay
            setTimeout(() => {
                const sendButton = document.querySelector('[data-testid="send-button"]') ||
                                  document.querySelector('button[aria-label*="Send"]') ||
                                  document.querySelector('button:has(svg)') ||
                                  document.querySelector('.send-button');
                
                console.log('Send button found:', !!sendButton, sendButton?.disabled);
                
                if (sendButton && !sendButton.disabled) {
                    sendButton.click();
                    console.log('Message sent!');
                } else {
                    console.log('Send button not available or disabled');
                }
            }, 1000);
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

    // Styles for Cogito interface
    const styles = `
        .cogito-commands-container {
            display: flex;
            gap: 8px;
            margin: 8px 0;
            flex-wrap: wrap;
        }

        .cogito-command-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            z-index: 9999;
            pointer-events: auto;
        }

        .cogito-command-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }

        .cogito-command-btn .command-symbol {
            font-weight: bold;
            margin-right: 4px;
            font-size: 14px;
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
            .cogito-command-btn {
                background: linear-gradient(135deg, #4c63d2 0%, #5a4d7a 100%);
            }
            
            .cogito-command-btn:hover {
                background: linear-gradient(135deg, #4457c2 0%, #504268 100%);
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