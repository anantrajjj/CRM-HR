#!/usr/bin/env node

/**
 * Database Setup Script
 * Run this to see instructions for setting up your Supabase database
 * 
 * Usage: node scripts/setup-db.js
 */

const fs = require('fs')
const path = require('path')

console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║          CRM+HR Database Setup Guide                    ║')
console.log('╚══════════════════════════════════════════════════════════╝')
console.log('')

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath)
  process.exit(1)
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

console.log('📋 SETUP INSTRUCTIONS:')
console.log('═══════════════════════════════════════════════════════════')
console.log('')
console.log('1. Go to your Supabase Dashboard:')
console.log('   https://supabase.com/dashboard')
console.log('')
console.log('2. Select your project (wktqjajlvmpjzbuvvlwj)')
console.log('')
console.log('3. Navigate to SQL Editor (left sidebar)')
console.log('')
console.log('4. Create a new query and paste the migration SQL below')
console.log('')
console.log('5. Click "Run" to execute the migration')
console.log('')
console.log('═══════════════════════════════════════════════════════════')
console.log('')
console.log('📄 MIGRATION SQL (copy this):')
console.log('───────────────────────────────────────────────────────────')
console.log('')
console.log(migrationSQL)
console.log('')
console.log('───────────────────────────────────────────────────────────')
console.log('')
console.log('✅ After running the migration, come back and run:')
console.log('   npm run dev')
console.log('')
console.log('🌐 Your app will be available at: http://localhost:3000')
console.log('')
