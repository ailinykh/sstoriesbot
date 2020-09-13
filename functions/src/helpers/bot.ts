import { attachDoc } from '../middlewares'
import { config } from 'firebase-functions'
import { IContext } from '../interfaces'
import start from '../handlers/start'
import stories from '../handlers/stories'
import Telegraf from 'telegraf'

const report = async (e: Error) => {
  console.error(e)

  const adminChatId = parseInt(config().bot.admin_chat_id)
  if (typeof adminChatId !== 'number') {
    return
  }

  await bot.telegram.sendMessage(adminChatId, e.stack ?? e.message)
}

const bot = new Telegraf<IContext>(config().bot.token)

bot.catch(report)

// bot.use(Telegraf.log());
bot.use(attachDoc)

bot.command('start', start)
bot.on('text', stories)

export default bot
