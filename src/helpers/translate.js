import generateToken from '@/helpers/generate-token'
import getSettings from '@/helpers/get-settings'
import timeout from '@/helpers/promise-timeout'

const url = 'https://translate.google.com/translate_a/single'
const defaultParams = [
  ['client', 't'],
  ['ie', 'UTF-8'],
  ['oe', 'UTF-8'],
  ['sl', 'auto'],
  ['hl', 'en'],
  ['dt', 'bd'],
  ['dt', 't']
]
const retryInterval = 500
const retryDelay = 100

const paramsFor = (lang, text) => [...defaultParams, ['tl', lang], ['tk', generateToken(text)], ['q', text]]

const sendRequest = async (query, { retry }) => {
  const start = new Date()
  const request = fetch(`${url}?${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  try {
    const response = await request
    return response
  } catch (ex) {
    const finish = new Date()
    if (!retry || finish - start > retryInterval) throw ex
    const response = await timeout(() => sendRequest(query, { retry: false }), retryDelay)
    return response
  }
}

const extractMain = ([parts]) => {
  if (!parts) return
  return parts.map(([part]) => part).join('')
}

const extractSecondary = ([_, parts]) => {
  if (!Array.isArray(parts)) return []
  return parts.filter((part) => part[0] && part[1]).map((part) => ({ pos: part[0], words: part[1] }))
}

const extrangLanguage = (data) => (Array.isArray(data[1]) ? data[2] : data[1])

const prepareTranslation = (data) => ({
  main: extractMain(data),
  secondary: extractSecondary(data),
  language: extrangLanguage(data)
})

export default async (text) => {
  const { translationLanguage } = await getSettings()
  const params = paramsFor(translationLanguage, text)
  const query = new URLSearchParams(params).toString()
  const response = await sendRequest(query, { retry: true })
  const body = await response.text()
  const data = JSON.parse(body.replace(/,+/g, ','))
  return prepareTranslation(data)
}
