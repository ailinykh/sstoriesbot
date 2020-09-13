/* eslint-disable @typescript-eslint/naming-convention */
import db from '../database'
import { IContext } from '../interfaces'
import { IncomingMessage } from 'telegraf/typings/telegram-types'
import { Instagram } from '../helpers/instagram'

const PREFIX = '/s_'

export default async (ctx: IContext) => {
  const username = getUsername(ctx.message)
  if (username == null) {
    console.log('username not found')
    return
  }

  const data = ctx.doc.data()
  if (data == null) {
    throw new Error('document data is null!')
  }

  const { profiles } = data
  if (!(username in profiles)) {
    profiles[username] = { ts: 1584403200 }
  }

  const settings = await db.doc('settings/instagram').get()
  if (!settings.exists) {
    throw new Error('Settings not found')
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { cookies } = settings.data()!
  const client = new Instagram(cookies)
  const { ts } = profiles[username]
  const stories = await client.getStoryItemsByUsername(username)
  const actual = stories.filter((s) => s.taken_at_timestamp > ts)
  console.info(`Got ${actual.length} stories (${stories.length} total)`)

  if (actual.length === 0) {
    console.warn(`No stories found for ${username}`)
    return ctx.replyWithMarkdown(
      `Sorry, but i can't find any actual stories for [${username}](https://instagr.am/${username}). May be try later?`
    )
  }

  const current = actual.slice(0, 10)
  const media = current.map((s) => {
    const caption = [
      new Date(s.taken_at_timestamp * 1000).toUTCString(),
      s.story_cta_url,
      ...s.tappable_objects
        .filter(({ __typename }) => __typename === 'GraphTappableMention')
        .map(
          ({ full_name, username }) => `${full_name} instagr.am/${username}`
        ),
    ]
      .filter(Boolean)
      .join('\n')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const media = s.is_video ? s.video_resources.pop()!.src : s.display_url
    const type = s.is_video ? 'video' : 'photo'
    return { caption, media, type }
  })

  await ctx.replyWithMediaGroup(media)

  if (actual.length > current.length) {
    await ctx.reply(
      `There is ${
        actual.length - current.length
      } stories pending. Use the /s_${username} command to get update.`
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  profiles[username].ts = current.pop()!.taken_at_timestamp
  console.log(`updating profiles... ${JSON.stringify(profiles[username])}`)
  return ctx.doc.ref.update({ profiles })
}

const getUsername = (message: IncomingMessage): string | undefined => {
  if (message.entities == null) {
    console.log('No entities found')
    return undefined
  }

  for (let i = 0; i < message.entities.length; i++) {
    const e = message.entities[i]

    if (e.type === 'mention') {
      return message.text?.substr(e.offset + 1, e.length)
    }

    if (e.type === 'bot_command') {
      const command = message.text?.substr(e.offset, e.length) ?? ''
      if (command.startsWith(PREFIX)) {
        return command.substr(PREFIX.length)
      }
    }
  }
  return undefined
}
