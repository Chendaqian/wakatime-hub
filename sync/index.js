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
  try {
    // 使用 request 级 options 设置 user-agent，区分于默认 octokit 请求
    await octokit.gists.update({
      gist_id: GIST_ID,
      files: {
        [`summaries_${date}.json`]: {
          content: JSON.stringify(content)
        }
      }
    })
    console.log(`[${date}] done`)
  } catch (error) {
    if (error.status === 403 || error.status === 429) {
      console.log(`[${date}] rate limited (${error.status}), will retry...`)
      throw error
    }
    console.error(`[${date}] Gist update failed: ${error.message}`)
    throw error
  }
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

const BATCH_DELAY_MS = 300000 // 每天之间等 5 分钟，彻底避开所有 API 限频
const RETRY_DELAY_MS = 600000 // 429 后等待 10 分钟再重试

/**
 * 等待指定毫秒
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 同步单天数据（返回 summary 对象供调用方复用，避免重复 API 请求）
 */
async function syncDay(date) {
  console.log(`[${date}] fetching...`)
  const mySummary = await getMySummary(date)
  await updateGist(date, mySummary.data)
  console.log(`[${date}] done`)
  return mySummary
}

// 单天同步（带重试 + 延迟）
const syncDayWithRetry = async (date, times = 2) => {
  try {
    const mySummary = await syncDay(date)
    await sendMessageToWechat(
      `${date} update successfully!`,
      getMessageContent(date, mySummary.data)
    )
  } catch (error) {
    if (times === 1) {
      console.error(`[${date}] Unable to fetch wakatime summary\n ${error} `)
      return await sendMessageToWechat(`[${date}] failed to update wakatime data!`)
    }
    console.log(`[${date}] retry: ${times - 1} left, waiting ${RETRY_DELAY_MS / 1000}s...`)
    await sleep(RETRY_DELAY_MS)
    await syncDayWithRetry(date, times - 1)
  }
}

/**
 * 获取需要补的日期列表
 * 优先级：SYNC_DATE 单天 > SYNC_START~SYNC_END 区间 > 今天
 */
function getDates() {
  const { SYNC_DATE, SYNC_START, SYNC_END } = process.env

  // 单天补数据
  if (SYNC_DATE) {
    return [SYNC_DATE]
  }

  // 区间补数据
  if (SYNC_START && SYNC_END) {
    const dates = []
    let cur = dayjs(SYNC_START)
    const end = dayjs(SYNC_END)
    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      dates.push(cur.format('YYYY-MM-DD'))
      cur = cur.add(1, 'day')
    }
    return dates
  }

  // 默认今天
  return [
    dayjs()
      .utcOffset(8)
      .format('YYYY-MM-DD')
  ]
}

async function main() {
  const dates = getDates()
  const isBatch = dates.length > 1
  console.log(`Will sync ${dates.length} day(s): ${dates[0]} ~ ${dates[dates.length - 1]}`)

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    let ok = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await syncDay(date)
        ok = true
        break
      } catch (error) {
        if (attempt === 3) {
          console.error(`[${date}] FAILED after 3 attempts, skipping`)
        } else {
          const wait = attempt === 1 ? BATCH_DELAY_MS : RETRY_DELAY_MS
          console.log(`[${date}] attempt ${attempt}/3 failed, waiting ${wait / 1000}s...`)
          await sleep(wait)
        }
      }
    }
    if (!ok) continue

    // 批量模式：成功后天与天之间加间隔
    if (isBatch && i < dates.length - 1) {
      console.log(`waiting ${BATCH_DELAY_MS / 1000}s...`)
      await sleep(BATCH_DELAY_MS)
    }
  }

  console.log('All done.')
}

main()
