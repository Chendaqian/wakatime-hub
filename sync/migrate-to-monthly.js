/**
 * 从旧 Gist 迁移数据到新的按年 Gist
 * 旧 Gist 不动，新 Gist 每年一个，含 summaries_YYYY-MM.json × 12
 */
const { Octokit } = require('@octokit/rest')
const fs = require('fs')
const path = require('path')
const Axios = require('axios')

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
const token = env.match(/GH_TOKEN=(.+)/)[1]
const octokit = new Octokit({ auth: `token ${token}`, userAgent: 'wakatime-hub/1.0' })

// 新按年 Gist
const yearlyIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'yearly-gist-ids.json'), 'utf8'))
// 旧 Gist ID
const oldConfig = JSON.parse(env.match(/GIST_ID=({.+})/)[1])
const oldGistIds = [...new Set(Object.values(oldConfig).flat())]

async function main() {
  // 1. 从旧 Gist 读取所有天文件，按 年-月 分组
  const monthData = {} // { "2026-07": { "date": "2026-07-21", "content": "..." }[] }

  for (const gid of oldGistIds) {
    let gist
    try {
      gist = await octokit.gists.get({ gist_id: gid })
    } catch (err) {
      console.log(`  skip Gist ${gid}: ${err.message}`)
      continue
    }

    const files = gist.data.files
    let fileCount = 0
    for (const [name, file] of Object.entries(files)) {
      const match = name.match(/^summaries_(\d{4}-\d{2}-\d{2})\.json$/)
      if (!match) continue
      const date = match[1]       // "2026-07-21"
      const month = date.substring(0, 7) // "2026-07"
      const year = date.substring(0, 4)  // "2026"
      if (!yearlyIds[year]) continue

      if (!monthData[month]) monthData[month] = []
      monthData[month].push({ date, rawUrl: file.raw_url, content: file.content })
      fileCount++
    }
    console.log(`  Gist ${gid.substring(0,8)}: ${fileCount} files`)
  }

  const months = Object.keys(monthData).sort()
  console.log(`\n共 ${months.length} 个月待写入\n`)

  // 2. 对每个月：去重 → 解析 → 写入对应年的 Gist
  const yearGistCache = {} // { "2026": { 当前已写的文件 } }
  let done = 0
  for (const month of months) {
    const year = month.substring(0, 4)
    const gid = yearlyIds[year]
    if (!gid) { console.log(`  no Gist for ${month}`); continue }

    const entries = monthData[month]

    // 按日期去重：同一天取最长 content
    const deduped = new Map()
    for (const { date, rawUrl, content } of entries) {
      let raw = content
      if (!raw && rawUrl && token) {
        try {
          const resp = await Axios.get(rawUrl, { headers: { Authorization: `token ${token}` } })
          raw = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data)
        } catch { /* skip */ }
      }
      if (!raw) continue

      const existing = deduped.get(date)
      if (!existing || raw.length > existing.length) {
        deduped.set(date, raw)
      }
    }

    // 解析为 summary
    const summaries = []
    for (const [date, raw] of deduped) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          summaries.push({ date, ...parsed[0] })
        }
      } catch { console.log(`  parse error for ${date}`) }
    }
    summaries.sort((a, b) => a.date.localeCompare(b.date))

    // 写入新 Gist（只更新这个月文件，不动其他月）
    try {
      await octokit.gists.update({
        gist_id: gid,
        files: {
          [`summaries_${month}.json`]: { content: JSON.stringify(summaries) }
        }
      })
      done++
      console.log(`[${done}/${months.length}] ${month}: ${summaries.length} days → ${gid}`)
    } catch (err) {
      console.log(`  ${month} FAILED: ${err.message}`)
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\n完成! ${done}/${months.length} 个月已迁移`)
}

main()
