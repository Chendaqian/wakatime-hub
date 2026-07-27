require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { Octokit } = require('@octokit/rest')
const Axios = require('axios')
const { WakaTimeClient, RANGE } = require('wakatime-client')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const { WAKATIME_API_KEY, GH_TOKEN, SCU_KEY } = process.env

/**
 * 根据日期查找对应年份的 Gist ID
 * 配置格式: { "2026": "gist_id", ... }（每年一个 Gist）
 */
function getGistIdForDate(dateStr) {
  const year = dateStr.substring(0, 4)
  try {
    const config = JSON.parse(process.env.GIST_IDS || '{}')
    const gid = config[year]
    if (gid && typeof gid === 'string') return gid
    if (Array.isArray(gid)) return gid[0] // 兼容旧格式
  } catch { /* fall through */ }
  return null
}

const BASE_URL = 'https://wakatime.com/api/v1'
const summariesApi = `${BASE_URL}/users/current/summaries`
const scuPushApi = `https://sctapi.ftqq.com`

const wakatime = new WakaTimeClient(WAKATIME_API_KEY)
const octokit = new Octokit({
  auth: `token ${GH_TOKEN}`,
  userAgent: 'wakatime-hub/1.0',
  request: { timeout: 30000 }
})

function getItemContent(title, content) {
  let itemContent = `#### ${title} \n`
  content.forEach(item => {
    itemContent += `* ${item.name}: ${item.text} \n`
  })
  return itemContent
}

function getMessageContent(date, summary) {
  if (summary.length > 0) {
    const { projects, grand_total, languages, categories, editors } = summary[0]
    return `## Wakatime Daily Report\nTotal: ${grand_total.text}\n${getItemContent(
      'Projects', projects
    )}\n${getItemContent('Languages', languages)}\n${getItemContent(
      'Editors', editors
    )}\n${getItemContent('Categories', categories)}\n`
  }
}

function getMySummary(date) {
  return Axios.get(summariesApi, {
    params: { start: date, end: date, api_key: WAKATIME_API_KEY }
  }).then(response => response.data)
}

/**
 * 写入/更新一天的 summary 到当月 JSON 文件
 * 流程：读取 summaries_YYYY-MM.json → 按 date 去重 → 写入
 */
async function updateGist(date, content) {
  const month = date.substring(0, 7)  // "2026-07"
  const year = date.substring(0, 4)
  const gistId = getGistIdForDate(date)
  const fileName = `summaries_${month}.json`

  console.log(`[${date}] writing to ${gistId}/${fileName}...`)

  // 1. 读取当前月 JSON
  let monthData = []
  try {
    const gist = await octokit.gists.get({ gist_id: gistId })
    const file = gist.data.files[fileName]
    if (file && file.content) {
      monthData = JSON.parse(file.content)
    }
  } catch (err) {
    console.log(`[${date}] read existing failed: ${err.message}, starting fresh`)
  }

  // 2. 追加当天数据（去重：覆盖同一天）
  const map = new Map()
  for (const entry of monthData) {
    if (entry.date) map.set(entry.date, entry)
  }
  const newEntry = { date, ...content[0] }
  map.set(date, newEntry)

  // 3. 排序写回
  const merged = [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
  await octokit.gists.update({
    gist_id: gistId,
    description: `wakatime ${year}`,
    files: { [fileName]: { content: JSON.stringify(merged) } }
  })
  console.log(`[${date}] done (${merged.length} days in month)`)
}

/**
 * 推送消息到 Server酱
 */
async function sendMessageToWechat(text, desp) {
  if (typeof SCU_KEY !== 'undefined') {
    return Axios.get(`${scuPushApi}/${SCU_KEY}.send`, {
      params: { text, desp }
    }).then(response => response.data)
  }
}

async function main() {
  const { SYNC_DATE, SYNC_START, SYNC_END } = process.env

  // 单天补数据
  if (SYNC_DATE) {
    await doSync(SYNC_DATE)
    return
  }

  // 区间补数据（逐天串行）
  if (SYNC_START && SYNC_END) {
    console.log(`Backfilling ${SYNC_START} ~ ${SYNC_END}`)
    const gistId = getGistIdForDate(SYNC_START)

    // 读取该年 Gist 中已有的月份文件，收集已有日期
    const existingDates = new Set()
    try {
      const gist = await octokit.gists.get({ gist_id: gistId })
      for (const [name, file] of Object.entries(gist.data.files)) {
        const match = name.match(/^summaries_(\d{4}-\d{2})\.json$/)
        if (!match || !file.content) continue
        try {
          const entries = JSON.parse(file.content)
          for (const e of entries) {
            if (e.date) existingDates.add(e.date)
          }
        } catch { /* skip bad file */ }
      }
    } catch (err) {
      console.error(`Failed to fetch Gist: ${err.message}`)
      return
    }

    const dates = []
    let cur = dayjs(SYNC_START)
    const end = dayjs(SYNC_END)
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      const d = cur.format('YYYY-MM-DD')
      if (!existingDates.has(d)) dates.push(d)
      cur = cur.add(1, 'day')
    }
    console.log(`${dates.length} day(s) to sync`)
    for (const date of dates) {
      try { await doSync(date) } catch { /* skip failed */ }
      await new Promise(r => setTimeout(r, 7000))
    }
    console.log('All done.')
    return
  }

  // 默认今天
  const today = dayjs().utcOffset(8).format('YYYY-MM-DD')
  try {
    await doSync(today)
  } catch { /* ignore */ }
}

/**
 * 同步一天数据（拉 WakaTime + 写 Gist + 发微信）
 */
async function doSync(date) {
  console.log(`[${date}] fetching...`)
  try {
    const mySummary = await getMySummary(date)
    await updateGist(date, mySummary.data)
    console.log(`[${date}] done`)
    await sendMessageToWechat(
      `${date} update successfully!`,
      getMessageContent(date, mySummary.data)
    )
  } catch (error) {
    console.error(`[${date}] failed: ${error.message}`)
    throw error
  }
}

main()
