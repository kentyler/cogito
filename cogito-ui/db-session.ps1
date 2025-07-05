# PowerShell Database Session Manager
# This script runs as a persistent session maintaining connection pool

# Database configuration
$script:dbConfig = @{
    Host = "localhost"
    Database = "cogito"
    Username = "ken"
    Password = "7297"
}

Write-Output "DB_CONFIG_SET"

# Connection pool
$script:connections = @()
$script:maxConnections = 5
$script:activeConnection = $null

# Initialize connection
function Initialize-DbConnection {
    try {
        # Using Npgsql .NET library for proper connection pooling
        Add-Type -Path "Npgsql.dll" -ErrorAction SilentlyContinue
        
        $connectionString = "Host=$($script:dbConfig.Host);Database=$($script:dbConfig.Database);Username=$($script:dbConfig.Username);Password=$($script:dbConfig.Password);Pooling=true;Minimum Pool Size=2;Maximum Pool Size=$($script:maxConnections)"
        
        $script:activeConnection = New-Object Npgsql.NpgsqlConnection($connectionString)
        $script:activeConnection.Open()
        
        Write-Output "CONNECTION_READY"
    }
    catch {
        # Fallback to psql if Npgsql not available
        Write-Output "USING_PSQL_FALLBACK"
    }
}

# Execute query with connection reuse
function Invoke-DbQuery {
    param($query)
    
    if ($script:activeConnection -and $script:activeConnection.State -eq 'Open') {
        # Use pooled connection
        $cmd = $script:activeConnection.CreateCommand()
        $cmd.CommandText = $query
        $reader = $cmd.ExecuteReader()
        
        $results = @()
        while ($reader.Read()) {
            $row = @{}
            for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                $row[$reader.GetName($i)] = $reader.GetValue($i)
            }
            $results += $row
        }
        $reader.Close()
        
        return $results | ConvertTo-Json
    }
    else {
        # Fallback to psql
        $result = psql -h $script:dbConfig.Host -U $script:dbConfig.Username -d $script:dbConfig.Database -t -A -F"|" -c $query 2>$null
        return $result
    }
}

# Check if email exists
function Check-Email {
    param($email)
    
    $query = "SELECT id, display_name, email, password_hash FROM participants WHERE email = '$email' LIMIT 1"
    $result = Invoke-DbQuery -query $query
    
    if ($result) {
        $data = $result | ConvertFrom-Json
        if ($data.Count -gt 0) {
            return @{ 
                found = $true
                id = $data[0].id
                display_name = $data[0].display_name
                hasPassword = ($null -ne $data[0].password_hash)
            } | ConvertTo-Json
        }
    }
    
    return @{ 
        found = $false 
        requestLink = "https://cogito.example.com/request-access"
    } | ConvertTo-Json
}

# Verify password
function Verify-Password {
    param($email, $password)
    
    # In real implementation, compare with hashed password
    # For now, just check if password matches a pattern or stored hash
    $query = "SELECT id, display_name, email FROM participants WHERE email = '$email' AND password_hash = crypt('$password', password_hash) LIMIT 1"
    $result = Invoke-DbQuery -query $query
    
    if ($result) {
        $data = $result | ConvertFrom-Json
        if ($data.Count -gt 0) {
            return @{
                authenticated = $true
                user = $data[0]
            } | ConvertTo-Json
        }
    }
    
    return @{ 
        authenticated = $false
        error = "Invalid password"
    } | ConvertTo-Json
}

# Main command loop
Initialize-DbConnection

$script:pendingEmail = $null

while ($true) {
    $command = Read-Host
    
    switch -Regex ($command) {
        '^CHECK_EMAIL:(.+)' {
            $email = $matches[1]
            Write-Output "DEBUG: Checking email: $email"
            $script:pendingEmail = $email
            Check-Email -email $email
        }
        '^VERIFY_PASSWORD:(.+)' {
            $password = $matches[1]
            if ($script:pendingEmail) {
                Verify-Password -email $script:pendingEmail -password $password
            } else {
                @{ error = "No pending email" } | ConvertTo-Json
            }
        }
        '^QUERY:(.+)' {
            $query = $matches[1]
            Invoke-DbQuery -query $query
        }
        '^EXIT' {
            if ($script:activeConnection) {
                $script:activeConnection.Close()
            }
            exit
        }
        default {
            Write-Output "UNKNOWN_COMMAND"
        }
    }
}