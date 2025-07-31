import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  TestTube,
  RefreshCw,
  Loader2
} from 'lucide-react'

interface Account {
  id: string
  name: string
  description?: string
  signinUrl: string
  method: string
  cookies: string
  headers?: string
  requestBody?: string
  successKeyword?: string
  enabled: boolean
  lastSigninAt?: string
  lastSigninStatus?: string
  createdAt: string
  updatedAt?: string
}

// API 基础URL
const API_BASE_URL = 'http://localhost:3001/api'

const AccountManagerAPI: React.FC = () => {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showCookie, setShowCookie] = useState<{ [key: string]: boolean }>({})
  const [testingAccount, setTestingAccount] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    signinUrl: '',
    method: 'POST',
    cookies: '',
    headers: '',
    requestBody: '',
    successKeyword: '',
    enabled: true
  })

  // 获取所有账号
  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/accounts`)
      const result = await response.json()
      
      if (result.success) {
        setAccounts(result.data)
      } else {
        throw new Error(result.message || '获取账号列表失败')
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || '获取账号列表失败',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 添加账号
  const handleAddAccount = async () => {
    if (!formData.name || !formData.signinUrl || !formData.cookies) {
      toast({
        title: "错误",
        description: "账号名称、签到地址和Cookie为必填项",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAccounts()
        setFormData({
          name: '',
          description: '',
          signinUrl: '',
          method: 'POST',
          cookies: '',
          headers: '',
          requestBody: '',
          successKeyword: '',
          enabled: true
        })
        setIsAddDialogOpen(false)
        
        toast({
          title: "成功",
          description: "账号添加成功",
        })
      } else {
        throw new Error(result.message || '添加账号失败')
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || '添加账号失败',
        variant: "destructive",
      })
    }
  }

  // 更新账号
  const handleUpdateAccount = async () => {
    if (!editingAccount) return

    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAccounts()
        setEditingAccount(null)
        setFormData({
          name: '',
          description: '',
          signinUrl: '',
          method: 'POST',
          cookies: '',
          headers: '',
          requestBody: '',
          successKeyword: '',
          enabled: true
        })
        
        toast({
          title: "成功",
          description: "账号更新成功",
        })
      } else {
        throw new Error(result.message || '更新账号失败')
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || '更新账号失败',
        variant: "destructive",
      })
    }
  }

  // 删除账号
  const handleDeleteAccount = async (id: string) => {
    if (!confirm('确定要删除这个账号吗？此操作不可恢复。')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAccounts()
        toast({
          title: "成功",
          description: "账号删除成功",
        })
      } else {
        throw new Error(result.message || '删除账号失败')
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || '删除账号失败',
        variant: "destructive",
      })
    }
  }

  // 测试账号连接
  const handleTestAccount = async (id: string) => {
    try {
      setTestingAccount(id)
      const response = await fetch(`${API_BASE_URL}/accounts/${id}/test`, {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (result.success) {
        const { data } = result
        toast({
          title: "连接测试成功",
          description: `状态: ${data.status} ${data.statusText}, 耗时: ${data.executionTime}ms`,
        })
      } else {
        toast({
          title: "连接测试失败",
          description: result.message || result.error || '测试失败',
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || '测试连接失败',
        variant: "destructive",
      })
    } finally {
      setTestingAccount(null)
    }
  }

  // 切换账号启用状态
  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAccounts()
      } else {
        throw new Error(result.message || '更新状态失败')
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || '更新状态失败',
        variant: "destructive",
      })
    }
  }

  // 编辑账号
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      description: account.description || '',
      signinUrl: account.signinUrl,
      method: account.method,
      cookies: account.cookies,
      headers: account.headers || '',
      requestBody: account.requestBody || '',
      successKeyword: account.successKeyword || '',
      enabled: account.enabled
    })
  }

  // 切换Cookie显示
  const toggleCookieVisibility = (id: string) => {
    setShowCookie(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "成功",
      description: "已复制到剪贴板",
    })
  }

  // 获取状态图标
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">成功</Badge>
      case 'failed':
        return <Badge variant="destructive">失败</Badge>
      default:
        return <Badge variant="secondary">待执行</Badge>
    }
  }

  // 格式化时间
  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleString('zh-CN')
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAccounts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">账号管理</h2>
          <p className="text-gray-600">管理您的签到账号信息和Cookie配置</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchAccounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加账号
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>添加新账号</DialogTitle>
                <DialogDescription>
                  请填写账号信息和从抓包工具获取的Cookie数据
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    账号名称 *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    placeholder="请输入账号名称"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    描述
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    placeholder="账号描述（可选）"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="signinUrl" className="text-right">
                    签到地址 *
                  </Label>
                  <Input
                    id="signinUrl"
                    value={formData.signinUrl}
                    onChange={(e) => setFormData({ ...formData, signinUrl: e.target.value })}
                    className="col-span-3"
                    placeholder="https://example.com/signin"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="method" className="text-right">
                    请求方法
                  </Label>
                  <select
                    id="method"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cookies" className="text-right">
                    Cookie *
                  </Label>
                  <Textarea
                    id="cookies"
                    value={formData.cookies}
                    onChange={(e) => setFormData({ ...formData, cookies: e.target.value })}
                    className="col-span-3"
                    placeholder="请粘贴从抓包工具获取的Cookie"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="headers" className="text-right">
                    请求头
                  </Label>
                  <Textarea
                    id="headers"
                    value={formData.headers}
                    onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                    className="col-span-3"
                    placeholder='JSON格式，如：{"User-Agent": "..."}'
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="requestBody" className="text-right">
                    请求体
                  </Label>
                  <Textarea
                    id="requestBody"
                    value={formData.requestBody}
                    onChange={(e) => setFormData({ ...formData, requestBody: e.target.value })}
                    className="col-span-3"
                    placeholder="POST请求的数据（可选）"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="successKeyword" className="text-right">
                    成功关键词
                  </Label>
                  <Input
                    id="successKeyword"
                    value={formData.successKeyword}
                    onChange={(e) => setFormData({ ...formData, successKeyword: e.target.value })}
                    className="col-span-3"
                    placeholder="判断签到成功的关键词（可选）"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="enabled" className="text-right">
                    启用状态
                  </Label>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddAccount}>
                  添加账号
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 账号列表 */}
      <Card>
        <CardHeader>
          <CardTitle>账号列表</CardTitle>
          <CardDescription>
            当前共有 {accounts.length} 个账号，其中 {accounts.filter(a => a.enabled).length} 个已启用
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号名称</TableHead>
                <TableHead>签到地址</TableHead>
                <TableHead>Cookie</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后签到</TableHead>
                <TableHead>启用</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{account.name}</div>
                      {account.description && (
                        <div className="text-xs text-gray-500">{account.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={account.signinUrl}>
                      {account.signinUrl}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                        {showCookie[account.id] 
                          ? account.cookies.substring(0, 50) + '...'
                          : '••••••••••••••••••••'
                        }
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCookieVisibility(account.id)}
                      >
                        {showCookie[account.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(account.cookies)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(account.lastSigninStatus)}
                      {getStatusBadge(account.lastSigninStatus)}
                    </div>
                  </TableCell>
                  <TableCell>{formatTime(account.lastSigninAt)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={account.enabled}
                      onCheckedChange={(checked) => handleToggleEnabled(account.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTestAccount(account.id)}>
                          {testingAccount === account.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="mr-2 h-4 w-4" />
                          )}
                          测试连接
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {accounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无账号数据，点击"添加账号"开始使用
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑账号对话框 */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑账号</DialogTitle>
            <DialogDescription>
              修改账号信息和Cookie配置
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                账号名称 *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                描述
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-signinUrl" className="text-right">
                签到地址 *
              </Label>
              <Input
                id="edit-signinUrl"
                value={formData.signinUrl}
                onChange={(e) => setFormData({ ...formData, signinUrl: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-method" className="text-right">
                请求方法
              </Label>
              <select
                id="edit-method"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cookies" className="text-right">
                Cookie *
              </Label>
              <Textarea
                id="edit-cookies"
                value={formData.cookies}
                onChange={(e) => setFormData({ ...formData, cookies: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-headers" className="text-right">
                请求头
              </Label>
              <Textarea
                id="edit-headers"
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-requestBody" className="text-right">
                请求体
              </Label>
              <Textarea
                id="edit-requestBody"
                value={formData.requestBody}
                onChange={(e) => setFormData({ ...formData, requestBody: e.target.value })}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-successKeyword" className="text-right">
                成功关键词
              </Label>
              <Input
                id="edit-successKeyword"
                value={formData.successKeyword}
                onChange={(e) => setFormData({ ...formData, successKeyword: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-enabled" className="text-right">
                启用状态
              </Label>
              <Switch
                id="edit-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateAccount}>
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AccountManagerAPI