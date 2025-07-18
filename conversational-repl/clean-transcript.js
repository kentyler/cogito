const fs = require('fs');

// Read the transcript
const inputFile = 'block_dd410787-1cae-48b6-8e1e-4a00f21d56f1_transcript.txt';
const outputFile = 'cleaned_transcript.txt';

const transcript = fs.readFileSync(inputFile, 'utf8');

// Function to clean and format the transcript
function cleanTranscript(text) {
    // Split by double newlines to preserve paragraph structure
    let paragraphs = text.split(/\n\n+/);
    
    let cleanedParagraphs = paragraphs.map(paragraph => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return '';
        
        // Extract current speaker label if it exists
        let currentSpeaker = '';
        const speakerMatch = paragraph.match(/^([^:]+?):\s*/);
        if (speakerMatch) {
            currentSpeaker = speakerMatch[1].trim();
            // Remove the speaker label to process the rest
            paragraph = paragraph.substring(speakerMatch[0].length);
        }
        
        // Common patterns for speaker identification
        const patterns = [
            // "This is [Name]" at the beginning or after punctuation
            /(?:^|[.!?]\s*)(?:This is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
            // "It's [Name]" pattern
            /(?:^|[.!?]\s*)(?:It's|it's)\s+([A-Z][a-z]+)\b/g,
            // Handle special cases like "This is skin" -> "This is Ken"
            /(?:^|[.!?]\s*)(?:This is|this is)\s+(skin)\b/gi
        ];
        
        let processedText = paragraph;
        let extractedSpeaker = currentSpeaker;
        
        // Special case corrections
        processedText = processedText.replace(/\bThis is skin\b/gi, 'This is Ken');
        processedText = processedText.replace(/\bthis is skin\b/gi, 'this is Ken');
        
        // Extract speaker from patterns
        for (let pattern of patterns) {
            const matches = [...processedText.matchAll(pattern)];
            if (matches.length > 0) {
                // Get the first match's speaker name
                let speakerName = matches[0][1];
                
                // Correct common misrecognitions
                if (speakerName.toLowerCase() === 'skin') speakerName = 'Ken';
                
                // Capitalize properly
                speakerName = speakerName.charAt(0).toUpperCase() + speakerName.slice(1);
                
                if (!extractedSpeaker && speakerName) {
                    extractedSpeaker = speakerName;
                }
                
                // Remove all "This is [Name]" patterns from the text
                processedText = processedText.replace(/(?:^|[.!?]\s*)(?:This is|this is|It's|it's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[.,]?\s*/g, (match, name, offset) => {
                    // If it's at the beginning, remove completely
                    if (offset === 0 || match.match(/^[.!?]\s/)) {
                        return match.match(/^[.!?]\s/) ? match.charAt(0) + ' ' : '';
                    }
                    return match;
                });
            }
        }
        
        // Clean up extra spaces and capitalize first letter
        processedText = processedText.trim();
        if (processedText.length > 0) {
            processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
        }
        
        // Return with speaker label
        if (extractedSpeaker && processedText) {
            return `${extractedSpeaker}: ${processedText}`;
        } else if (processedText) {
            return processedText;
        }
        return '';
    });
    
    // Remove empty paragraphs and join
    return cleanedParagraphs.filter(p => p.trim() !== '').join('\n\n');
}

// Process the transcript
const cleanedTranscript = cleanTranscript(transcript);

// Write the cleaned transcript
fs.writeFileSync(outputFile, cleanedTranscript);
console.log(`Cleaned transcript saved to: ${outputFile}`);

// Also save to Windows desktop
const windowsPath = '/mnt/c/Users/ken/Desktop/claudestuff/cleaned_transcript_conflict_club_7-16.txt';
fs.writeFileSync(windowsPath, cleanedTranscript);
console.log(`Also saved to Windows desktop: ${windowsPath}`);

// Show a sample of the cleaning
console.log('\nSample of cleaned text:');
console.log('======================');
console.log(cleanedTranscript.substring(0, 1000) + '...');