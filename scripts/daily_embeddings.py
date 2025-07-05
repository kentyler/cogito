#!/usr/bin/env python3
"""
Daily embedding script for session notes and essays
Processes session files (=== separators) and essay files (paragraph-based)
Stores embeddings with content_type metadata for discourse enrichment
"""

import os
import uuid
import psycopg2
import glob
import json
from datetime import datetime, date
from decimal import Decimal
from sentence_transformers import SentenceTransformer
import numpy as np

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'cogito',
    'user': 'cogito',
    'password': '7297'
}

# Participant IDs
PARTICIPANT_KEN = 572
PARTICIPANT_CLAUDE = 989

# Topic IDs
SESSION_NOTES_TOPIC_ID = 2  # Different from captured snippets (topic_id=1)
ESSAYS_TOPIC_ID = 3  # For essay content

class EmbeddingProcessor:
    def __init__(self):
        self.conn = None
        self.model = None
        self.connect_db()
        self.load_model()
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            print("✓ Connected to database")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            exit(1)
    
    def load_model(self):
        """Load the sentence transformer model"""
        try:
            print("Loading embedding model...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✓ Model loaded (all-MiniLM-L6-v2)")
        except Exception as e:
            print(f"✗ Failed to load model: {e}")
            print("Install with: pip install sentence-transformers")
            exit(1)
    
    def parse_session_file(self, file_path):
        """Parse a session file by === separators, with sub-chunking on ● bullets"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split by === separators first
            main_chunks = content.split('===')
            main_chunks = [chunk.strip() for chunk in main_chunks if chunk.strip()]
            
            final_chunks = []
            
            for main_chunk in main_chunks:
                # Check if chunk is too long (rough estimate: 2000 chars ≈ 512 tokens)
                if len(main_chunk) > 2000:
                    print(f"  Large chunk ({len(main_chunk)} chars) - sub-chunking on ●")
                    
                    # Split on bullet points
                    sub_chunks = main_chunk.split('●')
                    sub_chunks = [chunk.strip() for chunk in sub_chunks if chunk.strip()]
                    
                    # Mark sub-chunks and add them
                    for sub_chunk in sub_chunks:
                        final_chunks.append((sub_chunk, True))  # (text, is_subchunk)
                else:
                    final_chunks.append((main_chunk, False))  # (text, is_subchunk)
            
            print(f"Found {len(final_chunks)} chunks in {os.path.basename(file_path)}")
            return final_chunks
            
        except Exception as e:
            print(f"✗ Failed to parse {file_path}: {e}")
            return []
    
    def generate_embedding(self, text):
        """Generate embedding for text"""
        try:
            # Truncate if too long (512 token limit for this model)
            if len(text) > 2000:  # Rough token estimate
                text = text[:2000] + "..."
                print(f"  Truncated long text to 2000 chars")
            
            embedding = self.model.encode(text)
            return embedding.tolist()  # Convert numpy array to list
            
        except Exception as e:
            print(f"✗ Failed to generate embedding: {e}")
            return None
    
    def get_next_turn_index(self, topic_id):
        """Get the next turn index for a topic"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT COALESCE(MAX(turn_index), 0) + 1
                    FROM participant_topic_turns 
                    WHERE topic_id = %s
                """, (topic_id,))
                return cur.fetchone()[0]
        except Exception as e:
            print(f"✗ Failed to get turn index: {e}")
            return Decimal('1')
    
    def save_chunk(self, text, embedding, file_path, chunk_index, is_subchunk=False, participant_id=PARTICIPANT_KEN, content_type='session', topic_id=None, project_id=4):
        """Save chunk and embedding to database"""
        try:
            effective_topic_id = topic_id or SESSION_NOTES_TOPIC_ID
            turn_index = self.get_next_turn_index(effective_topic_id)
            
            # Prepare metadata
            metadata = {
                'source_file': os.path.basename(file_path),
                'chunk_index': chunk_index,
                'full_path': file_path,
                'is_subchunk': is_subchunk,
                'content_type': content_type,
                'project_id': project_id
            }
            
            with self.conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO participant_topic_turns (
                        id, participant_id, topic_id, turn_index, 
                        content_text, content_vector, embedding_model,
                        metadata, project_id, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    str(uuid.uuid4()),
                    participant_id,
                    effective_topic_id,
                    turn_index,
                    text,
                    embedding,  # PostgreSQL can handle Python lists for vectors
                    'all-MiniLM-L6-v2',
                    json.dumps(metadata),
                    project_id,
                    datetime.now(),
                    datetime.now()
                ))
                self.conn.commit()
                
            print(f"  ✓ Saved chunk {chunk_index} (turn {turn_index})")
            
        except Exception as e:
            print(f"  ✗ Failed to save chunk {chunk_index}: {e}")
            self.conn.rollback()
    
    def process_file(self, file_path):
        """Process a single session file"""
        print(f"\nProcessing {os.path.basename(file_path)}...")
        
        chunks = self.parse_session_file(file_path)
        if not chunks:
            return
        
        for i, (chunk_text, is_subchunk) in enumerate(chunks):
            subchunk_indicator = " (subchunk)" if is_subchunk else ""
            print(f"  Processing chunk {i+1}/{len(chunks)} ({len(chunk_text)} chars){subchunk_indicator}")
            
            # Generate embedding
            embedding = self.generate_embedding(chunk_text)
            if embedding is None:
                continue
            
            # Save to database
            self.save_chunk(chunk_text, embedding, file_path, i+1, is_subchunk, 
                          PARTICIPANT_KEN, content_type='session', topic_id=SESSION_NOTES_TOPIC_ID, project_id=4)
    
    def parse_essay_file(self, file_path):
        """Parse an essay file by paragraphs for better chunking"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split by double newlines (paragraphs) for essays
            paragraphs = content.split('\n\n')
            paragraphs = [p.strip() for p in paragraphs if p.strip()]
            
            final_chunks = []
            
            for paragraph in paragraphs:
                # If paragraph is too long, split by sentences
                if len(paragraph) > 2000:
                    sentences = paragraph.split('. ')
                    current_chunk = ''
                    
                    for sentence in sentences:
                        if len(current_chunk + sentence) > 2000:
                            if current_chunk:
                                final_chunks.append((current_chunk.strip(), True))
                            current_chunk = sentence + '. '
                        else:
                            current_chunk += sentence + '. '
                    
                    if current_chunk:
                        final_chunks.append((current_chunk.strip(), True))
                else:
                    final_chunks.append((paragraph, False))
            
            print(f"Found {len(final_chunks)} chunks in essay {os.path.basename(file_path)}")
            return final_chunks
            
        except Exception as e:
            print(f"✗ Failed to parse essay {file_path}: {e}")
            return []
    
    def process_essay_file(self, file_path):
        """Process a single essay file"""
        print(f"\nProcessing essay {os.path.basename(file_path)}...")
        
        chunks = self.parse_essay_file(file_path)
        if not chunks:
            return
        
        for i, (chunk_text, is_subchunk) in enumerate(chunks):
            subchunk_indicator = " (split)" if is_subchunk else ""
            print(f"  Processing chunk {i+1}/{len(chunks)} ({len(chunk_text)} chars){subchunk_indicator}")
            
            # Generate embedding
            embedding = self.generate_embedding(chunk_text)
            if embedding is None:
                continue
            
            # Save to database with essay content type
            self.save_chunk(chunk_text, embedding, file_path, i+1, is_subchunk, 
                          PARTICIPANT_KEN, content_type='essay', topic_id=ESSAYS_TOPIC_ID, project_id=4)
    
    def process_session_directory(self, directory_path):
        """Process all session files in a directory"""
        pattern = os.path.join(directory_path, "*-session-notes.txt")
        files = glob.glob(pattern)
        
        if not files:
            print(f"No session files found in {directory_path}")
            print(f"Looking for pattern: *-session-notes.txt")
            return
        
        print(f"Found {len(files)} session files")
        
        for file_path in sorted(files):
            self.process_file(file_path)
    
    def process_essays_directory(self, directory_path):
        """Process all essay files in a directory"""
        patterns = [
            os.path.join(directory_path, "*.md"),
            os.path.join(directory_path, "*.txt"),
            os.path.join(directory_path, "*.essay")
        ]
        
        files = []
        for pattern in patterns:
            files.extend(glob.glob(pattern))
        
        if not files:
            print(f"No essay files found in {directory_path}")
            print(f"Looking for patterns: *.md, *.txt, *.essay")
            return
        
        print(f"Found {len(files)} essay files")
        
        for file_path in sorted(files):
            self.process_essay_file(file_path)
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

def main():
    import sys
    
    processor = EmbeddingProcessor()
    
    try:
        if len(sys.argv) > 1:
            arg = sys.argv[1]
            if arg == "--essays":
                # Process essays directory
                essays_dir = sys.argv[2] if len(sys.argv) > 2 else "./essays"
                processor.process_essays_directory(essays_dir)
            elif arg == "--sessions":
                # Process sessions directory
                sessions_dir = sys.argv[2] if len(sys.argv) > 2 else "/mnt/c/Users/ken/Desktop/claudestuff"
                processor.process_session_directory(sessions_dir)
            else:
                # Process specific file
                file_path = arg
                if file_path.endswith(('.md', '.txt', '.essay')):
                    processor.process_essay_file(file_path)
                else:
                    processor.process_file(file_path)
        else:
            # Process both sessions and essays by default
            print("Processing session notes...")
            directory = "/mnt/c/Users/ken/Desktop/claudestuff"
            processor.process_session_directory(directory)
            
            print("\nProcessing essays...")
            essays_dir = "./essays"
            if os.path.exists(essays_dir):
                processor.process_essays_directory(essays_dir)
            else:
                print(f"Essays directory {essays_dir} not found, skipping")
    
    finally:
        processor.close()

if __name__ == "__main__":
    main()