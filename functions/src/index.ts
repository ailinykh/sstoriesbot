import { https, Request, Response } from 'firebase-functions'
import bot from './helpers/bot'

export const webhook = https.onRequest(
  ({ body }: Request, res: Response<unknown>) => {
    bot
      .handleUpdate(body, res)
      .then((rv) => {
        if (rv === undefined) {
          console.warn(
            'Unhandled request',
            JSON.stringify(body).replace(/"/g, "'")
          )
          return res.sendStatus(200)
        }
        return null
      })
      .catch((e) => console.error('webhook', e))
  }
)
