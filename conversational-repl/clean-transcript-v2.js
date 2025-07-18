const fs = require('fs');

// Read the transcript
const inputFile = 'block_dd410787-1cae-48b6-8e1e-4a00f21d56f1_transcript.txt';
const outputFile = 'cleaned_transcript_v2.txt';

const transcript = fs.readFileSync(inputFile, 'utf8');

// Function to clean and format the transcript
function cleanTranscript(text) {
    // Split by double newlines to preserve paragraph structure
    let sections = text.split(/\n\n+/);
    
    let cleanedSections = [];
    let currentSpeaker = null;
    
    sections.forEach(section => {
        // Skip empty sections
        if (!section.trim()) return;
        
        // Check if this section starts with a label (like "First Accept:" or "Null Client Test:")
        const labelMatch = section.match(/^([^:]+?):\s*/);
        let workingText = section;
        
        if (labelMatch) {
            // Remove the existing label for processing
            workingText = section.substring(labelMatch[0].length);
        }
        
        // Look for speaker identification patterns
        const speakerPatterns = [
            /\b(?:This is|this is)\s+([A-Z][a-z]+)\b/,
            /\b(?:It's|it's)\s+([A-Z][a-z]+)\b/,
            /^([A-Z][a-z]+):\s*/ // Direct speaker label at start
        ];
        
        let speakerFound = null;
        let textWithoutSpeaker = workingText;
        
        // Try to find speaker in the text
        for (let pattern of speakerPatterns) {
            const match = workingText.match(pattern);
            if (match) {
                let name = match[1];
                
                // Fix common transcription errors
                if (name.toLowerCase() === 'skin') name = 'Ken';
                
                speakerFound = name;
                
                // Remove the speaker identification from the beginning of the text
                if (pattern.source.includes('This is|this is')) {
                    // Remove "This is [Name]" from the beginning
                    textWithoutSpeaker = workingText.replace(/^(?:This is|this is)\s+[A-Z][a-z]+[.,]?\s*/i, '');
                } else if (pattern.source.includes("It's|it's")) {
                    // Remove "It's [Name]" from the beginning
                    textWithoutSpeaker = workingText.replace(/^(?:It's|it's)\s+[A-Z][a-z]+[.,]?\s*/i, '');
                }
                break;
            }
        }
        
        // Update current speaker if we found one
        if (speakerFound) {
            currentSpeaker = speakerFound;
        }
        
        // Clean up the text
        textWithoutSpeaker = textWithoutSpeaker.trim();
        
        // Capitalize first letter
        if (textWithoutSpeaker.length > 0) {
            textWithoutSpeaker = textWithoutSpeaker.charAt(0).toUpperCase() + textWithoutSpeaker.slice(1);
        }
        
        // Add to cleaned sections with appropriate speaker label
        if (currentSpeaker && textWithoutSpeaker) {
            cleanedSections.push(`${currentSpeaker}: ${textWithoutSpeaker}`);
        } else if (textWithoutSpeaker) {
            cleanedSections.push(textWithoutSpeaker);
        }
    });
    
    return cleanedSections.join('\n\n');
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
const lines = cleanedTranscript.split('\n');
console.log(lines.slice(0, 20).join('\n'));