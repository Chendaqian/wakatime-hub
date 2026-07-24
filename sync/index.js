require('dotenv').config()
const { WakaTimeClient, RANGE } = require('wakatime-client')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
const { Octokit } = require('@octokit/rest')
const Axios = require('axios')

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
  auth: `token ${GH_TOKEN}`
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
  console.log(`Writing to Gist ${GIST_ID}...`)
  await octokit.gists.update({
    gist_id: GIST_ID,
    files: {
      [`summaries_${date}.json`]: {
        content: JSON.stringify(content)
      }
    }
  })
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

const fetchSummaryWithRetry = async times => {
  const date = process.env.SYNC_DATE ||
    dayjs()
      .utcOffset(8)
      .format('YYYY-MM-DD')
  try {
    const mySummary = await getMySummary(date)
    await updateGist(date, mySummary.data)
    await sendMessageToWechat(
      `${date} update successfully!`,
      getMessageContent(date, mySummary.data)
    )
  } catch (error) {
    if (times === 1) {
      console.error(`Unable to fetch wakatime summary\n ${error} `)
      return await sendMessageToWechat(`[${date}]failed to update wakatime data!`)
    }
    console.log(`retry fetch summary data: ${times - 1} time`)
    await fetchSummaryWithRetry(times - 1)
  }
}

async function main() {
  await fetchSummaryWithRetry(3)
}

main()
