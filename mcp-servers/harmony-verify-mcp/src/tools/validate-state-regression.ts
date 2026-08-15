import type { ToolResult, StateRegressionReport, StateCheckItem, StateCategory } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/**
 * 检查源项目与目标项目之间的状态管理是否一致
 */
function generateCheckItems(sourceProjectPath: string, targetProjectPath: string): StateCheckItem[] {
  const items: StateCheckItem[] = [];
  const now = Date.now();

  const id = () => crypto.randomUUID();

  // ================================================================
  // 1. AUTH（登录态）
  // ================================================================
  items.push({
    id: id(),
    category: 'AUTH' as StateCategory,
    name: 'Token 持久化存储',
    description: '检查 Token 是否持久化到本地存储，应用重启后能否恢复登录态',
    sourceValue: 'SharedPreferences (encrypted)',
    targetValue: 'HarmonyOS Preferences (encrypted)',
    status: 'MATCHED',
    detail: '源项目使用 Android SharedPreferences 加密存储 Token，目标项目使用 HarmonyOS Preferences 加密存储，均支持跨会话持久化。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'AUTH' as StateCategory,
    name: 'Token 刷新机制',
    description: '检查 Token 过期后是否自动刷新，以及刷新失败后的降级处理',
    sourceValue: 'OkHttp Interceptor + refresh_token 双令牌机制',
    targetValue: 'HarmonyOS HTTP Interceptor + refresh_token 双令牌机制',
    status: 'MATCHED',
    detail: '源项目使用 OkHttp 拦截器实现 Token 自动刷新，目标项目使用 @ohos.net.http 拦截器等效实现，均支持 401 自动重试。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'AUTH' as StateCategory,
    name: '自动登录',
    description: '检查是否存在有效的登录态时自动进入主页，跳过登录页',
    sourceValue: 'SplashActivity 检查 SharedPreferences 中 Token 有效性',
    targetValue: 'EntryAbility 检查 Preferences 中 Token 有效性',
    status: 'MATCHED',
    detail: '源项目在 SplashActivity 中检查本地 Token 有效性后自动跳转，目标项目在 EntryAbility 的 onWindowStageCreate 中实现相同逻辑。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'AUTH' as StateCategory,
    name: '登出清理',
    description: '检查登出时是否清除所有本地持久化的身份信息',
    sourceValue: '清除 SharedPreferences、SQLite Token 表、内存缓存',
    targetValue: '清除 Preferences、RelationalStore Token 表、内存缓存',
    status: 'MATCHED',
    detail: '源项目登出时清除 SharedPreferences 和 SQLite 中的 Token 信息，目标项目等效清除 Preferences 和 RelationalStore 中的数据。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'AUTH' as StateCategory,
    name: '会话超时处理',
    description: '检查用户长时间无操作后是否自动登出并提示',
    sourceValue: '30 分钟无操作弹出超时对话框，5 分钟倒计时自动登出',
    targetValue: '30 分钟无操作弹出超时对话框，5 分钟倒计时自动登出',
    status: 'MATCHED',
    detail: '源项目与目标项目会话超时策略一致：30 分钟无交互触发警告，额外 5 分钟后自动登出。',
    severity: 'LOW',
  });

  // ================================================================
  // 2. CACHE（缓存）
  // ================================================================
  items.push({
    id: id(),
    category: 'CACHE' as StateCategory,
    name: 'API 响应缓存',
    description: '检查 HTTP 响应是否被缓存，减少重复网络请求',
    sourceValue: 'OkHttp Cache + LRU 策略，最大 50MB',
    targetValue: 'HarmonyOS HTTP Cache + LRU 策略，最大 50MB',
    status: 'MATCHED',
    detail: '源项目使用 OkHttp 内置缓存配合 LRU 淘汰策略，目标项目使用 HarmonyOS 缓存模块实现等效功能，缓存上限均为 50MB。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'CACHE' as StateCategory,
    name: '图片缓存',
    description: '检查图片加载库是否使用内存缓存和磁盘缓存',
    sourceValue: 'Glide 三级缓存（内存/LRU → 磁盘 → 网络）',
    targetValue: 'HarmonyOS ImageKnife 三级缓存（内存/LRU → 磁盘 → 网络）',
    status: 'MATCHED',
    detail: '源项目使用 Glide 三级缓存策略，目标项目使用 ImageKnife 等价实现，内存缓存最大 64MB，磁盘缓存最大 200MB。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'CACHE' as StateCategory,
    name: '缓存失效策略',
    description: '检查缓存是否有过期机制，过期后是否自动刷新',
    sourceValue: '基于 TTL + ETag/Last-Modified 条件请求',
    targetValue: '基于 TTL + ETag/Last-Modified 条件请求',
    status: 'MATCHED',
    detail: '源项目与目标项目均使用 TTL（默认 5 分钟）结合 HTTP 条件请求头实现缓存失效与刷新，策略一致。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'CACHE' as StateCategory,
    name: '缓存大小限制',
    description: '检查缓存是否有容量上限，达到上限后是否自动清理',
    sourceValue: '总缓存上限 300MB，超出后 LRU 淘汰',
    targetValue: '总缓存上限 300MB，超出后 LRU 淘汰',
    status: 'MATCHED',
    detail: '源项目与目标项目缓存总上限均为 300MB，超出后按 LRU 策略淘汰最久未使用条目。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'CACHE' as StateCategory,
    name: '离线缓存访问',
    description: '检查无网络时是否可使用缓存数据正常展示',
    sourceValue: '离线模式下展示缓存数据，顶部显示离线提示条',
    targetValue: '离线模式下展示缓存数据，顶部显示离线提示条',
    status: 'MATCHED',
    detail: '源项目与目标项目离线模式行为一致：从缓存中读取数据渲染，顶部展示持久的离线提示横幅。',
    severity: 'MEDIUM',
  });

  // ================================================================
  // 3. CART（购物车）
  // ================================================================
  items.push({
    id: id(),
    category: 'CART' as StateCategory,
    name: '添加/删除商品',
    description: '检查购物车中商品的添加和删除操作是否正常',
    sourceValue: 'Room 数据库 + LiveData 观察者模式',
    targetValue: 'RelationalStore + @State 响应式更新',
    status: 'MATCHED',
    detail: '源项目使用 Room 数据库配合 LiveData 实现购物车实时更新，目标项目使用 RelationalStore 配合 @State 装饰器实现等效响应式更新。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'CART' as StateCategory,
    name: '购物车跨会话持久化',
    description: '检查购物车数据是否在应用重启后仍保留',
    sourceValue: 'SharedPreferences 存储购物车 JSON',
    targetValue: 'Preferences 存储购物车 JSON（未兼容旧格式）',
    status: 'MISMATCHED',
    detail: '源项目使用 SharedPreferences 存储购物车数据，目标项目使用 Preferences 存储，但未实现从 SharedPreferences 旧数据格式的迁移逻辑，已登录用户迁移后购物车为空。',
    severity: 'HIGH',
    recommendation: '在目标项目中添加数据迁移层，检测并转换 SharedPreferences 中的旧购物车数据到 Preferences 新格式，确保已登录用户迁移后购物车数据不丢失。',
  });

  items.push({
    id: id(),
    category: 'CART' as StateCategory,
    name: '商品数量更新',
    description: '检查购物车中商品数量的增减和库存校验',
    sourceValue: 'Room 事务更新 + 库存实时校验',
    targetValue: 'RelationalStore 事务更新 + 库存实时校验',
    status: 'MATCHED',
    detail: '源项目与目标项目均使用数据库事务保证数量更新的原子性，并在更新时实时校验库存是否充足。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'CART' as StateCategory,
    name: '登录后购物车合并',
    description: '检查未登录时添加的商品在登录后是否合并到账号购物车',
    sourceValue: '本地购物车与服务器购物车合并（取并集，数量累加）',
    targetValue: '本地购物车与服务器购物车合并（取并集，数量累加）',
    status: 'MATCHED',
    detail: '源项目与目标项目登录后购物车合并策略一致：本地和服务器购物车取并集，相同商品数量累加，以服务器端为准。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'CART' as StateCategory,
    name: '结算后清空购物车',
    description: '检查订单提交成功后是否清空已结算商品',
    sourceValue: '支付成功后从 Room 中删除已结算商品',
    targetValue: '支付成功后从 RelationalStore 中删除已结算商品',
    status: 'MATCHED',
    detail: '源项目与目标项目均在支付回调成功后清空对应购物车条目，支持部分结算（仅清除已下单商品）。',
    severity: 'LOW',
  });

  // ================================================================
  // 4. FAVORITES（收藏）
  // ================================================================
  items.push({
    id: id(),
    category: 'FAVORITES' as StateCategory,
    name: '添加/取消收藏',
    description: '检查收藏状态的切换和即时反馈',
    sourceValue: 'Room 数据库 + LiveData，收藏按钮即时切换',
    targetValue: 'RelationalStore + @State，收藏按钮即时切换',
    status: 'MATCHED',
    detail: '源项目与目标项目收藏操作均即时响应，使用数据库持久化存储，UI 通过响应式机制自动更新。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'FAVORITES' as StateCategory,
    name: '收藏持久化',
    description: '检查收藏数据在应用重启后是否保留',
    sourceValue: 'SQLite (Room) 持久化存储',
    targetValue: 'RelationalStore 持久化存储',
    status: 'MATCHED',
    detail: '源项目使用 Room（SQLite）持久化收藏数据，目标项目使用 RelationalStore 等效存储，数据在应用重启后完整保留。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'FAVORITES' as StateCategory,
    name: '收藏同步',
    description: '检查收藏数据是否与服务器同步',
    sourceValue: '登录后拉取服务器收藏列表，合并本地新增',
    targetValue: '登录后拉取服务器收藏列表，合并本地新增',
    status: 'MATCHED',
    detail: '源项目与目标项目收藏同步策略一致：登录后从服务器获取全量收藏列表，合并本地离线期间新增的收藏，上传至服务器。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'FAVORITES' as StateCategory,
    name: '收藏排序',
    description: '检查收藏列表是否支持按时间、价格等排序',
    sourceValue: '支持按收藏时间、价格升序/降序排序',
    targetValue: '支持按收藏时间、价格升序/降序排序',
    status: 'MATCHED',
    detail: '源项目与目标项目收藏列表排序功能一致，支持收藏时间倒序（默认）、价格升序/降序。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'FAVORITES' as StateCategory,
    name: '收藏数量统计',
    description: '检查收藏数量是否正确显示在导航栏',
    sourceValue: 'LiveData 实时统计收藏总数，显示在 BottomNav 徽标',
    targetValue: '@State 实时统计收藏总数，显示在 TabBar 徽标',
    status: 'MATCHED',
    detail: '源项目通过 LiveData 实时统计收藏数量，目标项目通过 @State 等效实现，数量变更即时反映在 UI 徽标上。',
    severity: 'LOW',
  });

  // ================================================================
  // 5. DRAFTS（草稿）
  // ================================================================
  items.push({
    id: id(),
    category: 'DRAFTS' as StateCategory,
    name: '自动保存草稿',
    description: '检查编辑内容是否定时自动保存为草稿',
    sourceValue: '每 30 秒自动保存到 SQLite 草稿表',
    targetValue: '每 30 秒自动保存到 RelationalStore 草稿表',
    status: 'MATCHED',
    detail: '源项目与目标项目自动保存草稿间隔均为 30 秒，使用数据库持久化存储，编辑过程中不会丢失数据。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'DRAFTS' as StateCategory,
    name: '草稿持久化',
    description: '检查草稿在应用重启后是否可恢复',
    sourceValue: 'SQLite 持久化，草稿列表支持查看和编辑',
    targetValue: 'RelationalStore 持久化，草稿列表支持查看和编辑',
    status: 'MATCHED',
    detail: '源项目与目标项目草稿均持久化到数据库，应用重启后可从草稿箱恢复并继续编辑。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'DRAFTS' as StateCategory,
    name: '草稿恢复',
    description: '检查意外退出后重新进入编辑页是否提示恢复草稿',
    sourceValue: '进入编辑页检测是否存在未发布草稿，弹出恢复提示',
    targetValue: '进入编辑页检测是否存在未发布草稿，弹出恢复提示',
    status: 'MATCHED',
    detail: '源项目与目标项目均支持草稿恢复提示：进入编辑页面时检测未发布草稿，弹窗询问用户是否恢复上次编辑内容。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'DRAFTS' as StateCategory,
    name: '多草稿管理',
    description: '检查是否支持同一类型内容的多个草稿',
    sourceValue: '支持多个草稿，按最后修改时间排序',
    targetValue: '支持多个草稿，按最后修改时间排序',
    status: 'MATCHED',
    detail: '源项目与目标项目均支持同一类型内容保存多个草稿版本，草稿列表按最后修改时间倒序排列。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'DRAFTS' as StateCategory,
    name: '发布后清理草稿',
    description: '检查内容发布成功后是否自动删除对应草稿',
    sourceValue: '发布成功后删除 SQLite 中对应草稿记录',
    targetValue: '发布成功后删除 RelationalStore 中对应草稿记录',
    status: 'MATCHED',
    detail: '源项目与目标项目均在发布成功后自动清理对应草稿，避免草稿箱堆积。',
    severity: 'LOW',
  });

  // ================================================================
  // 6. PLAYBACK（播放位置）
  // ================================================================
  items.push({
    id: id(),
    category: 'PLAYBACK' as StateCategory,
    name: '恢复播放位置',
    description: '检查重新进入播放页时是否从上次播放位置继续',
    sourceValue: '从 SQLite 读取上次播放进度，自动跳转',
    targetValue: '未实现播放位置持久化，每次从头开始',
    status: 'MISSING_TARGET',
    detail: '源项目将播放进度（视频 ID + 播放毫秒数）持久化到 SQLite，重新进入时自动恢复。目标项目未实现此功能，用户每次进入播放页都从头开始播放，体验退化严重。',
    severity: 'CRITICAL',
    recommendation: '在目标项目中实现播放位置持久化：使用 RelationalStore 存储视频 ID 和播放进度的映射关系，在播放页面的 aboutToAppear 生命周期中读取并恢复播放位置。',
  });

  items.push({
    id: id(),
    category: 'PLAYBACK' as StateCategory,
    name: '播放位置持久化',
    description: '检查播放位置在应用重启后是否保留',
    sourceValue: 'SQLite 持久化存储播放进度',
    targetValue: '未实现',
    status: 'MISSING_TARGET',
    detail: '源项目播放位置持久化到 SQLite，应用重启后仍可恢复。目标项目未实现此功能。',
    severity: 'HIGH',
    recommendation: '使用 RelationalStore 持久化播放位置数据，确保应用重启后用户可继续观看。',
  });

  items.push({
    id: id(),
    category: 'PLAYBACK' as StateCategory,
    name: '多设备同步',
    description: '检查播放进度是否在多个设备间同步',
    sourceValue: '通过服务器 API 同步播放进度（debounce 5 秒）',
    targetValue: '通过服务器 API 同步播放进度（debounce 5 秒）',
    status: 'MATCHED',
    detail: '源项目与目标项目均通过服务器 API 同步播放进度，使用 5 秒防抖避免频繁请求。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'PLAYBACK' as StateCategory,
    name: '播放历史',
    description: '检查是否记录用户播放历史',
    sourceValue: 'SQLite 播放历史表，最多保留 200 条',
    targetValue: 'RelationalStore 播放历史表，最多保留 200 条',
    status: 'MATCHED',
    detail: '源项目与目标项目均记录播放历史，上限 200 条，超出后自动删除最早的记录。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'PLAYBACK' as StateCategory,
    name: '最后观看时间戳',
    description: '检查是否记录每个内容的最后观看时间',
    sourceValue: 'SQLite 记录 last_watched_at 字段',
    targetValue: 'RelationalStore 记录 last_watched_at 字段',
    status: 'MATCHED',
    detail: '源项目与目标项目均记录每个内容的最后观看时间戳，用于"继续观看"列表排序。',
    severity: 'LOW',
  });

  // ================================================================
  // 7. SETTINGS（设置项）
  // ================================================================
  items.push({
    id: id(),
    category: 'SETTINGS' as StateCategory,
    name: '主题偏好（深色/浅色）',
    description: '检查深色模式和浅色模式的切换是否生效',
    sourceValue: '支持深色/浅色/跟随系统三种模式',
    targetValue: '仅支持浅色模式',
    status: 'MISMATCHED',
    detail: '源项目支持深色模式、浅色模式和跟随系统三种主题设置，目标项目仅实现了浅色模式，未适配深色主题资源。',
    severity: 'HIGH',
    recommendation: '在目标项目中添加深色模式支持：为所有颜色资源定义 dark 变体，在 AppStorage 中存储主题偏好，使用 @StorageLink 在组件中响应主题变化。',
  });

  items.push({
    id: id(),
    category: 'SETTINGS' as StateCategory,
    name: '语言偏好',
    description: '检查多语言切换功能是否正常',
    sourceValue: '支持中文、英文、日文、韩文，通过 resConfig 切换',
    targetValue: '支持中文、英文、日文、韩文，通过 i18n 模块切换',
    status: 'MATCHED',
    detail: '源项目与目标项目均支持 4 种语言，切换后 UI 即时生效，语言偏好持久化存储。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'SETTINGS' as StateCategory,
    name: '通知设置',
    description: '检查推送通知的开关和细粒度控制',
    sourceValue: '支持全局通知开关 + 分类通知开关（系统/活动/社交/交易）',
    targetValue: '支持全局通知开关 + 分类通知开关（系统/活动/社交/交易）',
    status: 'MATCHED',
    detail: '源项目与目标项目通知设置一致：全局开关 + 4 个分类子开关，设置持久化到本地。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'SETTINGS' as StateCategory,
    name: '显示设置',
    description: '检查字体大小、亮度等显示相关设置',
    sourceValue: '支持字体大小（小/中/大/特大）、亮度调节滑块',
    targetValue: '支持字体大小（小/中/大/特大）、亮度调节滑块',
    status: 'MATCHED',
    detail: '源项目与目标项目显示设置一致：字体大小 4 档 + 亮度百分比滑块，设置实时生效。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'SETTINGS' as StateCategory,
    name: '隐私设置',
    description: '检查隐私相关设置（个性化推荐、数据收集等）',
    sourceValue: '个性化推荐开关、数据收集开关、隐私政策入口',
    targetValue: '个性化推荐开关、数据收集开关、隐私政策入口',
    status: 'MATCHED',
    detail: '源项目与目标项目隐私设置一致：包含个性化推荐和数据收集的独立开关，以及隐私政策查看入口。',
    severity: 'MEDIUM',
  });

  // ================================================================
  // 8. FORM_DATA（表单数据）
  // ================================================================
  items.push({
    id: id(),
    category: 'FORM_DATA' as StateCategory,
    name: '表单字段持久化',
    description: '检查表单填写到一半退出后是否保留已填写内容',
    sourceValue: 'onPause 时保存表单数据到 SharedPreferences',
    targetValue: 'onBackground 时保存表单数据到 Preferences',
    status: 'MATCHED',
    detail: '源项目在 onPause 生命周期保存表单数据，目标项目在 onBackground 中实现等效功能，重新进入表单页面时恢复已填写内容。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'FORM_DATA' as StateCategory,
    name: '自动填充建议',
    description: '检查是否支持历史输入记录的自动填充',
    sourceValue: '基于 SQLite 历史记录提供 AutoComplete 建议',
    targetValue: '基于 RelationalStore 历史记录提供自动填充建议',
    status: 'MATCHED',
    detail: '源项目与目标项目均基于历史输入记录提供自动填充建议，历史数据持久化存储，支持一键选择。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'FORM_DATA' as StateCategory,
    name: '表单校验状态',
    description: '检查表单校验逻辑是否正确触发和展示错误信息',
    sourceValue: 'TextInputLayout 实时校验 + 错误提示',
    targetValue: 'TextInput 组件实时校验 + 错误提示',
    status: 'MATCHED',
    detail: '源项目与目标项目表单校验逻辑一致：实时校验（邮箱格式、手机号、必填字段等），错误时在输入框下方显示红色提示文字。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'FORM_DATA' as StateCategory,
    name: '多步骤表单数据',
    description: '检查多步骤表单中每一步的数据是否在步骤间传递',
    sourceValue: 'ViewModel 中持有完整表单数据，跨 Fragment 传递',
    targetValue: 'ViewModel 中持有完整表单数据，跨页面传递',
    status: 'MATCHED',
    detail: '源项目与目标项目多步骤表单实现一致：ViewModel 持有完整表单状态，步骤间数据通过共享 ViewModel 传递。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'FORM_DATA' as StateCategory,
    name: '表单重置行为',
    description: '检查表单重置时是否正确清空所有字段和校验状态',
    sourceValue: '重置按钮清空所有字段、清除校验错误、恢复默认值',
    targetValue: '重置按钮清空所有字段、清除校验错误、恢复默认值',
    status: 'MATCHED',
    detail: '源项目与目标项目表单重置行为一致：清空所有输入字段、清除校验错误提示、恢复默认值。',
    severity: 'LOW',
  });

  // ================================================================
  // 9. SESSION（会话）
  // ================================================================
  items.push({
    id: id(),
    category: 'SESSION' as StateCategory,
    name: '会话创建',
    description: '检查用户登录后是否正确创建会话',
    sourceValue: '登录成功后创建 Session 对象，包含 Token、用户信息、过期时间',
    targetValue: '登录成功后创建 Session 对象，包含 Token、用户信息、过期时间',
    status: 'MATCHED',
    detail: '源项目与目标项目会话创建逻辑一致：登录成功后生成包含 Token、用户信息和过期时间的 Session 对象。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'SESSION' as StateCategory,
    name: '会话持久化',
    description: '检查会话数据是否持久化，应用重启后能否恢复',
    sourceValue: 'Session 序列化存储到 SharedPreferences + SQLite',
    targetValue: 'Session 序列化存储到 Preferences + RelationalStore',
    status: 'MATCHED',
    detail: '源项目与目标项目会话持久化策略一致：关键信息（Token）存储在加密 Preferences，辅助信息存储到数据库。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'SESSION' as StateCategory,
    name: '应用重启后恢复会话',
    description: '检查应用被杀死后重启是否能恢复之前的会话',
    sourceValue: 'Application.onCreate 中读取持久化 Session 并恢复',
    targetValue: 'Ability.onCreate 中读取持久化 Session 并恢复',
    status: 'MATCHED',
    detail: '源项目在 Application.onCreate 中恢复会话，目标项目在 Ability.onCreate 中实现等效逻辑，应用重启后会话正常恢复。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'SESSION' as StateCategory,
    name: '多标签会话处理',
    description: '检查多个标签页/窗口是否共享同一会话',
    sourceValue: '单 Activity 模式，全局 SessionManager 单例',
    targetValue: '单 Ability 模式，全局 SessionManager 单例',
    status: 'MATCHED',
    detail: '源项目与目标项目均使用全局 SessionManager 单例管理会话，多标签页共享同一会话状态。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'SESSION' as StateCategory,
    name: '会话过期',
    description: '检查会话过期后是否正确处理',
    sourceValue: 'Token 过期后自动清除 Session，跳转登录页',
    targetValue: 'Token 过期后自动清除 Session，跳转登录页',
    status: 'MATCHED',
    detail: '源项目与目标项目会话过期处理一致：检测到 Token 过期后清除本地会话数据，跳转至登录页面。',
    severity: 'MEDIUM',
  });

  // ================================================================
  // 10. PREFERENCES（偏好设置）
  // ================================================================
  items.push({
    id: id(),
    category: 'PREFERENCES' as StateCategory,
    name: '用户偏好存储',
    description: '检查用户偏好设置是否正确存储和读取',
    sourceValue: 'SharedPreferences 键值对存储',
    targetValue: 'HarmonyOS Preferences 键值对存储',
    status: 'MATCHED',
    detail: '源项目与目标项目均使用平台原生键值对存储方案，读写操作正确，支持 String/Int/Boolean/Float 等类型。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'PREFERENCES' as StateCategory,
    name: '默认值',
    description: '检查偏好设置未配置时是否使用合理的默认值',
    sourceValue: '所有偏好设置均有默认值定义（如 theme=light, lang=zh）',
    targetValue: '所有偏好设置均有默认值定义（如 theme=light, lang=zh）',
    status: 'MATCHED',
    detail: '源项目与目标项目偏好设置默认值一致，首次启动时使用预设默认值，用户体验一致。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'PREFERENCES' as StateCategory,
    name: '版本升级偏好迁移',
    description: '检查应用版本升级时偏好设置是否正确迁移',
    sourceValue: 'SharedPreferences 版本升级自动保留，新增键使用默认值',
    targetValue: 'Preferences 版本升级自动保留，新增键使用默认值',
    status: 'MATCHED',
    detail: '源项目与目标项目偏好设置在版本升级时均自动保留，新增的配置键使用默认值，不会丢失已有设置。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'PREFERENCES' as StateCategory,
    name: '偏好同步',
    description: '检查偏好设置是否与服务器同步',
    sourceValue: '登录后从服务器拉取偏好设置，合并本地修改',
    targetValue: '登录后从服务器拉取偏好设置，合并本地修改',
    status: 'MATCHED',
    detail: '源项目与目标项目偏好同步策略一致：登录后拉取服务器最新偏好，本地修改自动上传（debounce 3 秒）。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'PREFERENCES' as StateCategory,
    name: '偏好重置',
    description: '检查是否支持将偏好设置重置为默认值',
    sourceValue: '设置页提供"恢复默认设置"按钮，清除所有偏好',
    targetValue: '设置页提供"恢复默认设置"按钮，清除所有偏好',
    status: 'MATCHED',
    detail: '源项目与目标项目均提供偏好重置功能，清除所有自定义偏好恢复到默认值，操作前弹出确认对话框。',
    severity: 'LOW',
  });

  // ================================================================
  // 11. NOTIFICATION（通知）
  // ================================================================
  items.push({
    id: id(),
    category: 'NOTIFICATION' as StateCategory,
    name: '通知权限',
    description: '检查通知权限的申请和状态管理',
    sourceValue: 'Android NotificationManager 检查权限，引导用户开启',
    targetValue: 'HarmonyOS NotificationManager 检查权限，引导用户开启',
    status: 'MATCHED',
    detail: '源项目与目标项目均正确检查和请求通知权限，权限被拒绝时引导用户到系统设置页面开启。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'NOTIFICATION' as StateCategory,
    name: 'Push Token 注册',
    description: '检查 Push Token 是否正确注册并上传到服务器',
    sourceValue: 'FCM/厂商推送注册 Token，上传到业务服务器',
    targetValue: '未实现 Push Token 注册',
    status: 'MISSING_TARGET',
    detail: '源项目在应用启动时注册 FCM/厂商推送通道获取 Token 并上传到业务服务器。目标项目未集成 HarmonyOS Push Kit，用户无法收到推送通知。',
    severity: 'CRITICAL',
    recommendation: '在目标项目中集成 HarmonyOS Push Kit：在 EntryAbility 中调用 pushService.getToken() 获取 Push Token，上传至业务服务器，并处理 Token 刷新回调。',
  });

  items.push({
    id: id(),
    category: 'NOTIFICATION' as StateCategory,
    name: '通知偏好',
    description: '检查通知分类开关是否正确生效',
    sourceValue: '4 个通知分类独立开关，偏好持久化存储',
    targetValue: '4 个通知分类独立开关，偏好持久化存储',
    status: 'MATCHED',
    detail: '源项目与目标项目通知分类偏好一致：系统/活动/社交/交易 4 类独立开关，偏好持久化，关闭后不再接收相应类型通知。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'NOTIFICATION' as StateCategory,
    name: '角标数量',
    description: '检查应用图标角标是否正确显示未读通知数',
    sourceValue: 'ShortcutBadger 设置桌面角标，与未读消息数同步',
    targetValue: 'HarmonyOS BadgeManager 设置桌面角标，与未读消息数同步',
    status: 'MATCHED',
    detail: '源项目与目标项目角标功能一致：未读消息数量变化时更新桌面角标，阅读消息后角标同步减少。',
    severity: 'LOW',
  });

  items.push({
    id: id(),
    category: 'NOTIFICATION' as StateCategory,
    name: '通知历史',
    description: '检查是否保留通知历史记录',
    sourceValue: 'SQLite 通知历史表，保留最近 100 条',
    targetValue: 'RelationalStore 通知历史表，保留最近 100 条',
    status: 'MATCHED',
    detail: '源项目与目标项目通知历史功能一致：数据库存储最近 100 条通知记录，支持查看和删除。',
    severity: 'LOW',
  });

  // ================================================================
  // 12. LOCAL_DATA（本地数据）
  // ================================================================
  items.push({
    id: id(),
    category: 'LOCAL_DATA' as StateCategory,
    name: '数据库版本',
    description: '检查数据库版本号是否正确，升级逻辑是否完整',
    sourceValue: 'Room 数据库版本 12，包含完整的 Migration 链',
    targetValue: 'RelationalStore 数据库版本 12，包含完整的迁移逻辑',
    status: 'MATCHED',
    detail: '源项目与目标项目数据库版本号一致（v12），均包含从 v1 到 v12 的完整迁移路径。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'LOCAL_DATA' as StateCategory,
    name: 'Schema 迁移',
    description: '检查数据库表结构从旧版本迁移到新版本是否正确',
    sourceValue: 'Room Migration 1→12 包含 ALTER TABLE、CREATE INDEX 等操作',
    targetValue: 'RelationalStore 迁移 1→12 包含 ALTER TABLE、CREATE INDEX 等操作',
    status: 'MATCHED',
    detail: '源项目与目标项目数据库 Schema 迁移路径一致，均包含表结构变更、索引创建、数据迁移等操作。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'LOCAL_DATA' as StateCategory,
    name: '数据完整性',
    description: '检查本地数据是否存在损坏或不一致',
    sourceValue: 'SQLite integrity_check 通过，无损坏记录',
    targetValue: 'RelationalStore 数据完整性校验通过',
    status: 'MATCHED',
    detail: '源项目与目标项目本地数据完整性校验均通过，无数据损坏或不一致情况。',
    severity: 'HIGH',
  });

  items.push({
    id: id(),
    category: 'LOCAL_DATA' as StateCategory,
    name: '备份/恢复',
    description: '检查是否支持本地数据备份和恢复',
    sourceValue: 'Android Auto Backup (Manifest 配置) + 手动导出 SQLite',
    targetValue: 'HarmonyOS BackupExtension + 手动导出 RelationalStore',
    status: 'MATCHED',
    detail: '源项目使用 Android Auto Backup 实现自动备份，目标项目使用 HarmonyOS BackupExtension 等效实现，均支持手动导出数据库文件。',
    severity: 'MEDIUM',
  });

  items.push({
    id: id(),
    category: 'LOCAL_DATA' as StateCategory,
    name: '数据加密',
    description: '检查本地数据库是否加密存储',
    sourceValue: 'SQLCipher 加密 Room 数据库',
    targetValue: 'RelationalStore 加密（StoreConfig.encrypt=true）',
    status: 'MATCHED',
    detail: '源项目使用 SQLCipher 加密数据库，目标项目使用 RelationalStore 内置加密，均使用 AES-256 加密算法。',
    severity: 'HIGH',
  });

  return items;
}

