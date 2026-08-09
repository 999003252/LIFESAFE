import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const chromeCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean)
const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate))

if (!executablePath) {
  throw new Error('Set PUPPETEER_EXECUTABLE_PATH to a Chrome or Chromium executable.')
}

const currentUser = 'leo@example.com'
const timestamp = '2026-08-09T18:00:00.000Z'
const therapist = {
  userId: 'lifesafe-ai-support',
  displayName: 'Therapist',
  isAi: true,
  lastMessagePreview: 'A private space to reflect',
  unreadCount: 0,
}
const friend = {
  userId: 'maya@example.com',
  displayName: 'Maya Chen',
  lastMessagePreview: 'See you soon',
  unreadCount: 0,
  checkInUnread: true,
  latestCheckIn: {
    entryId: 'maya-entry-1',
    mood: 'sad',
    moodLabel: 'Sad',
    moodIcon: 'sentiment_dissatisfied',
    message: 'Today has been a little heavy.',
    wantsCheckIn: true,
    createdAt: timestamp,
  },
}

let savedEntry
const jsonResponse = (request, body, status = 200) => request.respond({
  status,
  contentType: 'application/json',
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
})

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

try {
  const page = await browser.newPage()
  page.on('pageerror', (error) => console.error('Browser page error:', error.message))
  page.on('requestfailed', (request) => console.error('Request failed:', request.url()))
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.port !== '8000') {
      request.continue()
      return
    }
    if (request.method() === 'OPTIONS') {
      request.respond({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        },
      })
      return
    }

    if (url.pathname === '/accounts') {
      jsonResponse(request, {
        email: currentUser,
        firstName: 'Leo',
        lastName: 'Tester',
      })
      return
    }
    if (url.pathname === '/users/ensure') {
      jsonResponse(request, { userId: currentUser, displayName: 'Leo Tester' })
      return
    }
    if (url.pathname === '/entries/today') {
      jsonResponse(request, { completed: true })
      return
    }
    if (url.pathname === '/entries' && request.method() === 'GET') {
      jsonResponse(request, [])
      return
    }
    if (url.pathname === '/entries' && request.method() === 'POST') {
      savedEntry = JSON.parse(request.postData())
      jsonResponse(request, { ...savedEntry, entryId: 'entry-1', timestamp })
      return
    }
    if (url.pathname === '/friends' && request.method() === 'GET') {
      jsonResponse(request, [therapist, friend])
      return
    }
    if (url.pathname === '/friends/read') {
      jsonResponse(request, { status: 'read' })
      return
    }
    if (url.pathname === '/messages') {
      jsonResponse(request, [])
      return
    }
    if (url.pathname === '/realtime/config') {
      jsonResponse(request, { websocketUrl: '' })
      return
    }

    jsonResponse(request, { detail: `Unhandled test request: ${url.pathname}` }, 404)
  })

  await page.setCookie({
    name: 'lifesafe_auth',
    value: currentUser,
    url: APP_URL,
  })

  const clickButton = async (label) => {
    const clicked = await page.evaluate((text) => {
      const button = [...document.querySelectorAll('button')]
        .find((candidate) => candidate.textContent.replace(/\s+/g, ' ').includes(text))
      if (!button) return false
      button.click()
      return true
    }, label)
    if (!clicked) throw new Error(`Could not find button: ${label}`)
  }

  const waitForFonts = async () => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(
      () => document.fonts.check('24px "Material Symbols Rounded"'),
      { timeout: 15000 },
    )
  }

  await page.goto(`${APP_URL}/entry`, { waitUntil: 'domcontentloaded' })
  await waitForFonts()
  console.log('Loaded journal check-in flow')
  await page.waitForSelector('.mood-picker')
  await clickButton('Sad')

  const privateAnswers = [
    'I had a difficult afternoon.',
    'Taking a walk helped a little.',
    'I can call someone I trust.',
  ]
  for (const answer of privateAnswers) {
    await page.waitForSelector('.slide-textarea')
    await page.type('.slide-textarea', answer)
    await clickButton('Next')
  }

  await page.waitForSelector('.share-check-in-card')
  await page.click('.share-toggle-row input')
  await page.waitForSelector('#share-message')
  await page.type('#share-message', 'Today has been a little heavy.')
  await page.click('.support-request-row input')
  await page.screenshot({ path: '/tmp/social-checkin-journal.png', fullPage: true })
  console.log('Captured journal sharing state')
  await clickButton('Save Entry')
  await new Promise((resolve) => setTimeout(resolve, 250))
  console.log('Submitted journal payload:', Boolean(savedEntry))
  await page.waitForFunction(() => (
    document.querySelector('.save-confirmation')?.textContent.includes('shared with your friends')
  ), { timeout: 5000 })
  console.log('Verified shared journal submission')

  if (!savedEntry?.shareWithFriends || !savedEntry?.wantsCheckIn) {
    throw new Error('The journal did not submit the selected sharing options.')
  }
  if (savedEntry.shareMessage !== 'Today has been a little heavy.') {
    throw new Error('The shared note was not submitted correctly.')
  }

  await page.goto(`${APP_URL}/friends`, { waitUntil: 'domcontentloaded' })
  await waitForFonts()
  console.log('Loaded friends check-in flow')
  await page.waitForSelector('.check-in-button')
  await clickButton('Check in')
  await page.waitForFunction(() => (
    document.querySelector('.chat-header')?.textContent.includes('Maya Chen')
  ))
  await page.waitForSelector('.check-in-context')
  await clickButton('Want to talk?')
  const draft = await page.$eval('.message-input input', (input) => input.value)
  if (draft !== 'Want to talk?') {
    throw new Error('Suggested reply did not populate the message composer.')
  }
  await page.screenshot({ path: '/tmp/social-checkin-friends.png', fullPage: true })
  console.log('Captured friend chat handoff')

  console.log(JSON.stringify({
    journal: {
      shared: savedEntry.shareWithFriends,
      wantsCheckIn: savedEntry.wantsCheckIn,
      note: savedEntry.shareMessage,
      privateAnswersSubmittedOnlyToJournal: savedEntry.answers.length === 3,
    },
    friends: {
      indicator: true,
      chatOpened: true,
      suggestedReplyDraft: draft,
    },
    screenshots: [
      '/tmp/social-checkin-journal.png',
      '/tmp/social-checkin-friends.png',
    ],
  }, null, 2))
} finally {
  await browser.close()
}
