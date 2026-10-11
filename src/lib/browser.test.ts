import { describe, expect, it } from 'vitest'
import { androidIntentUrl, detectInAppBrowser, isIOS, safariUrl } from './browser'

const MESSENGER_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/480.0]'
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Instagram 350.0.0'
const FB_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0;]'
const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
const WHATSAPP_OPENED_CHROME = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36'

describe('in-app browser detection', () => {
  it('spots Messenger, Facebook and Instagram', () => {
    expect(detectInAppBrowser(MESSENGER_IOS)).toBe('facebook')
    expect(detectInAppBrowser(FB_ANDROID)).toBe('facebook')
    expect(detectInAppBrowser(INSTAGRAM)).toBe('instagram')
  })
  it('leaves normal browsers alone', () => {
    expect(detectInAppBrowser(SAFARI)).toBeNull()
    expect(detectInAppBrowser(WHATSAPP_OPENED_CHROME)).toBeNull()
  })
  it('detects iPhone', () => {
    expect(isIOS(SAFARI)).toBe(true)
    expect(isIOS(FB_ANDROID)).toBe(false)
  })
})

describe('exit links', () => {
  it('builds an Android intent link to the default browser', () => {
    expect(androidIntentUrl('https://partypop.app/i/mx7Kq2pLab?x=1')).toBe('intent://partypop.app/i/mx7Kq2pLab?x=1#Intent;scheme=https;end')
  })
  it('builds the Safari scheme link', () => {
    expect(safariUrl('https://partypop.app/i/abc')).toBe('x-safari-https://partypop.app/i/abc')
  })
})
