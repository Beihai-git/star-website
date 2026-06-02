# 🐍 Snake Arena — 贪吃蛇竞技场

经典贪吃蛇网页游戏，具备完整的商业化功能：
- 🎮 3 种游戏模式（经典、限时挑战、迷宫）
- 🎨 8 套皮肤主题（3 免费 + 5 高级）
- 💰 Lemon Squeezy 支付集成（$2.99 一次性购买）
- 🌐 中英文双语
- 📱 移动端触控 + PWA 可安装到桌面
- 🔊 音效系统（Web Audio API，无需文件）
- 🔑 License Key 验证系统

---

## 🚀 快速部署（5 分钟免费上线）

### 方式一：Vercel（推荐）

1. 注册 [GitHub](https://github.com) 账号
2. 创建一个新仓库，上传本项目所有文件
3. 访问 [Vercel.com](https://vercel.com) → 用 GitHub 登录
4. 点击 "Import Project" → 选择你的仓库 → 一键部署
5. 获得免费域名：`https://你的项目名.vercel.app`

### 方式二：Cloudflare Pages

1. 注册 [Cloudflare](https://cloudflare.com) 账号
2. Workers & Pages → Create → Pages → Upload assets
3. 拖拽整个项目文件夹上传
4. 获得免费域名：`https://你的项目名.pages.dev`

### 方式三：GitHub Pages

1. 在 GitHub 创建仓库
2. Settings → Pages → Source: main branch → Save
3. 访问 `https://你的用户名.github.io/仓库名`

---

## 💰 支付设置：Lemon Squeezy → PayPal → 银联

### 第一步：注册 Lemon Squeezy
1. 访问 [lemonsqueezy.com](https://lemonsqueezy.com) → Sign Up
2. 填写个人信息（建议用拼音真实姓名，与 PayPal 一致）
3. Settings → Store → 创建你的店铺

### 第二步：创建产品
1. Products → New Product
2. Name: `Snake Arena Premium — Ad-Free Edition`
3. Price: `$2.99` USD
4. Type: Digital product
5. **重要：** 在 Product Settings 中开启 **License Keys**
6. 复制产品的购买链接

### 第三步：修改支付链接
打开 `js/payment.js`，替换第 14 行的链接：
```javascript
const LEMON_SQUEEZY_URL = 'https://你的店铺.lemonsqueezy.com/buy/你的产品ID';
```

### 第四步：绑定 PayPal 提现
1. 注册 [PayPal 中国账户](https://paypal.com)（选择国家：中国）
2. 完成实名认证（上传身份证）
3. 在 PayPal 中绑定你的银联银行卡
4. 在 Lemon Squeezy → Settings → Payouts → 连接 PayPal

### 第五步：美元 → 人民币 提现流程
```
客户支付（美元 $2.99）
    ↓
Lemon Squeezy（扣除 5% + $0.50 手续费）
    ↓
每月 1 日和 15 日自动打款到 PayPal（最低 $10 起付）
    ↓
PayPal 余额（美元）
    ↓  点击"提现到银行"
    ↓  PayPal 自动转换美元→人民币（汇率 + ~2.5%）
    ↓  1-3 个工作日
    ↓
你的银联银行卡（人民币到账 ✨）
```

> 💡 **省钱技巧**：攒到 $150+ 再提现，PayPal 免提现手续费

---

## 📱 手机查看收益

| 方式 | 说明 |
|------|------|
| **Lemon Squeezy 后台** | 手机浏览器打开 [app.lemonsqueezy.com](https://app.lemonsqueezy.com)，实时看每笔订单 |
| **PayPal App** | App Store/应用商店搜 PayPal，下载后绑定账户，余额变动即时通知 |
| **银行 App** | 你的银联卡所属银行的 App（如招商银行、工商银行），人民币到账时推送通知 |
| **邮件通知** | Lemon Squeezy 每笔销售都会发邮件，手机邮箱 App 秒推送 |

---

## 🔑 测试 License Key

在开发测试阶段，可以使用以下 Demo Key 解锁高级功能：
```
DEMO-KEY1-XXXX-XXXX
```

⚠️ **生产环境务必替换**：在上线前，删除 `js/payment.js` 中的 Demo Key，启用 Lemon Squeezy API 验证（详见 `js/license.js` 中的注释）。

---

## 🛠️ 自定义配置

### 修改价格
- 在 Lemon Squeezy 后台修改产品价格
- 修改 `js/payment.js` 和 `index.html` 中的价格显示文字（搜索 `$2.99` 替换）

### 添加自定义皮肤
- 编辑 `js/themes.js`，按照现有格式添加新主题
- 设置 `isPremium: true` 则为付费皮肤

### 修改游戏参数
- 初始速度、最高分存储键等：在 `js/game.js` 构造函数中调整

---

## 📂 项目结构

```
snake-game-website/
├── index.html              # 主页面
├── manifest.json           # PWA 配置
├── README.md               # 本文件
├── css/
│   └── style.css           # 全部样式
└── js/
    ├── game.js             # 游戏引擎（核心）
    ├── ui.js               # UI 管理器
    ├── i18n.js             # 中英文翻译
    ├── themes.js           # 8 套皮肤定义
    ├── audio.js            # 音效系统
    ├── license.js          # License 验证
    └── payment.js          # Lemon Squeezy 支付
```

---

## 📄 License

本项目代码仅供学习和个人商业使用。请勿将代码直接转售到 CodeCanyon 等代码市场（平台会检测重复）。
