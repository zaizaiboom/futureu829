# Vercel 部署指南

## 环境变量配置

在 Vercel 部署时，您需要在 Vercel 项目设置中配置以下环境变量：

### 1. 登录 Vercel Dashboard
访问 [vercel.com](https://vercel.com) 并登录您的账户。

### 2. 选择项目
在 Dashboard 中找到您的项目 `futureuyifanweng827`。

### 3. 进入项目设置
点击项目名称，然后点击 "Settings" 标签页。

### 4. 配置环境变量
在左侧菜单中点击 "Environment Variables"，然后添加以下变量：

#### Supabase 配置
```
SUPABASE_URL=https://jxsewcsxhiycofydtxhi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2V3Y3N4aGl5Y29meWR0eGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTQ2NDcsImV4cCI6MjA2OTk3MDY0N30.yZmvdpVY3HkcHo0AANySLpUgyNsl0M6PUnEYnprJrcs
NEXT_PUBLIC_SUPABASE_URL=https://jxsewcsxhiycofydtxhi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2V3Y3N4aGl5Y29meWR0eGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTQ2NDcsImV4cCI6MjA2OTk3MDY0N30.yZmvdpVY3HkcHo0AANySLpUgyNsl0M6PUnEYnprJrcs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2V3Y3N4aGl5Y29meWR0eGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5NDY0NywiZXhwIjoyMDY5OTcwNjQ3fQ.u7lqk_b5lAg9hiruiYzU3g-qSLnfu2Ox-F4v7q4Zotg
```

#### AI 服务配置
```
SILICONFLOW_API_KEY=sk-mtzvyhfjpredyerzicdnezarhehnvnsmdjciltaghljfiluk
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

#### 站点配置
```
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-vercel-domain.vercel.app/auth/callback
```

**注意：** 将 `your-vercel-domain` 替换为您的实际 Vercel 域名。

### 5. 环境设置
对于每个环境变量，确保选择适当的环境：
- **Production**: 生产环境
- **Preview**: 预览环境（可选）
- **Development**: 开发环境（可选）

### 6. 重新部署
配置完环境变量后，触发一次新的部署：
1. 在项目页面点击 "Deployments" 标签
2. 点击最新部署旁边的三个点
3. 选择 "Redeploy"

## 常见问题

### 1. 构建失败
如果构建仍然失败，检查：
- 所有环境变量是否正确配置
- API 密钥是否有效
- Supabase 项目是否正常运行

### 2. 认证回调问题
确保在 Supabase 项目设置中添加了 Vercel 域名到允许的重定向 URL 列表。

### 3. API 调用失败
检查 CORS 设置和 API 端点配置。

## 部署后验证

部署成功后，访问您的 Vercel 应用并测试：
1. 用户注册/登录功能
2. 面试练习功能
3. AI 评估功能
4. 数据库连接

如果遇到问题，请检查 Vercel 的部署日志和浏览器控制台错误信息。