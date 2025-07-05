#!/usr/bin/env python3
"""
Generate embeddings for all location descriptions to enable semantic search
"""

import psycopg2
from sentence_transformers import SentenceTransformer
import json
import numpy as np

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'cogito_multi',
    'user': 'ken',
    'password': '7297'
}

class LocationEmbedder:
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
    
    def generate_embeddings(self):
        """Generate embeddings for all locations"""
        cursor = self.conn.cursor()
        
        # First, add embedding column if it doesn't exist
        try:
            cursor.execute("""
                ALTER TABLE locations 
                ADD COLUMN IF NOT EXISTS embedding vector(384)
            """)
            self.conn.commit()
            print("✓ Embedding column ready")
        except Exception as e:
            print(f"✗ Failed to add embedding column: {e}")
            self.conn.rollback()
            return
        
        # Get all locations
        cursor.execute("""
            SELECT id, file_path, description, project, category, tags
            FROM locations
            WHERE embedding IS NULL
        """)
        
        locations = cursor.fetchall()
        print(f"\nFound {len(locations)} locations without embeddings")
        
        for loc_id, file_path, description, project, category, tags in locations:
            # Create rich text for embedding (combine all searchable fields)
            search_text = f"{description}"
            if project:
                search_text += f" project:{project}"
            if category:
                search_text += f" category:{category}"
            if tags:
                search_text += f" tags:{tags}"
            
            # Also include filename
            filename = file_path.split('/')[-1]
            search_text += f" filename:{filename}"
            
            print(f"\nProcessing: {file_path}")
            print(f"  Search text: {search_text[:100]}...")
            
            # Generate embedding
            try:
                embedding = self.model.encode(search_text)
                embedding_list = embedding.tolist()
                
                # Update database
                cursor.execute("""
                    UPDATE locations
                    SET embedding = %s
                    WHERE id = %s
                """, (embedding_list, loc_id))
                
                self.conn.commit()
                print(f"  ✓ Embedding saved")
                
            except Exception as e:
                print(f"  ✗ Failed to generate embedding: {e}")
                self.conn.rollback()
    
    def test_search(self, query):
        """Test semantic search"""
        print(f"\n🔍 Testing search for: '{query}'")
        
        # Generate query embedding
        query_embedding = self.model.encode(query).tolist()
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT file_path, description, 
                   1 - (embedding <=> %s::vector) as similarity
            FROM locations
            WHERE embedding IS NOT NULL
            ORDER BY similarity DESC
            LIMIT 5
        """, (query_embedding,))
        
        results = cursor.fetchall()
        
        print("\n📊 Top results:")
        for file_path, description, similarity in results:
            print(f"\n  📍 {file_path}")
            print(f"     {description[:80]}...")
            print(f"     Similarity: {similarity:.3f}")
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

def main():
    embedder = LocationEmbedder()
    
    try:
        # Generate embeddings for all locations
        embedder.generate_embeddings()
        
        # Test some searches
        print("\n" + "="*60)
        print("TESTING SEMANTIC SEARCH")
        print("="*60)
        
        test_queries = [
            "email sending functionality",
            "personality management",
            "where are migrations stored",
            "configuration files"
        ]
        
        for query in test_queries:
            embedder.test_search(query)
    
    finally:
        embedder.close()

if __name__ == "__main__":
    main()