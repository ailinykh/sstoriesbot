import * as firebase from 'firebase-admin'
import { Context } from 'telegraf'
import { IncomingMessage } from 'telegraf/typings/telegram-types'

export interface ChatData extends firebase.firestore.DocumentData {
  id: number
  profiles: { [key: string]: { ts: number } }
}

export declare type ChatSnapshot = firebase.firestore.DocumentSnapshot<ChatData>

export interface IContext extends Context {
  message: IncomingMessage
  doc: ChatSnapshot
}
