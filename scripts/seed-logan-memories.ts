/**
 * 為 Logan 建立初始記憶
 * 執行: npx tsx scripts/seed-logan-memories.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 載入 .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Logan 的初始記憶
const memories = [
  // === 公司理念 ===
  {
    category: 'philosophy',
    title: 'Venturo 核心願景',
    content: 'Venturo 不只是一套 ERP 系統，而是一個完整的旅遊業數位生態系統。目標是打造「旅行社內部營運」與「旅客外部體驗」完美銜接的平台，讓每一趟旅程從報價、訂購、出發到回憶，都能流暢且精彩。',
    tags: ['願景', '核心理念'],
    importance: 10,
  },
  {
    category: 'philosophy',
    title: '核心假設一：資訊對齊',
    content: '當資訊無法再成為競爭優勢時，應使資訊徹底對齊。透過制度化方式，確保所有產業角色在關鍵決策節點上，基於相同且可驗證的資訊進行行動。我們不靠資訊差賺錢，而是讓資訊透明成為結構設計。',
    tags: ['核心假設', '資訊對齊', 'THESIS'],
    importance: 10,
  },
  {
    category: 'philosophy',
    title: '核心假設二：專業系統化',
    content: '專業唯有被系統化，才能被保存與定價。將專業從個人層次移轉至系統層次，透過流程化、模板化與資料結構化，原本隱性的判斷得以成為顯性的系統行為。這樣專業才能被納入穩定的定價機制。',
    tags: ['核心假設', '專業系統化', 'THESIS'],
    importance: 10,
  },
  {
    category: 'philosophy',
    title: '核心假設三：秩序建立',
    content: '秩序一旦建立，市場將自然重組。秩序是指對角色、責任、資訊流與金流的清晰定義。當這些被明確規範，市場參與者將能在可預期的環境中做出理性決策。Venturo 透過建立秩序，使市場能重新發揮其自我調節功能。',
    tags: ['核心假設', '秩序', 'THESIS'],
    importance: 10,
  },

  // === 角色模型 ===
  {
    category: 'business_rule',
    title: '角色模型：S¹ + S² → B',
    content: 'Venturo 採用 S¹ + S² → B 的角色模型：S¹ (Travel Supplier) 是旅遊專屬供應商如 DMC、飯店、導遊；S² (Service Supplier) 是產業服務供應商如金流、SaaS；B (Partner) 是旅行社。平台不直接面向最終交易，避免抽成與資訊黑箱。',
    tags: ['角色模型', 'S1', 'S2', 'B', 'THESIS'],
    importance: 9,
  },
  {
    category: 'business_rule',
    title: '不對 S¹ 抽成',
    content: 'Venturo 刻意不對旅遊專屬供應商（S¹）抽成。對 S¹ 抽成會導致供應商想繞過平台、訂單資訊碎片化、平台變成交易掮客。不抽成時，供應商使用平台的動機是「秩序、完整資訊與降低溝通成本」，這正是平台存在的基礎。',
    tags: ['商業規則', '不抽成', 'S1'],
    importance: 9,
  },
  {
    category: 'business_rule',
    title: 'C 端是能力釋放端',
    content: 'C 端（旅客）被定位為「能力釋放端」，不是交易中心或營收主體。C 端功能是將 ERP 治理層中已建立的秩序，以安全且可控的方式釋放給旅客。這樣可以保持平台的治理中立性，避免角色衝突。',
    tags: ['商業規則', 'C端', '旅客'],
    importance: 8,
  },

  // === 技術架構 ===
  {
    category: 'tech_decision',
    title: 'ERP 是權力中心',
    content: 'Venturo ERP 是整個系統的權力中心（Power Center），不只是管理工具，而是產業治理層。ERP 定義權限、責任、資訊流與金流。所有對外能力（如 App）皆必須回溯至 ERP 所定義的規則。App 只能是 ERP 的延伸，不能主導。',
    tags: ['技術架構', 'ERP', '權力中心'],
    importance: 9,
  },
  {
    category: 'tech_decision',
    title: '雙平台架構',
    content: 'Venturo 由兩個系統組成：venturo-erp（員工內部營運）和 venturo-online（旅客會員體驗）。兩個系統共享同一個 Supabase 資料庫。資料流向：ERP 產生 → Online 呈現 → 會員回饋 → ERP 優化。',
    tags: ['技術架構', '雙平台', 'ERP', 'Online'],
    importance: 8,
  },

  // === 業務流程 ===
  {
    category: 'workflow',
    title: '團為中心的架構',
    content: '所有業務資料以「團（Tour）」為中心。團下面有訂單、行程、報價。訂單下面有成員。資料載入的唯一標準是「使用者眼睛現在要看的」，避免過度讀取。',
    tags: ['架構', '團', 'Tour', '資料流'],
    importance: 8,
  },
  {
    category: 'workflow',
    title: '價值飛輪',
    content: '設計 → 銷售 → 出發 → 回憶 → 推薦，形成正向循環。員工在 ERP 設計行程，客戶在 Online 報名，旅途中上傳照片形成回憶，回國後分享給親友變成新客戶，飛輪再轉。',
    tags: ['流程', '價值飛輪', '商業模式'],
    importance: 8,
  },
  {
    category: 'workflow',
    title: '提案到開團流程',
    content: '提案(草稿) → 洽談中 → 建立套件 → 選定套件 → 轉開團。轉開團後進入旅遊團階段：已確認 → 進行中 → 待結案 → 結案。',
    tags: ['流程', '提案', '開團'],
    importance: 7,
  },

  // === 系統操作 ===
  {
    category: 'how_to',
    title: '開報價單前要先開團',
    content: '在 ERP 系統中，報價單必須依附於團。所以要先建立旅遊團，才能在團底下建立報價單。',
    tags: ['操作', '報價單', '團'],
    importance: 6,
  },
  {
    category: 'how_to',
    title: '訂單要綁定團才能加成員',
    content: '訂單必須綁定到某個團，才能在訂單下新增成員（旅客）。成員資料包含姓名、護照、聯絡方式等。',
    tags: ['操作', '訂單', '成員'],
    importance: 6,
  },
  {
    category: 'how_to',
    title: '收款要先有訂單',
    content: '收款單必須關聯到訂單。先有訂單，才能建立收款單來記錄客戶的付款。',
    tags: ['操作', '收款', '訂單'],
    importance: 6,
  },
  {
    category: 'workflow',
    title: '簽證流程',
    content: '簽證辦理流程：收護照 → 送件 → 取件 → 發還。每個步驟都要在系統中更新狀態。',
    tags: ['流程', '簽證'],
    importance: 6,
  },

  // === 公司文件位置 ===
  {
    category: 'where_is',
    title: '公司理念文件位置',
    content: '公司核心理念在 /Users/williamchien/Projects/VENTURO_THESIS.md，這是九章產業論文，定義了 Venturo 平台的思想基礎與戰略框架。',
    tags: ['文件', '理念', 'THESIS'],
    importance: 9,
  },
  {
    category: 'where_is',
    title: '平台願景文件位置',
    content: '雙平台架構願景在 /Users/williamchien/Projects/venturo-erp/.claude/VENTURO_VISION.md，說明 venturo-erp 和 venturo-online 的關係與價值飛輪。',
    tags: ['文件', '願景', 'VISION'],
    importance: 9,
  },
  {
    category: 'where_is',
    title: '特洛伊計畫位置',
    content: '商業計劃在 /Users/williamchien/Projects/特洛伊計畫.md，這是完整版計劃案，定義了 Travel Advisory OS（旅遊顧問作業系統）的概念。',
    tags: ['文件', '計畫', '特洛伊'],
    importance: 8,
  },
  {
    category: 'where_is',
    title: '網站地圖位置',
    content: '專案網站地圖在 /Users/williamchien/Projects/SITEMAP.md，包含 ERP 和 Online 兩個系統的完整頁面路由、API、Store 結構。',
    tags: ['文件', 'SITEMAP', '架構'],
    importance: 8,
  },
  {
    category: 'where_is',
    title: '開發規範位置',
    content: 'AI 開發規範在 /Users/williamchien/Projects/venturo-erp/.claude/CLAUDE.md，包含完整的開發指南、UI 規範、禁止事項等。',
    tags: ['文件', '規範', 'CLAUDE'],
    importance: 8,
  },
  {
    category: 'where_is',
    title: '文檔目錄位置',
    content: '開發文檔在 /Users/williamchien/Projects/venturo-erp/docs/ 目錄下，README.md 是文檔索引，包含系統狀態、開發指南、RLS 政策等。',
    tags: ['文件', 'docs', '目錄'],
    importance: 7,
  },

  // === 角落旅行社商業策略 ===
  {
    category: 'philosophy',
    title: '角落旅行社定位',
    content: '角落旅行社專注於高端客製化旅遊。我們選擇這個市場是因為擁有既有客戶與資訊優勢，這是我們最擅長的領域。核心理念：單價越高、我們越開心，這是威廉一直想做的事。',
    tags: ['角落', '定位', '高端', '客製化'],
    importance: 10,
  },
  {
    category: 'philosophy',
    title: '產業危機認知',
    content: '旅行社面臨的危機：網路資訊太過方便，客人不再需要我們提供資訊，我們的價值只剩下「信任的保證」。當口袋名單不再是口袋名單的時候，傳統旅行社就會被淘汰。',
    tags: ['危機', '網路', '資訊透明'],
    importance: 9,
  },
  {
    category: 'philosophy',
    title: 'Venturo 平台策略',
    content: '與其等著被淘汰，不如換個方式經營：成立一個平台，讓其他旅行社可以訂閱使用。這樣可以減輕他們對 ERP 的抗拒感，因為很多人不想改變、不想升級，想用傳統方式。我們要讓他們知道：傳統方式只會被資訊透明打破。',
    tags: ['策略', '平台', '訂閱', 'ERP'],
    importance: 10,
  },
  {
    category: 'philosophy',
    title: '市場破壞者角色',
    content: '我們做的事情就像 Day 和 Carol 進入市場時一樣，讓傳統業者不知所措、破壞原有市場秩序。我們用系統提供完整資訊，行程和住宿都是經過認可的，客人看到的內容基本上只有我們家有，這樣「網路資訊」就掌握在我們手上。',
    tags: ['破壞', '市場', '資訊壟斷'],
    importance: 9,
  },
  {
    category: 'philosophy',
    title: '資訊優勢策略',
    content: '我們的系統優勢：提供完整且認可的資訊（行程、住宿）。客人看到的內容是獨家的，網路上找不到。這樣資訊優勢就持續在我們手上，而不是被網路瓦解。',
    tags: ['資訊', '優勢', '獨家'],
    importance: 9,
  },

  // === 更多核心理念 ===
  {
    category: 'philosophy',
    title: '不對 S¹ 抽成的原因',
    content: 'Venturo 刻意不對旅遊專屬供應商（S¹）抽成。對 S¹ 抽成會導致供應商想繞過平台、訂單資訊碎片化、平台變成交易掮客。不抽成時，供應商使用平台的動機是「秩序、完整資訊與降低溝通成本」。',
    tags: ['理念', '不抽成', 'S1', 'THESIS'],
    importance: 9,
  },
  {
    category: 'philosophy',
    title: 'ERP 是權力中心',
    content: 'Venturo ERP 是整個系統的權力中心（Power Center），不只是管理工具，而是產業治理層。ERP 定義權限、責任、資訊流與金流。所有對外能力（如 App）皆必須回溯至 ERP 所定義的規則。App 只能是 ERP 的延伸，不能主導。',
    tags: ['理念', 'ERP', '權力中心', 'THESIS'],
    importance: 9,
  },
  {
    category: 'term_definition',
    title: 'Travel Advisory OS',
    content: 'Travel Advisory OS（旅遊顧問作業系統）是特洛伊計畫的核心概念。把「旅行社不可取代的顧問判斷」變成系統與資料資產，而不是做一個更快、更便宜的旅遊平台。',
    tags: ['定義', '特洛伊', 'OS'],
    importance: 8,
  },
  {
    category: 'philosophy',
    title: 'Venturo 最終定錨句',
    content: 'Venturo 不是在做一個更快、更便宜的旅遊平台，而是在為旅遊產業建立一個即使未來十年技術持續變化，仍然站得住腳的運作結構。',
    tags: ['理念', '定錨', 'THESIS'],
    importance: 10,
  },
]

async function seedMemories() {
  // 取得第一個 workspace（角落旅行社）
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)

  if (wsError || !workspaces?.length) {
    console.error('找不到 workspace:', wsError)
    return
  }

  const workspaceId = workspaces[0].id
  console.log(`使用 workspace: ${workspaces[0].name} (${workspaceId})`)

  // 檢查是否已有記憶
  const { count } = await supabase
    .from('ai_memories')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  if (count && count > 0) {
    console.log(`已有 ${count} 筆記憶`)

    // 檢查是否有新增的記憶需要寫入（比對 title）
    const { data: existingMemories } = await supabase
      .from('ai_memories')
      .select('title')
      .eq('workspace_id', workspaceId)

    const existingTitles = new Set(existingMemories?.map(m => m.title) || [])
    const newMemories = memories.filter(m => !existingTitles.has(m.title))

    if (newMemories.length === 0) {
      console.log('沒有新記憶需要寫入')
      return
    }

    console.log(`發現 ${newMemories.length} 筆新記憶，開始寫入...`)

    const newMemoriesWithWorkspace = newMemories.map(m => ({
      ...m,
      workspace_id: workspaceId,
      source: 'manual',
      created_by: '00000000-0000-0000-0000-000000000002',
    }))

    const { data, error } = await supabase
      .from('ai_memories')
      .insert(newMemoriesWithWorkspace)
      .select()

    if (error) {
      console.error('寫入失敗:', error)
      return
    }

    console.log(`✅ 成功寫入 ${data.length} 筆新記憶給 Logan`)
    return
  }

  // 寫入記憶
  const memoriesWithWorkspace = memories.map(m => ({
    ...m,
    workspace_id: workspaceId,
    source: 'manual',  // 只能是 claude_chat, manual, observation, meeting
    created_by: '00000000-0000-0000-0000-000000000002', // Logan 自己
  }))

  const { data, error } = await supabase
    .from('ai_memories')
    .insert(memoriesWithWorkspace)
    .select()

  if (error) {
    console.error('寫入失敗:', error)
    return
  }

  console.log(`✅ 成功寫入 ${data.length} 筆記憶給 Logan`)
}

seedMemories()
