-- Update the source_type check constraint to allow 'text-input'

-- Drop the existing constraint
ALTER TABLE context.files 
DROP CONSTRAINT files_source_type_check;

-- Add the updated constraint with 'text-input' included
ALTER TABLE context.files 
ADD CONSTRAINT files_source_type_check 
CHECK (source_type IN ('upload', 'snippet', 'text-input'));