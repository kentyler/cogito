#!/usr/bin/env python3
"""
Semantic location search service
Handles embedding generation and similarity search for locations
"""

import sys
import json
import argparse
import psycopg2
from sentence_transformers import SentenceTransformer
import os

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'cogito_multi',
    'user': 'ken',
    'password': '7297'
}

class SemanticSearchService:
    def __init__(self):
        self.conn = None
        self.model = None
        self.connect_db()
        self.load_model()
    
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
        except Exception as e:
            print(f"Database connection failed: {e}", file=sys.stderr)
            sys.exit(1)
    
    def load_model(self):
        """Load the sentence transformer model"""
        try:
            # Change to the embedding environment directory
            embedding_env_path = os.path.join(os.path.dirname(__file__), '..', 'embedding_env')
            if os.path.exists(embedding_env_path):
                sys.path.insert(0, os.path.join(embedding_env_path, 'lib', 'python3.12', 'site-packages'))
            
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Failed to load model: {e}", file=sys.stderr)
            sys.exit(1)
    
    def search(self, query, limit=5):
        """Search locations using semantic similarity"""
        try:
            # Generate query embedding
            query_embedding = self.model.encode(query).tolist()
            
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT file_path, description, project, category, tags, metadata,
                       1 - (embedding <=> %s::vector) as similarity
                FROM locations
                WHERE embedding IS NOT NULL
                ORDER BY similarity DESC
                LIMIT %s
            """, (query_embedding, limit))
            
            results = cursor.fetchall()
            
            # Format results
            formatted_results = []
            for row in results:
                file_path, description, project, category, tags, metadata, similarity = row
                formatted_results.append({
                    'file_path': file_path,
                    'description': description,
                    'project': project,
                    'category': category,
                    'tags': tags,
                    'metadata': metadata,
                    'similarity': float(similarity)
                })
            
            return formatted_results
            
        except Exception as e:
            print(f"Search failed: {e}", file=sys.stderr)
            return []
    
    def embed_text(self, text, file_path):
        """Generate and save embedding for a location"""
        try:
            # Generate embedding
            embedding = self.model.encode(text).tolist()
            
            # Update database
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE locations
                SET embedding = %s
                WHERE file_path = %s
            """, (embedding, file_path))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            print(f"Failed to embed text: {e}", file=sys.stderr)
            return False
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

def main():
    parser = argparse.ArgumentParser(description='Semantic location search service')
    parser.add_argument('--query', help='Search query')
    parser.add_argument('--limit', type=int, default=5, help='Maximum results')
    parser.add_argument('--embed', action='store_true', help='Generate embedding mode')
    parser.add_argument('--text', help='Text to embed')
    parser.add_argument('--file_path', help='File path for embedding')
    
    args = parser.parse_args()
    
    service = SemanticSearchService()
    
    try:
        if args.embed:
            # Generate embedding for new location
            if not args.text or not args.file_path:
                print("--text and --file_path required for embedding", file=sys.stderr)
                sys.exit(1)
            
            success = service.embed_text(args.text, args.file_path)
            sys.exit(0 if success else 1)
        
        elif args.query:
            # Perform search
            results = service.search(args.query, args.limit)
            print(json.dumps(results, indent=2))
        
        else:
            print("Either --query or --embed must be specified", file=sys.stderr)
            sys.exit(1)
    
    finally:
        service.close()

if __name__ == "__main__":
    main()