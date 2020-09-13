import * as admin from 'firebase-admin'

let options = {}

if (typeof process.env.FUNCTIONS_EMULATOR === 'string') {
  options = {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    credential: admin.credential.cert(require('../../ServiceAccountKey.json')),
  }
}

admin.initializeApp(options)

const db = admin.firestore()
db.settings({ timestampsInSnapshots: true })

export default db
