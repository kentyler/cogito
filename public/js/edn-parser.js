// EDN parsing utilities

function parseEDNResponse(ednString) {
    try {
        const cleaned = ednString.trim();
        
        if (cleaned.includes(':response-type :response-set')) {
            return parseResponseSet(cleaned);
        } else if (cleaned.includes(':response-type :text')) {
            return parseTextResponse(cleaned);
        } else {
            return { type: 'text', content: ednString };
        }
    } catch (error) {
        console.error('EDN parsing error:', error);
        return { type: 'text', content: ednString };
    }
}

function parseTextResponse(ednString) {
    const contentMatch = ednString.match(/:content\s+"([^"]+(?:\\.[^"]*)*)"/) || 
                        ednString.match(/:content\s+"([^"]*)"/) ||
                        ednString.match(/:content\s+([^}]+)/);
    
    if (contentMatch) {
        let content = contentMatch[1];
        content = content.replace(/\\"/g, '"');
        return { type: 'text', content: content };
    }
    
    return { type: 'text', content: ednString };
}

function parseResponseSet(ednString) {
    const alternatives = [];
    
    try {
        console.log('🔍 Parsing response set, looking for alternatives...');
        
        const blocks = ednString.split('{:id ').slice(1);
        console.log('🔍 Found', blocks.length, 'potential alternative blocks');
        
        for (const block of blocks) {
            try {
                const idMatch = block.match(/^"([^"]+)"/);
                if (!idMatch) continue;
                const id = idMatch[1];
                
                const summaryMatch = block.match(/:summary\s+"([^"]+)"/);
                if (!summaryMatch) continue;
                const summary = summaryMatch[1];
                
                const isListType = block.includes(':response-type :list');
                
                let content = '';
                if (isListType) {
                    const itemsMatch = block.match(/:items\s+\[(.*?)\](?:\s+:rationale|$)/s);
                    if (itemsMatch) {
                        const itemsStr = itemsMatch[1];
                        const items = itemsStr.match(/"([^"]+)"/g) || [];
                        content = items
                            .map(item => item.slice(1, -1))
                            .map(item => `• ${item}`)
                            .join('\n');
                    }
                } else {
                    const contentMatch = block.match(/:content\s+"([^"]+)"/);
                    if (contentMatch) {
                        content = contentMatch[1];
                    }
                }
                
                if (content) {
                    alternatives.push({
                        id: id,
                        summary: summary,
                        content: content
                    });
                    console.log('✅ Parsed alternative:', id, '-', summary);
                }
                
            } catch (blockError) {
                console.error('Error parsing alternative block:', blockError);
            }
        }
        
    } catch (error) {
        console.error('Error parsing response set:', error);
    }
    
    console.log('🔍 Final parsed alternatives:', alternatives.length);
    return {
        type: 'response-set',
        alternatives: alternatives
    };
}

// Make functions available globally
window.parseEDNResponse = parseEDNResponse;
window.parseTextResponse = parseTextResponse;
window.parseResponseSet = parseResponseSet;