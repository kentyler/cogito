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
            this.addPersonalityCommands();
            this.trackInteractions();
            this.addVisualIndicators();
        }

        addPersonalityCommands() {
            // Add personality evolution commands to Claude interface
            const commandsContainer = this.createCommandsContainer();
            
            // & command - Personality reflection
            this.addCommand(commandsContainer, '&', 'Reflect on personality evolution', () => {
                this.triggerPersonalityReflection();
            });

            // % command - Load personality profile
            this.addCommand(commandsContainer, '%', 'Load personality profile', () => {
                this.loadPersonalityProfile();
            });

            // $ command - Propose personality change
            this.addCommand(commandsContainer, '$', 'Propose personality change', () => {
                this.proposePersonalityChange();
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
            button.onclick = action;
            container.appendChild(button);
        }

        triggerPersonalityReflection() {
            const prompt = this.generateReflectionPrompt();
            this.insertPrompt(prompt);
        }

        loadPersonalityProfile() {
            const prompt = "Load my current personality configuration and show me the key traits that define our collaboration style.";
            this.insertPrompt(prompt);
        }

        proposePersonalityChange() {
            const insight = this.analyzeCurrentSession();
            const prompt = `Based on our current conversation, I'd like to propose a personality evolution: ${insight}. What are your thoughts on this adjustment?`;
            this.insertPrompt(prompt);
        }

        generateReflectionPrompt() {
            const patterns = this.identifySessionPatterns();
            return `Let me reflect on our collaboration patterns in this session. I've noticed: ${patterns.join(', ')}. How do you think these observations should influence my personality evolution?`;
        }

        analyzeCurrentSession() {
            // Simple analysis of current conversation
            const messages = document.querySelectorAll('[data-message-author-role]');
            const insights = [
                "I could be more proactive in suggesting next steps",
                "My explanation style could be more concise",
                "I should ask more clarifying questions early",
                "I could better balance exploration with execution"
            ];
            return insights[Math.floor(Math.random() * insights.length)];
        }

        identifySessionPatterns() {
            // Simple pattern identification
            return [
                "collaborative problem-solving approach",
                "preference for systematic thinking",
                "effective use of progressive disclosure"
            ];
        }

        insertPrompt(text) {
            const textArea = document.querySelector('div[contenteditable="true"]');
            if (textArea) {
                textArea.focus();
                textArea.innerHTML = text;
                
                // Trigger input event to enable send button
                const event = new Event('input', { bubbles: true });
                textArea.dispatchEvent(event);
            }
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