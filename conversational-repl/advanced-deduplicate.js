const fs = require('fs');

// Read the cleaned transcript
const inputFile = 'cleaned_transcript_v2.txt';
const outputFile = 'fully_deduplicated_transcript.txt';

const transcript = fs.readFileSync(inputFile, 'utf8');

// Function to normalize text for comparison
function normalizeText(text) {
    return text.toLowerCase()
        .replace(/[.,!?;:]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Function to find sentence boundaries
function splitIntoSentences(text) {
    return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

// Function to remove duplicate sentences within a paragraph
function removeDuplicateSentences(text) {
    const sentences = splitIntoSentences(text);
    const seen = new Set();
    const uniqueSentences = [];
    
    for (let sentence of sentences) {
        const normalized = normalizeText(sentence);
        if (!seen.has(normalized) && normalized.length > 20) {
            seen.add(normalized);
            uniqueSentences.push(sentence);
        }
    }
    
    return uniqueSentences.join(' ');
}

// Function to detect and remove repeated blocks
function removeRepeatedBlocks(text) {
    const words = text.split(/\s+/);
    let cleanedText = text;
    
    // Look for repeated sequences of various lengths
    for (let blockSize = 30; blockSize >= 10; blockSize--) {
        for (let i = 0; i <= words.length - blockSize * 2; i++) {
            const block = words.slice(i, i + blockSize).join(' ');
            const nextBlock = words.slice(i + blockSize, i + blockSize * 2).join(' ');
            
            if (normalizeText(block) === normalizeText(nextBlock)) {
                // Found a repeated block - remove the duplicate
                const beforeBlock = words.slice(0, i + blockSize).join(' ');
                const afterBlock = words.slice(i + blockSize * 2).join(' ');
                cleanedText = beforeBlock + ' ' + afterBlock;
                words.splice(i + blockSize, blockSize); // Remove the duplicate from our working array
                console.log(`Removed duplicate block (${blockSize} words): ${block.substring(0, 100)}...`);
                break;
            }
        }
    }
    
    return cleanedText;
}

// Function to process the entire transcript
function deduplicateTranscript(text) {
    const sections = text.split(/\n\n+/);
    const processedSections = [];
    
    for (let section of sections) {
        if (!section.trim()) continue;
        
        // Extract speaker and content
        const speakerMatch = section.match(/^([^:]+):\s*/);
        let speaker = '';
        let content = section;
        
        if (speakerMatch) {
            speaker = speakerMatch[1];
            content = section.substring(speakerMatch[0].length);
        }
        
        // Remove repeated blocks within the content
        content = removeRepeatedBlocks(content);
        
        // Remove duplicate sentences
        content = removeDuplicateSentences(content);
        
        // Clean up spacing
        content = content.replace(/\s+/g, ' ').trim();
        
        if (content.length > 10) {
            processedSections.push(speaker ? `${speaker}: ${content}` : content);
        }
    }
    
    // Second pass: remove duplicate sections
    const finalSections = [];
    const seenSections = new Set();
    
    for (let section of processedSections) {
        const speakerMatch = section.match(/^([^:]+):\s*/);
        let content = section;
        
        if (speakerMatch) {
            content = section.substring(speakerMatch[0].length);
        }
        
        const normalized = normalizeText(content);
        
        // Check if this content is substantially similar to something we've seen
        let isDuplicate = false;
        for (let seenNormalized of seenSections) {
            // If 80% of this content overlaps with something we've seen, consider it a duplicate
            const intersection = findCommonWords(normalized, seenNormalized);
            const similarity = intersection.length / Math.max(normalized.split(' ').length, seenNormalized.split(' ').length);
            
            if (similarity > 0.8) {
                isDuplicate = true;
                console.log(`Skipping similar section: ${content.substring(0, 50)}...`);
                break;
            }
        }
        
        if (!isDuplicate) {
            seenSections.add(normalized);
            finalSections.push(section);
        }
    }
    
    return finalSections.join('\n\n');
}

// Helper function to find common words between two texts
function findCommonWords(text1, text2) {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    
    return [...words1].filter(word => words2.has(word));
}

// Process the transcript
console.log('Processing transcript to remove all duplicates...');
const deduplicated = deduplicateTranscript(transcript);

// Write the deduplicated transcript
fs.writeFileSync(outputFile, deduplicated);
console.log(`\nFully deduplicated transcript saved to: ${outputFile}`);

// Also save to Windows desktop
try {
    const windowsPath = '/mnt/c/Users/ken/Desktop/claudestuff/fully_deduplicated_transcript_conflict_club_7-16.txt';
    fs.writeFileSync(windowsPath, deduplicated);
    console.log(`Also saved to Windows desktop: ${windowsPath}`);
} catch (err) {
    console.log('Could not save to Windows desktop directly. Please copy manually.');
}

// Show statistics
const originalLength = transcript.length;
const dedupedLength = deduplicated.length;
const originalSections = transcript.split(/\n\n+/).length;
const dedupedSections = deduplicated.split(/\n\n+/).length;

console.log(`\nStatistics:`);
console.log(`Original character count: ${originalLength}`);
console.log(`Deduplicated character count: ${dedupedLength}`);
console.log(`Character reduction: ${((1 - dedupedLength/originalLength) * 100).toFixed(1)}%`);
console.log(`Original sections: ${originalSections}`);
console.log(`Deduplicated sections: ${dedupedSections}`);
console.log(`Section reduction: ${((1 - dedupedSections/originalSections) * 100).toFixed(1)}%`);