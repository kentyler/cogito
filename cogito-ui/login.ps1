# PowerShell script for direct database authentication
param($email)

# Database connection parameters
$dbHost = "localhost"
$dbName = "cogito"
$dbUser = "your_user"  # Configure these
$dbPass = "your_pass"  # Configure these

# PostgreSQL connection string
$connString = "Host=$dbHost;Database=$dbName;Username=$dbUser;Password=$dbPass"

# Load PostgreSQL module if available, or use psql directly
try {
    # Direct psql command
    $query = "SELECT id, display_name, email FROM participants WHERE email = '$email' LIMIT 1"
    $result = psql -h $dbHost -U $dbUser -d $dbName -t -c $query 2>$null
    
    if ($result) {
        $parts = $result.Trim() -split '\|'
        @{
            id = $parts[0].Trim()
            display_name = $parts[1].Trim()
            email = $parts[2].Trim()
        } | ConvertTo-Json
    } else {
        @{ error = "Email not found" } | ConvertTo-Json
    }
} catch {
    @{ error = $_.Exception.Message } | ConvertTo-Json
}