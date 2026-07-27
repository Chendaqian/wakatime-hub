/**
 * 创建 96 个按月 Gist（2019-01 ~ 2026-12），描述 "wakatime YYYY-MM"
 */
const { Octokit } = require('@octokit/rest')
const fs = require('fs')
const path = require('path')

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
const token = env.match(/GH_TOKEN=(.+)/)[1]
const octokit = new Octokit({ auth: `token ${token}`, userAgent: 'wakatime-hub/1.0' })

const START_YEAR = 2019
const END_YEAR = 2026

async function main() {
  const result = {}
  let count = 0

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    for (let month = 1; month <= 12; month++) {
      const mm = String(month).padStart(2, '0')
      const key = `${year}-${mm}`
      const desc = `wakatime ${key}`

      try {
        const gist = await octokit.gists.create({
          description: desc,
          public: false,
          files: {
            [`summaries_${key}.json`]: { content: '[]' }
          }
        })
        result[key] = gist.data.id
        count++
        console.log(`[${count}/96] ${key}: ${gist.data.id}`)
      } catch (err) {
        console.error(`FAILED ${key}: ${err.message}`)
      }

      // API 限频保护
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // 输出配置 JSON
  console.log('\n===== GIST_ID 配置 =====')
  console.log(JSON.stringify(result))
  fs.writeFileSync(path.join(__dirname, 'monthly-gist-ids.json'), JSON.stringify(result, null, 2))
  console.log('\n已写入 monthly-gist-ids.json')
  console.log(`成功: ${Object.keys(result).length}/96`)
}

main()
