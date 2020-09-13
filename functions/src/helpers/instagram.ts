/* eslint-disable @typescript-eslint/naming-convention */
import fetch from 'node-fetch'

interface Profile {
  id: string
}

interface Reel {
  items: [Story]
}

interface Story {
  taken_at_timestamp: number
  story_cta_url: string
  tappable_objects: [
    { __typename: string; full_name: string; username: string }
  ]
  is_video: boolean
  video_resources: [{ src: string }]
  display_url: string
}

interface ReelRequest {
  reelIds?: [string?]
  tagNames?: [string?]
  locationIds?: [string?]
  precomposedOverlay?: boolean
}

export class Instagram {
  cookies: { [key: string]: string | undefined }
  headers: { [key: string]: string }

  constructor(cookies = {}) {
    this.cookies = {
      sessionid: undefined,
      ds_user_id: undefined,
      csrftoken: undefined,
      shbid: undefined,
      rur: undefined,
      mid: undefined,
      shbts: undefined,
      ...cookies,
    }

    this.headers = {
      'accept-langauge': 'en-US;q=0.9,en;q=0.8,es;q=0.7',
      origin: 'https://www.instagram.com',
      referer: 'https://www.instagram.com/',
      'upgrade-insecure-requests': `${1}`,
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
    }
  }

  async login(username: string, password: string) {
    const formdata =
      'username=' + username + '&password=' + password + '&queryParams=%7B%7D'

    const options = {
      method: 'POST',
      body: formdata,
      headers: {
        ...this.headers,
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'content-length': `${formdata.length}`,
        'content-type': 'application/x-www-form-urlencoded',
        cookie: 'ig_cb=1',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        'x-csrftoken': this.cookies.csrftoken!,
        'x-instagram-ajax': `${1}`,
        'x-requested-with': 'XMLHttpRequest',
      },
    }

    const resp = await fetch(
      'https://www.instagram.com/accounts/login/ajax/',
      options
    )

    const cookie = resp.headers.get('set-cookie')
    if (cookie == null) {
      throw new Error('set-cookie header missed')
    }

    const keys = Object.keys(this.cookies)
    cookie.split(';').forEach((cookie: string) => {
      keys.forEach((key) => {
        if (cookie.includes(key + '=')) {
          this.cookies[key] = cookie.split('=').pop()
        }
      })
    })
    return this.cookies.sessionid
  }

  async getProfile(username: string): Promise<Profile> {
    const data = {
      method: 'get',
      headers: {
        ...this.headers,
        referer: `https://www.instagram.com/${username}/`,
        cookie: Object.keys(this.cookies).reduce(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (prev, key) => `${prev}${key}=${this.cookies[key]!};`,
          ''
        ),
      },
    }

    const res = await fetch(
      `https://www.instagram.com/${username}/?__a=1`,
      data
    )
    const json = await res.json()

    return json.graphql.user
  }

  async getStoryReels({
    reelIds = [],
    tagNames = [],
    locationIds = [],
    precomposedOverlay = false,
  }: ReelRequest): Promise<[Reel]> {
    const data = {
      method: 'get',
      headers: {
        ...this.headers,
        cookie: Object.keys(this.cookies).reduce(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (prev, key) => `${prev}${key}=${this.cookies[key]!};`,
          ''
        ),
      },
    }

    const params: { [key: string]: string } = {
      query_hash: 'ba71ba2fcb5655e7e2f37b05aec0ff98',
      variables: JSON.stringify({
        reel_ids: reelIds,
        tag_names: tagNames,
        location_ids: locationIds,
        precomposed_overlay: precomposedOverlay,
      }),
    }

    const url = new URL('https://www.instagram.com/graphql/query/')
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    )

    const res = await fetch(url, data)
    const json = await res.json()

    return json.data.reels_media
  }

  async getStoryItemsByUsername(username: string): Promise<[Story] | []> {
    const user = await this.getProfile(username)
    const reels = await this.getStoryReels({ reelIds: [user.id] })
    return reels.length > 0 ? reels[0].items : []
  }

  async getBroadcastsByUsername(username: string) {
    const user = await this.getProfile(username)
    const data = {
      method: 'get',
      headers: {
        ...this.headers,
        'user-agent':
          'Instagram 10.26.0 (iPhone7,2; iOS 10_1_1; en_US; en-US; scale=2.00; gamut=normal; 750x1334) AppleWebKit/420+',
        cookie: Object.keys(this.cookies).reduce(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (prev, key) => `${prev}${key}=${this.cookies[key]!};`,
          ''
        ),
      },
    }

    const res = await fetch(
      `https://i.instagram.com/api/v1/feed/user/${user.id}/story/`,
      data
    )

    const { post_live_item } = await res.json()

    if (post_live_item !== null) {
      return post_live_item.broadcasts
    }

    return []
  }
}
