require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { Octokit } = require('@octokit/rest')
const Axios = require('axios')
const { WakaTimeClient, RANGE } = require('wakatime-client')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const { WAKATIME_API_KEY, GH_TOKEN, SCU_KEY } = process.env
// 按年份取对应的 Gist ID（Secrets 里配 GIST_ID_2026、GIST_ID_2027 ...）
// 如果没配，取 GIST_IDS（空格/逗号/分号分隔），取第一个为当前写入目标
const currentYear = new Date().getFullYear()
const GIST_ID =
  process.env[`GIST_ID_${currentYear}`] ||
  (process.env.GIST_IDS
    ? process.env.GIST_IDS.split(/[\s,;]+/).filter(Boolean)[0]
    : null) ||
  process.env.GIST_ID // 旧版兼容
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
      'Projects',
      projects
    )}\n${getItemContent('Languages', languages)}\n${getItemContent(
      'Editors',
      editors
    )}\n${getItemContent('Categories', categories)}\n`
  }
}

function getMySummary(date) {
  return Axios.get(summariesApi, {
    params: {
      start: date,
      end: date,
      api_key: WAKATIME_API_KEY
    }
  }).then(response => response.data)
}

/**
 * update wakatime content to gist
 * @param {*} date - update date
 * @param {*} content update content
 */
async function updateGist(date, content) {
  console.log(`[${date}] writing to Gist...`)
  await octokit.gists.update({
    gist_id: GIST_ID,
    files: {
      [`summaries_${date}.json`]: {
        content: JSON.stringify(content)
      }
    }
  })
  console.log(`[${date}] done`)
}

/**
 * 同步单天数据
 */
async function syncDay(date) {
  console.log(`[${date}] fetching...`)
  const mySummary = await getMySummary(date)
  await updateGist(date, mySummary.data)
  console.log(`[${date}] done`)
  return mySummary
}

/**
 * 推送消息到 Server酱
 * @param {*} text 标题，最初256，必需
 * @param {*} desp 消息内容，最长64kb，可空
 */
async function sendMessageToWechat(text, desp) {
  if (typeof SCU_KEY !== 'undefined') {
    return Axios.get(`${scuPushApi}/${SCU_KEY}.send`, {
      params: {
        text,
        desp
      }
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
    const dates = []
    let cur = dayjs(SYNC_START)
    const end = dayjs(SYNC_END)
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      dates.push(cur.format('YYYY-MM-DD'))
      cur = cur.add(1, 'day')
    }
    console.log(`Backfilling ${dates.length} days: ${dates[0]} ~ ${dates[dates.length - 1]}`)
    for (const date of dates) {
      try {
        await doSync(date)
      } catch {
        // 失败不中断，继续下一天
      }
      // 天与天之间等 7 秒，避开 WakaTime 限频（10次/分钟）
      await new Promise(r => setTimeout(r, 7000))
    }
    console.log('All done.')
    return
  }

  // 默认今天
  const today = dayjs().utcOffset(8).format('YYYY-MM-DD')
  try {
    await doSync(today)
  } catch {
    // 忽略 —— 由 doSync 内部处理日志
  }
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