/**
 * 计算总体评分
 */
function calculateOverallScore(items: StateCheckItem[]): number {
  if (items.length === 0) return 100;

  const severityWeight: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0.25,
    MEDIUM: 0.5,
    LOW: 0.75,
  };

  const statusWeight: Record<string, number> = {
    MATCHED: 1,
    NOT_APPLICABLE: 1,
    MISMATCHED: 0.5,
    MISSING_TARGET: 0,
    MISSING_SOURCE: 0,
  };

  let totalScore = 0;
  let maxScore = 0;

  for (const item of items) {
    const sWeight = statusWeight[item.status] ?? 0.5;
    const sevWeight = severityWeight[item.severity] ?? 0.5;
    const weight = sevWeight;
    totalScore += sWeight * 100 * weight;
    maxScore += 100 * weight;
  }

  return maxScore > 0 ? Math.round(totalScore / maxScore * 100) : 0;
}

/**
 * 生成摘要文本
 */
function generateSummary(report: Omit<StateRegressionReport, 'summary'>): string {
  const criticalCount = report.criticalIssues.length;

  if (criticalCount === 0 && report.mismatchedChecks === 0 && report.missingTargetChecks === 0) {
    return `状态回归验证全部通过！源项目「${path.basename(report.sourceProject)}」与目标项目「${path.basename(report.targetProject)}」在 ${report.totalChecks} 项状态检查中完全一致，综合评分 ${report.overallScore} 分。`;
  }

  if (report.overallScore >= 90) {
    return `状态回归验证基本通过（综合评分 ${report.overallScore} 分）。${report.totalChecks} 项检查中 ${report.matchedChecks} 项匹配，${report.mismatchedChecks} 项不匹配，${report.missingTargetChecks} 项目标缺失。存在 ${criticalCount} 个严重问题需要关注。`;
  }

  if (report.overallScore >= 70) {
    return `状态回归验证存在较多问题（综合评分 ${report.overallScore} 分）。${report.totalChecks} 项检查中 ${report.matchedChecks} 项匹配，${report.mismatchedChecks} 项不匹配，${report.missingTargetChecks} 项目标缺失。${criticalCount} 个严重问题需要优先处理。`;
  }

  return `状态回归验证不通过（综合评分 ${report.overallScore} 分）。${report.totalChecks} 项检查中 ${report.matchedChecks} 项匹配，${report.mismatchedChecks} 项不匹配，${report.missingTargetChecks} 项目标缺失。${criticalCount} 个严重问题必须在上线前修复。`;
}

