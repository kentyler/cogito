/**
 * Help Utilities - Provide CLI help and usage information
 */

export class HelpUtils {
  /**
   * Show CLI help information
   */
  static showHelp() {
    console.log(`
Database Agent CLI - Interactive database operations

Usage:
  node scripts/db-agent-cli.js <command> [options]

Commands:
  schema [table]              Show database schema or specific table
  transcript list            List recent transcripts
  transcript import <file>   Import a transcript file
  transcript analyze <id>    Analyze a transcript block
  transcript search <term>   Search transcripts
  participant <id/email>     Show participant details
  query <sql>               Run a SQL query
  test                      Test database connection

Examples:
  node scripts/db-agent-cli.js schema participants
  node scripts/db-agent-cli.js transcript search "conflict resolution"
  node scripts/db-agent-cli.js participant ken@example.com
  node scripts/db-agent-cli.js query "SELECT COUNT(*) FROM meetings.turns"
  `);
  }
}