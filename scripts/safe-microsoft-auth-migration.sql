-- Safe migration for Microsoft authentication support
-- This preserves existing data while adding new features

-- Step 1: Create the UserRole enum
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BRAND_ADMIN', 'BRAND_USER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add microsoftSub column (safe - just adds new column)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "microsoftSub" TEXT;

-- Step 3: Add new role column with enum type
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role_new" "UserRole" DEFAULT 'VIEWER';

-- Step 4: Copy existing role data and convert 'user' to 'VIEWER'
UPDATE "User" SET "role_new" = 
    CASE 
        WHEN role = 'user' THEN 'VIEWER'::"UserRole"
        WHEN role = 'admin' THEN 'SUPER_ADMIN'::"UserRole"
        ELSE 'VIEWER'::"UserRole"
    END;

-- Step 5: Drop old role column and rename new one
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Step 6: Set proper default for role column
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';

-- Verify the changes
SELECT 'Migration completed successfully. User table now has:' as status;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name IN ('role', 'microsoftSub')
ORDER BY column_name;
