/**
 * Seed a realistic lastAgentRun into Firestore for all users who have accounts.
 * This makes the Agent Activity feed visible in the dashboard immediately.
 *
 * Run: node scripts/seed-agent-run.js
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json')
if (!fs.existsSync(serviceAccountPath)) {
  console.error('firebase-service-account.json not found at project root')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)

async function seedAgentRun() {
  const usersSnap = await db.collection('users').get()

  if (usersSnap.empty) {
    console.log('No users found in Firestore.')
    process.exit(0)
  }

  for (const userDoc of usersSnap.docs) {
    const accountsSnap = await db
      .collection('users')
      .doc(userDoc.id)
      .collection('accounts')
      .get()

    if (accountsSnap.empty) {
      console.log(`User ${userDoc.id}: no accounts, skipping`)
      continue
    }

    const accounts = accountsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Build realistic events from actual accounts
    const events = []
    let alertsSent = 0
    let nudgesSent = 0

    for (const account of accounts.slice(0, 10)) {
      const riskLevel = account.result?.riskLevel
      const accountName = account.result?.accountName ?? 'Unknown account'

      if (riskLevel === 'critical' || riskLevel === 'high') {
        const hasUnactioned = Object.values(account.signalActions ?? {}).some(
          a => a.status !== 'done' && a.status !== 'dismissed'
        )
        if (hasUnactioned) {
          events.push({
            type: 'alert',
            accountName,
            detail: `Unactioned ${riskLevel} signal — re-alert sent`,
          })
          alertsSent++
        } else {
          events.push({ type: 'healthy', accountName, detail: 'No action needed' })
        }
      } else {
        events.push({ type: 'healthy', accountName, detail: 'No action needed' })
      }
    }

    // If no alerts, make at least one nudge so the feed looks active
    if (alertsSent === 0 && nudgesSent === 0 && accounts.length > 0) {
      const staleAccount = accounts.find(a => {
        const ageMs = Date.now() - new Date(a.updatedAt ?? a.analyzedAt).getTime()
        return ageMs > 7 * 24 * 60 * 60 * 1000
      })
      if (staleAccount) {
        const name = staleAccount.result?.accountName ?? 'Unknown account'
        const daysSince = Math.floor(
          (Date.now() - new Date(staleAccount.updatedAt ?? staleAccount.analyzedAt).getTime()) /
          (24 * 60 * 60 * 1000)
        )
        events.unshift({
          type: 'nudge',
          accountName: name,
          detail: `${daysSince} days since last analysis — nudge sent`,
        })
        nudgesSent++
      }
    }

    const lastAgentRun = {
      runAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      accountsScanned: accounts.length,
      alertsSent,
      nudgesSent,
      events: events.slice(0, 5),
    }

    await db.collection('users').doc(userDoc.id).set(
      { lastAgentRun },
      { merge: true }
    )

    console.log(`User ${userDoc.id}: seeded agent run — ${accounts.length} accounts, ${alertsSent} alerts, ${nudgesSent} nudges`)
    console.log('  Events:', events.slice(0, 3).map(e => `[${e.type}] ${e.accountName}`).join(', '))
  }

  console.log('\nDone. Refresh the dashboard to see the Agent Activity feed.')
  process.exit(0)
}

seedAgentRun().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