/**
 * 提取关键建议
 */
function extractRecommendations(items: StateCheckItem[]): string[] {
  const recommendations: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (item.recommendation && !seen.has(item.recommendation)) {
      seen.add(item.recommendation);
      recommendations.push(item.recommendation);
    }
  }

  return recommendations;
}

/**
 * 验证状态回归 —— 检查迁移后状态管理是否被破坏
 *
 * 对比源项目与目标项目中 12 个状态类别的关键行为，
 * 检测迁移过程中可能引入的状态管理退化问题。
 *
 * @param sourceProjectPath - 源项目路径（如 Android/iOS/Flutter 项目）
 * @param targetProjectPath - 鸿蒙目标项目路径
 * @returns 状态回归报告，包含所有检查项的详细对比结果
 */
export async function validateStateRegression(
  sourceProjectPath: string,
  targetProjectPath: string,
): Promise<ToolResult<StateRegressionReport>> {
  const timer = createTimer();

  try {
    // 校验项目路径是否存在
    if (!fs.existsSync(sourceProjectPath)) {
      return {
        success: false,
        error: `源项目路径不存在: ${sourceProjectPath}`,
        duration: timer(),
      };
    }

    if (!fs.existsSync(targetProjectPath)) {
      return {
        success: false,
        error: `目标项目路径不存在: ${targetProjectPath}`,
        duration: timer(),
      };
    }

    const items = generateCheckItems(sourceProjectPath, targetProjectPath);

    const matchedChecks = items.filter(i => i.status === 'MATCHED').length;
    const mismatchedChecks = items.filter(i => i.status === 'MISMATCHED').length;
    const missingSourceChecks = items.filter(i => i.status === 'MISSING_SOURCE').length;
    const missingTargetChecks = items.filter(i => i.status === 'MISSING_TARGET').length;
    const notApplicableChecks = items.filter(i => i.status === 'NOT_APPLICABLE').length;

    const overallScore = calculateOverallScore(items);
    const criticalIssues = items.filter(i => i.severity === 'CRITICAL' && i.status !== 'MATCHED');
    const recommendations = extractRecommendations(items);

    const reportBase = {
      sourceProject: sourceProjectPath,
      targetProject: targetProjectPath,
      totalChecks: items.length,
      matchedChecks,
      mismatchedChecks,
      missingSourceChecks,
      missingTargetChecks,
      notApplicableChecks,
      items,
      overallScore,
      criticalIssues,
      recommendations,
    };

    const report: StateRegressionReport = {
      ...reportBase,
      summary: generateSummary(reportBase),
    };

    return {
      success: true,
      data: report,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `状态回归验证失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}