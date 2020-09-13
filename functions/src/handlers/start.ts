import { IContext } from '../interfaces'

export default async ({ replyWithMarkdown }: IContext) => {
  return await replyWithMarkdown(
    [
      "Hey there! I'm an *instagram stories* bot!",
      '',
      'Just send me an instagram profile you want to get stories from.',
      'Like `@kimkardashian`',
      '',
      'Also there is special command for this:',
      '/s\\_kimkardashian',
    ].join('\n')
  )
}
