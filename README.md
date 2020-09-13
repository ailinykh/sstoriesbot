# sstoriesbot
setup:
- create new [firebase](https://console.firebase.google.com/) project
- enable firestore
-  generate new Service Account Key at Firebase -> Project Settings -> Service Accounts
- set bot token 
`firebase functions:config:set bot.token=BOT_TOKEN`
- start project `npm run serve`

Save config locally:

`firebase functions:config:get > .runtimeconfig.json`