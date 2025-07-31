import React, { useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  Activity, 
  FileText, 
  Settings,
  CheckCircle
} from 'lucide-react'
import AccountManager from './components/account-manager'
import TaskScheduler from './components/task-scheduler'
import SigninLogs from './components/signin-logs'
import SystemSettings from './components/system-settings'

function App() {
  const [activeTab, setActiveTab] = useState('accounts')

  const stats = {
    totalAccounts: 5,
    activeAccounts: 3,
    todaySignins: 12,
    successRate: 95
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="signin-ui-theme">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-blue-600">自动签到管理系统</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  系统运行中
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总账号数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAccounts}</div>
                <p className="text-xs text-muted-foreground">
                  活跃账号 {stats.activeAccounts} 个
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今日签到</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todaySignins}</div>
                <p className="text-xs text-muted-foreground">
                  成功率 {stats.successRate}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">定时任务</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  2 个运行中
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系统状态</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">正常</div>
                <p className="text-xs text-muted-foreground">
                  运行时间 2天3小时
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                账号管理
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                定时任务
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                签到日志
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                系统设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-6">
              <AccountManager />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <TaskScheduler />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <SigninLogs />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}

export default App