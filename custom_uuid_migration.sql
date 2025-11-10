-- ============================================
-- CUSTOM UUID MIGRATION SCRIPT
-- ============================================
-- This script migrates the projects table to use the new custom UUID format:
-- Format: AAAA-AA00-AA00-32randomchars
-- Where:
--   AAAA = Company code (AAAA-ZZZZ)
--   AA00 = Project code (AA00-ZZ99, then aa00-zz99)
--   AA00 = Chat ID (AA00-ZZ99)
--   32randomchars = Random alphanumeric string

-- ============================================
-- 1. BACKUP EXISTING DATA
-- ============================================
CREATE TABLE IF NOT EXISTS projects_backup AS SELECT * FROM projects;

-- ============================================
-- 2. CREATE SEQUENCES FOR ID GENERATION
-- ============================================
-- Sequence for company code (AAAA-ZZZZ)
CREATE SEQUENCE IF NOT EXISTS company_code_seq START 1;

-- Sequence for project code (AA00-zz99)
CREATE SEQUENCE IF NOT EXISTS project_code_seq START 1;

-- ============================================
-- 3. CREATE FUNCTION TO GENERATE CUSTOM ID
-- ============================================
CREATE OR REPLACE FUNCTION generate_custom_project_id()
RETURNS TEXT AS $$
DECLARE
    company_code TEXT;
    project_code TEXT;
    chat_code TEXT;
    base36_chars CHAR(36) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    base62_chars CHAR(62) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    temp_val BIGINT;
    random_part TEXT;
    
    -- Function to generate code in AA00 format
    FUNCTION generate_code(
        value BIGINT,
        max_value BIGINT,
        is_chat BOOLEAN DEFAULT FALSE
    ) RETURNS TEXT AS $$
    DECLARE
        result TEXT := '';
        chars TEXT := CASE 
            WHEN is_chat OR value < 36*10*10 THEN '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            ELSE '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
        END;
        val BIGINT := LEAST(value, max_value);
        base INT;
    BEGIN
        -- For chat codes, use AA00-ZZ99 format only
        IF is_chat THEN
            RETURN 
                substr(chars, (val / (36*10*10) % 36) + 1, 1) ||
                substr(chars, (val / (10*10) % 36) + 1, 1) ||
                substr(chars, (val / 10 % 10) + 1, 1) ||
                substr(chars, (val % 10) + 1, 1);
        END IF;
        
        -- For project codes, use AA00-ZZ99 then aa00-zz99
        IF val < 36*10*10 THEN  -- AA00-ZZ99
            RETURN 
                substr(chars, (val / (36*10*10) % 36) + 1, 1) ||
                substr(chars, (val / (10*10) % 36) + 1, 1) ||
                substr(chars, (val / 10 % 10) + 1, 1) ||
                substr(chars, (val % 10) + 1, 1);
        ELSE  -- aa00-zz99
            val := val - 36*10*10;  -- Adjust for second range
            RETURN 
                LOWER(substr(chars, (val / (36*10*10) % 26) + 11, 1)) ||
                LOWER(substr(chars, (val / (10*10) % 26) + 11, 1)) ||
                substr(chars, (val / 10 % 10) + 1, 1) ||
                substr(chars, (val % 10) + 1, 1);
        END IF;
    END;
    $$ LANGUAGE plpgsql;
    
BEGIN
    -- Generate company code (AAAA-ZZZZ)
    temp_val := nextval('company_code_seq') - 1; -- -1 because sequence starts at 1
    company_code := generate_code(temp_val, 456975); -- 26^4 - 1
    
    -- Generate project code (AA00-ZZ99, then aa00-zz99)
    temp_val := nextval('project_code_seq') - 1;
    project_code := generate_code(temp_val, 129599); -- 36*36*10*10 - 1
    
    -- Generate chat code (AA00-ZZ99)
    -- Note: This is a placeholder. In a real implementation, you would pass the chat number
    chat_code := 'AA00';  -- Default for new projects
    
    -- Generate random 32-character string (similar to UUID v4)
    random_part := 
        substr(md5(random()::text || random()::text), 1, 8) ||
        substr(md5(random()::text || random()::text), 1, 4) ||
        substr(md5(random()::text || random()::text), 1, 4) ||
        substr(md5(random()::text || random()::text), 1, 4) ||
        substr(md5(random()::text || random()::text), 1, 12);
    
    -- Format: AAAA-AA00-AA00-32randomchars
    RETURN UPPER(company_code || '-' || project_code || '-' || chat_code || '-' || random_part);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. UPDATE PROJECTS TABLE TO USE NEW ID FORMAT
-- ============================================
-- First, create a temporary column to store the new IDs
ALTER TABLE projects ADD COLUMN new_id TEXT;

-- Generate new IDs for existing projects
DO $$
DECLARE
    project_record RECORD;
    new_id TEXT;
    company_counter INTEGER := 1;
BEGIN
    -- Reset sequences to ensure we start from the beginning
    PERFORM setval('company_code_seq', 1, false);
    PERFORM setval('project_code_seq', 1, false);
    
    -- Update existing projects with new ID format
    FOR project_record IN SELECT id, created_at FROM projects ORDER BY created_at LOOP
        -- Generate new ID
        new_id := generate_custom_project_id();
        
        -- Update the project with new ID
        UPDATE projects 
        SET new_id = new_id
        WHERE id = project_record.id;
        
        -- Log the change
        RAISE NOTICE 'Generated new ID % for project %', new_id, project_record.id;
        
        -- Increment company counter every 100 projects (example logic)
        IF company_counter % 100 = 0 THEN
            PERFORM nextval('company_code_seq');
        END IF;
        company_counter := company_counter + 1;
    END LOOP;
    
    -- Now update all foreign key references
    -- Note: You'll need to add similar blocks for each table that references projects.id
    -- Example:
    -- UPDATE related_table SET project_id = projects.new_id 
    -- FROM projects WHERE related_table.project_id = projects.id;
    
    -- Finally, swap the columns and clean up
    ALTER TABLE projects DROP COLUMN id;
    ALTER TABLE projects RENAME COLUMN new_id TO id;
    ALTER TABLE projects ALTER COLUMN id SET NOT NULL;
    ALTER TABLE projects ADD PRIMARY KEY (id);
    
    -- Recreate any dropped indexes
    -- Example: CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
END $$;

-- ============================================
-- 5. CREATE TRIGGER FOR NEW PROJECTS
-- ============================================
CREATE OR REPLACE FUNCTION set_custom_project_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set ID if it's not already set (allowing for manual override if needed)
    IF NEW.id IS NULL THEN
        NEW.id := generate_custom_project_id();
    END IF;
    
    -- Set timestamps
    NEW.updated_at = NOW();
    IF TG_OP = 'INSERT' THEN
        NEW.created_at = COALESCE(NEW.created_at, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_set_custom_project_id ON projects;
CREATE TRIGGER trg_set_custom_project_id
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION set_custom_project_id();

-- ============================================
-- 6. VERIFY THE CHANGES
-- ============================================
SELECT id, created_at, project_name 
FROM projects 
ORDER BY created_at 
LIMIT 5;

-- ============================================
-- 7. CLEAN UP (optional, uncomment if needed)
-- ============================================
-- DROP SEQUENCE IF EXISTS company_code_seq;
-- DROP SEQUENCE IF EXISTS project_code_seq;
-- DROP FUNCTION IF EXISTS generate_custom_project_id();
-- DROP FUNCTION IF EXISTS set_custom_project_id();
-- DROP TRIGGER IF EXISTS trg_set_custom_project_id ON projects;
