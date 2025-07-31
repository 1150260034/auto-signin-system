import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'

interface Account {
  id: number
  name: string
  platform: string
  enabled: boolean
  lastSigninAt?: string
  status?: 'success' | 'failed' | 'pending'
}

interface SigninResult {
  accountId: number
  accountName: string
  success: boolean
  message: string
  executionTime: number
}

interface SigninStats {
  totalAccounts: number
  enabledAccounts: number
  disabledAccounts: number
  total: number
  success: number
  failed: number
  successRate: number
  lastSigninTime?: string
}

const SigninExecutor: React.FC = () => {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stats, setStats] = useState<SigninStats | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<SigninResult[]>([])
  const [progress, setProgress] = useState(0)
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])

  // 获取账号列表
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.data || [])
      }
    } catch (error) {
      console.error('获取账号列表失败:', error)
    }
  }

  // 获取签到统计
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/signin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取签到统计失败:', error)
    }
  }

  // 执行所有账号签到
  const executeAllSignin = async () => {
    setIsExecuting(true)
    setExecutionResults([])
    setProgress(0)

    try {
      const response = await fetch('/api/signin/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExecutionResults(data.data.results || [])
        setProgress(100)
        
        toast({
          title: "签到完成",
          description: `成功: ${data.data.summary.success}, 失败: ${data.data.summary.fail}`,
        })
      } else {
        throw new Error('签到执行失败')
      }
    } catch (error) {
      console.error('执行签到失败:', error)
      toast({
        title: "签到失败",
        description: "执行签到时发生错误",
        variant: "destructive"
      })
    } finally {
      setIsExecuting(false)
      fetchStats()
      fetchAccounts()
    }
  }

  // 执行单个账号签到
  const executeAccountSignin = async (accountId: number) => {
    try {
      const response = await fetch(`/api/signin/execute/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "签到完成",
          description: `${data.data.accountName}: ${data.data.message}`,
          variant: data.data.success ? "default" : "destructive"
        })
        
        // 更新结果列表
        setExecutionResults(prev => {
          const filtered = prev.filter(r => r.accountId !== accountId)
          return [...filtered, data.data]
        })
      } else {
        throw new Error('签到执行失败')
      }
    } catch (error) {
      console.error('执行账号签到失败:', error)
      toast({
        title: "签到失败",
        description: "执行签到时发生错误",
        variant: "destructive"
      })
    } finally {
      fetchStats()
      fetchAccounts()
    }
  }

  // 批量执行选中账号签到
  const executeBatchSignin = async () => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "请选择账号",
        description: "请至少选择一个账号进行签到",
        variant: "destructive"
      })
      return
    }

    setIsExecuting(true)
    setExecutionResults([])
    setProgress(0)

    try {
      const response = await fetch('/api/signin/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountIds: selectedAccounts })
      })

      if (response.ok) {
        const data = await response.json()
        setExecutionResults(data.data.results || [])
        setProgress(100)
        
        toast({
          title: "批量签到完成",
          description: `成功: ${data.data.summary.success}, 失败: ${data.data.summary.fail}`,
        })
      } else {
        throw new Error('批量签到执行失败')
      }
    } catch (error) {
      console.error('执行批量签到失败:', error)
      toast({
        title: "批量签到失败",
        description: "执行批量签到时发生错误",
        variant: "destructive"
      })
    } finally {
      setIsExecuting(false)
      setSelectedAccounts([])
      fetchStats()
      fetchAccounts()
    }
  }

  // 测试账号连接
  const testAccountConnection = async (accountId: number) => {
    try {
      const response = await fetch(`/api/signin/test/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const result = data.data
        toast({
          title: "连接测试完成",
          description: `状态: ${result.status} ${result.statusText}, 耗时: ${result.executionTime}ms`,
          variant: result.success ? "default" : "destructive"
        })
      } else {
        throw new Error('连接测试失败')
      }
    } catch (error) {
      console.error('测试账号连接失败:', error)
      toast({
        title: "连接测试失败",
        description: "测试连接时发生错误",
        variant: "destructive"
      })
    }
  }

  // 切换账号选择
  const toggleAccountSelection = (accountId: number) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    const enabledAccountIds = accounts.filter(acc => acc.enabled).map(acc => acc.id)
    setSelectedAccounts(prev => 
      prev.length === enabledAccountIds.length ? [] : enabledAccountIds
    )
  }

  useEffect(() => {
    fetchAccounts()
    fetchStats()
  }, [])

  const enabledAccounts = accounts.filter(acc => acc.enabled)

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总账号数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAccounts}</div>
              <p className="text-xs text-muted-foreground">
                启用: {stats.enabledAccounts} | 禁用: {stats.disabledAccounts}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">签到记录</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                成功: {stats.success} | 失败: {stats.failed}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <Progress value={stats.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最后签到</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.lastSigninTime 
                  ? new Date(stats.lastSigninTime).toLocaleString()
                  : '暂无记录'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 执行控制 */}
      <Card>
        <CardHeader>
          <CardTitle>签到执行</CardTitle>
          <CardDescription>
            执行账号签到任务，支持单个执行、批量执行和全部执行
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={executeAllSignin}
              disabled={isExecuting || enabledAccounts.length === 0}
              className="flex items-center gap-2"
            >
              {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              执行所有账号签到
            </Button>

            <Button 
              variant="outline"
              onClick={executeBatchSignin}
              disabled={isExecuting || selectedAccounts.length === 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              执行选中账号 ({selectedAccounts.length})
            </Button>

            <Button 
              variant="outline"
              onClick={toggleSelectAll}
              disabled={enabledAccounts.length === 0}
            >
              {selectedAccounts.length === enabledAccounts.length ? '取消全选' : '全选'}
            </Button>

            <Button 
              variant="outline"
              onClick={() => {
                fetchAccounts()
                fetchStats()
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </div>

          {isExecuting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>执行进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 账号列表 */}
      <Card>
        <CardHeader>
          <CardTitle>账号列表</CardTitle>
          <CardDescription>
            管理和执行各个账号的签到任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无账号，请先添加账号
              </div>
            ) : (
              accounts.map((account) => {
                const result = executionResults.find(r => r.accountId === account.id)
                const isSelected = selectedAccounts.includes(account.id)
                
                return (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {account.enabled && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAccountSelection(account.id)}
                          className="rounded"
                        />
                      )}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.name}</span>
                          <Badge variant={account.enabled ? "default" : "secondary"}>
                            {account.enabled ? '启用' : '禁用'}
                          </Badge>
                          {result && (
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? '成功' : '失败'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.platform}
                          {account.lastSigninAt && (
                            <span className="ml-2">
                              最后签到: {new Date(account.lastSigninAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {result && (
                          <div className="text-sm text-muted-foreground">
                            {result.message} (耗时: {result.executionTime}ms)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testAccountConnection(account.id)}
                        disabled={!account.enabled}
                        className="flex items-center gap-1"
                      >
                        <Activity className="h-3 w-3" />
                        测试
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => executeAccountSignin(account.id)}
                        disabled={!account.enabled || isExecuting}
                        className="flex items-center gap-1"
                      >
                        {result?.success ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : result?.success === false ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        签到
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SigninExecutor