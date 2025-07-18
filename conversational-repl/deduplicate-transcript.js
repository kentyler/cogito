const fs = require('fs');

// Read the cleaned transcript
const inputFile = 'cleaned_transcript_v2.txt';
const outputFile = 'deduplicated_transcript.txt';

const transcript = fs.readFileSync(inputFile, 'utf8');

// Function to normalize text for comparison (remove extra spaces, lowercase)
function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Function to find and remove duplicates
function deduplicateTranscript(text) {
    // Split by speaker turns (paragraphs)
    const paragraphs = text.split(/\n\n+/);
    
    const dedupedParagraphs = [];
    const seenNormalized = new Set();
    
    for (let para of paragraphs) {
        if (!para.trim()) continue;
        
        // Extract speaker and content
        const speakerMatch = para.match(/^([^:]+):\s*/);
        let speaker = '';
        let content = para;
        
        if (speakerMatch) {
            speaker = speakerMatch[1];
            content = para.substring(speakerMatch[0].length);
        }
        
        // Check for exact duplicates
        const normalizedContent = normalizeText(content);
        if (seenNormalized.has(normalizedContent)) {
            console.log(`Skipping duplicate from ${speaker || 'Unknown'}: ${content.substring(0, 50)}...`);
            continue;
        }
        
        // Check for partial duplicates (content that starts the same way)
        let isDuplicate = false;
        for (let seen of seenNormalized) {
            // If this content is contained within something we've already seen
            if (seen.includes(normalizedContent)) {
                isDuplicate = true;
                console.log(`Skipping partial duplicate from ${speaker || 'Unknown'}: ${content.substring(0, 50)}...`);
                break;
            }
            // If what we've seen is contained within this content (this is longer)
            if (normalizedContent.includes(seen)) {
                // Remove the shorter version
                seenNormalized.delete(seen);
                // Find and remove the shorter version from dedupedParagraphs
                dedupedParagraphs.forEach((p, idx) => {
                    const pContent = p.includes(':') ? p.substring(p.indexOf(':') + 1).trim() : p;
                    if (normalizeText(pContent) === seen) {
                        dedupedParagraphs.splice(idx, 1);
                        console.log(`Removing shorter version: ${pContent.substring(0, 50)}...`);
                    }
                });
            }
        }
        
        if (!isDuplicate) {
            seenNormalized.add(normalizedContent);
            dedupedParagraphs.push(para);
        }
    }
    
    // Additional pass to remove repetitive blocks within the same speaker turn
    const finalParagraphs = [];
    
    for (let para of dedupedParagraphs) {
        const speakerMatch = para.match(/^([^:]+):\s*/);
        let speaker = '';
        let content = para;
        
        if (speakerMatch) {
            speaker = speakerMatch[1];
            content = para.substring(speakerMatch[0].length);
        }
        
        // Split content into sentences
        const sentences = content.split(/(?<=[.!?])\s+/);
        const dedupedSentences = [];
        const seenSentences = new Set();
        
        for (let sentence of sentences) {
            const normalized = normalizeText(sentence);
            if (!seenSentences.has(normalized) && normalized.length > 10) {
                seenSentences.add(normalized);
                dedupedSentences.push(sentence);
            }
        }
        
        // Check for repeated blocks within the content
        let cleanedContent = dedupedSentences.join(' ');
        
        // Find and remove repeated phrases (more than 50 characters)
        const words = cleanedContent.split(' ');
        for (let len = 20; len > 5; len--) { // Check for repeated sequences of words
            for (let i = 0; i < words.length - len; i++) {
                const phrase = words.slice(i, i + len).join(' ');
                const phraseRegex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const matches = cleanedContent.match(phraseRegex);
                if (matches && matches.length > 1) {
                    // Keep only the first occurrence
                    cleanedContent = cleanedContent.replace(phraseRegex, (match, offset) => {
                        return offset === cleanedContent.indexOf(phrase) ? match : '';
                    });
                    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
                }
            }
        }
        
        if (cleanedContent.trim()) {
            finalParagraphs.push(speaker ? `${speaker}: ${cleanedContent}` : cleanedContent);
        }
    }
    
    return finalParagraphs.join('\n\n');
}

// Process the transcript
console.log('Processing transcript to remove duplicates...');
const deduplicated = deduplicateTranscript(transcript);

// Write the deduplicated transcript
fs.writeFileSync(outputFile, deduplicated);
console.log(`\nDeduplicated transcript saved to: ${outputFile}`);

// Also save to Windows desktop
try {
    const windowsPath = '/mnt/c/Users/ken/Desktop/claudestuff/deduplicated_transcript_conflict_club_7-16.txt';
    fs.writeFileSync(windowsPath, deduplicated);
    console.log(`Also saved to Windows desktop: ${windowsPath}`);
} catch (err) {
    console.log('Could not save to Windows desktop directly. Please copy manually.');
}

// Show statistics
const originalLines = transcript.split('\n').length;
const dedupedLines = deduplicated.split('\n').length;
console.log(`\nStatistics:`);
console.log(`Original lines: ${originalLines}`);
console.log(`Deduplicated lines: ${dedupedLines}`);
console.log(`Reduction: ${((1 - dedupedLines/originalLines) * 100).toFixed(1)}%`);