#!/usr/bin/env node

/**
 * DANGER: This script will DELETE ALL USER DATA from the database
 * Use only for development/testing purposes
 * 
 * Usage: node scripts/wipe-user-data.js
 * 
 * This script requires your SUPABASE_SERVICE_ROLE_KEY to be set in your environment
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment')
  process.exit(1)
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function confirm() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('⚠️  This will DELETE ALL USER DATA from your database. Are you sure? (type "DELETE ALL" to confirm): ', (answer) => {
      rl.close()
      resolve(answer === 'DELETE ALL')
    })
  })
}

async function wipeUserData() {
  console.log('🗑️  Starting database wipe...\n')

  try {
    // 1. Delete billing history
    console.log('Deleting billing_history...')
    const { error: billingError } = await supabase
      .from('billing_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (billingError) console.log('⚠️  billing_history:', billingError.message)
    else console.log('✅ billing_history deleted')

    // 2. Delete orders
    console.log('Deleting orders...')
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (ordersError) console.log('⚠️  orders:', ordersError.message)
    else console.log('✅ orders deleted')

    // 3. Delete songs
    console.log('Deleting songs...')
    const { error: songsError } = await supabase
      .from('songs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (songsError) console.log('⚠️  songs:', songsError.message)
    else console.log('✅ songs deleted')

    // 4. Delete audit logs
    console.log('Deleting audit_log...')
    const { error: auditError } = await supabase
      .from('audit_log')
      .delete()
      .in('table_name', ['profiles', 'songs', 'orders'])
    
    if (auditError) console.log('⚠️  audit_log:', auditError.message)
    else console.log('✅ audit_log deleted')

    // 5. Delete profiles
    console.log('Deleting profiles...')
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (profilesError) console.log('⚠️  profiles:', profilesError.message)
    else console.log('✅ profiles deleted')

    // 6. Delete auth users (this requires admin privileges)
    console.log('Deleting auth users...')
    
    // First, get all users
    const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers()
    
    if (getUsersError) {
      console.log('⚠️  Failed to list users:', getUsersError.message)
    } else if (users?.users?.length > 0) {
      // Delete each user individually
      for (const user of users.users) {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteUserError) {
          console.log(`⚠️  Failed to delete user ${user.email}:`, deleteUserError.message)
        }
      }
      console.log(`✅ Deleted ${users.users.length} auth users`)
    } else {
      console.log('✅ No auth users to delete')
    }

    console.log('\n🎉 Database wipe complete!')
    
    // Verify the wipe
    await verifyWipe()

  } catch (error) {
    console.error('❌ Error during database wipe:', error)
  }
}

async function verifyWipe() {
  console.log('\n🔍 Verifying wipe...')
  
  const tables = ['profiles', 'songs', 'orders', 'billing_history']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`⚠️  ${table}: Error checking count - ${error.message}`)
    } else {
      console.log(`📊 ${table}: ${count} records remaining`)
    }
  }

  // Check auth users
  const { data: users, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.log('⚠️  auth.users: Error checking count -', authError.message)
  } else {
    console.log(`📊 auth.users: ${users?.users?.length || 0} users remaining`)
  }
}

async function main() {
  console.log('🚨 DATABASE WIPE UTILITY 🚨')
  console.log('This will permanently delete ALL user data from your database.')
  console.log('Tables affected: auth.users, profiles, songs, orders, billing_history, audit_log\n')

  const confirmed = await confirm()
  
  if (!confirmed) {
    console.log('❌ Operation cancelled. No data was deleted.')
    return
  }

  await wipeUserData()
}

main().catch(console.error)