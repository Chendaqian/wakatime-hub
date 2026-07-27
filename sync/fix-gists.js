/**
 * 删除 96 个按月 Gist，然后创建 8 个按年 Gist（每年一个，含 12 个文件）
 */
const { Octokit } = require('@octokit/rest')
const fs = require('fs')
const path = require('path')

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
const token = env.match(/GH_TOKEN=(.+)/)[1]
const octokit = new Octokit({ auth: `token ${token}`, userAgent: 'wakatime-hub/1.0' })

const monthlyIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'monthly-gist-ids.json'), 'utf8'))

async function main() {
  // 1. 删除 96 个按月 Gist
  console.log('=== 删除 96 个按月 Gist ===')
  let deleted = 0
  for (const [month, gid] of Object.entries(monthlyIds)) {
    try {
      await octokit.gists.delete({ gist_id: gid })
      deleted++
      console.log(`[${deleted}/96] deleted ${month}: ${gid}`)
    } catch (err) {
      console.log(`FAILED ${month}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  console.log(`删除完成: ${deleted}/96`)

  // 2. 创建 8 个按年 Gist（2019~2026），每个含 12 个空月文件
  console.log('\n=== 创建 8 个按年 Gist ===')
  const yearlyIds = {}
  for (let year = 2019; year <= 2026; year++) {
    const files = {}
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0')
      files[`summaries_${year}-${mm}.json`] = { content: '[]' }
    }
    try {
      const gist = await octokit.gists.create({
        description: `wakatime ${year}`,
        public: false,
        files
      })
      yearlyIds[String(year)] = gist.data.id
      console.log(`${year}: ${gist.data.id}`)
    } catch (err) {
      console.log(`FAILED ${year}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n===== GIST_ID 配置 =====')
  console.log(JSON.stringify(yearlyIds))
  fs.writeFileSync(path.join(__dirname, 'yearly-gist-ids.json'), JSON.stringify(yearlyIds, null, 2))
  console.log('\n已写入 yearly-gist-ids.json')
}

main()
