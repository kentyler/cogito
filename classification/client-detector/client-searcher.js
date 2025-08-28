/**
 * Client Searcher - Database search with exact, fuzzy, and keyword matching
 */

export class ClientSearcher {
  constructor(databaseManager) {
    this.db = databaseManager;
  }

  /**
   * Search for clients in database using exact and fuzzy matching
   * @param {Array} candidates - Array of client name candidates
   * @returns {Object} - Search results organized by match type
   */
  async searchClients(candidates) {
    const results = {
      exact_matches: [],
      fuzzy_matches: [],
      keyword_matches: []
    };

    for (const candidate of candidates) {
      try {
        // Exact name matches
        await this.searchExactMatches(candidate, results.exact_matches);
        
        // Alias matches
        await this.searchAliasMatches(candidate, results.exact_matches);
        
        // Fuzzy name matches using PostgreSQL similarity
        await this.searchFuzzyMatches(candidate, results.fuzzy_matches);
        
        // Keyword matches in name
        await this.searchKeywordMatches(candidate, results.keyword_matches);

      } catch (error) {
        console.error(`Error searching for candidate "${candidate}":`, error);
      }
    }

    // Remove duplicates and sort by confidence
    results.exact_matches = this.deduplicateResults(results.exact_matches);
    results.fuzzy_matches = this.deduplicateResults(results.fuzzy_matches);
    results.keyword_matches = this.deduplicateResults(results.keyword_matches);

    return results;
  }

  /**
   * Search for exact name matches
   */
  async searchExactMatches(candidate, exactMatches) {
    const exactQuery = `
      SELECT id, name, metadata, 
             'exact' as match_type, 1.0 as confidence
      FROM clients 
      WHERE LOWER(name) = $1
    `;
    const exactResults = await this.db.query(exactQuery, [candidate.toLowerCase()]);
    exactMatches.push(...exactResults.rows);
  }

  /**
   * Search for alias matches
   */
  async searchAliasMatches(candidate, exactMatches) {
    const aliasQuery = `
      SELECT id, name, metadata,
             'alias' as match_type, 0.95 as confidence
      FROM clients 
      WHERE metadata->'aliases' ? $1
    `;
    const aliasResults = await this.db.query(aliasQuery, [candidate]);
    exactMatches.push(...aliasResults.rows);
  }

  /**
   * Search for fuzzy matches using PostgreSQL similarity
   */
  async searchFuzzyMatches(candidate, fuzzyMatches) {
    const fuzzyQuery = `
      SELECT id, name, metadata,
             'fuzzy' as match_type, similarity(LOWER(name), $1) as confidence
      FROM clients 
      WHERE similarity(LOWER(name), $1) > 0.6
      ORDER BY confidence DESC
    `;
    const fuzzyResults = await this.db.query(fuzzyQuery, [candidate.toLowerCase()]);
    fuzzyMatches.push(...fuzzyResults.rows);
  }

  /**
   * Search for keyword matches in client names
   */
  async searchKeywordMatches(candidate, keywordMatches) {
    const keywordQuery = `
      SELECT id, name, metadata,
             'keyword' as match_type, 0.7 as confidence
      FROM clients 
      WHERE LOWER(name) LIKE $1
    `;
    const keywordResults = await this.db.query(keywordQuery, [`%${candidate}%`]);
    keywordMatches.push(...keywordResults.rows);
  }

  /**
   * Remove duplicate results and sort by confidence
   */
  deduplicateResults(results) {
    const seen = new Set();
    const unique = results.filter(result => {
      if (seen.has(result.id)) return false;
      seen.add(result.id);
      return true;
    });
    
    return unique.sort((a, b) => b.confidence - a.confidence);
  }
}