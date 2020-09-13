import { ChatSnapshot, IContext } from './interfaces'
import db from './database'

export async function attachDoc(ctx: IContext, next: Function) {
  if (ctx.message === undefined) {
    // ignore any updates except messages
    return
  }

  const { chat } = ctx.message
  const doc = await db.doc(`chat/${chat.id}`).get()

  if (!doc.exists) {
    console.info(`Creating new chat ${chat.id}`)
    await doc.ref.set({ ...chat, profiles: {} })
  }

  ctx.doc = doc as ChatSnapshot
  return next(ctx)
}
