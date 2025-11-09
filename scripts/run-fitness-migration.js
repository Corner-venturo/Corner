#!/usr/bin/env node

const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzg1NDUyMiwiZXhwIjoyMDQzNDMwNTIyfQ.rSbmkR3oHHZGP0k3_dVqI1wqx9VlBD7TvjMTjqvvMSE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('Reading SQL file...')
    const sql = fs.readFileSync('./supabase/migrations/20251109000000_create_fitness_tables.sql', 'utf8')

    console.log('Executing migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

runMigration()
