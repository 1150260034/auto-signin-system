import React, { useState } from 'react'
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
  EyeOff
} from 'lucide-react'

interface Account {
  id: string
  name: string
  platform: string
  cookie: string
  headers: string
  isActive: boolean
  lastSignin: string
  status: 'success' | 'failed' | 'pending'
  createdAt: string
}

const AccountManager: React.FC = () => {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: '主账号',
      platform: '天涯明月刀',
      cookie: 'session_id=abc123; user_token=xyz789',
      headers: '{"User-Agent": "Mozilla/5.0..."}',
      isActive: true,
      lastSignin: '2024-01-15 09:00:00',
      status: 'success',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: '小号1',
      platform: '天涯明月刀',
      cookie: 'session_id=def456; user_token=uvw012',
      headers: '{"User-Agent": "Mozilla/5.0..."}',
      isActive: true,
      lastSignin: '2024-01-15 09:05:00',
      status: 'success',
      createdAt: '2024-01-02'
    },
    {
      id: '3',
      name: '测试账号',
      platform: '天涯明月刀',
      cookie: 'session_id=ghi789; user_token=rst345',
      headers: '{"User-Agent": "Mozilla/5.0..."}',
      isActive: false,
      lastSignin: '2024-01-14 09:00:00',
      status: 'failed',
      createdAt: '2024-01-03'
    }
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showCookie, setShowCookie] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    cookie: '',
    headers: '',
    isActive: true
  })

  const handleAddAccount = () => {
    if (!formData.name || !formData.platform || !formData.cookie) {
      toast({
        title: "错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      name: formData.name,
      platform: formData.platform,
      cookie: formData.cookie,
      headers: formData.headers,
      isActive: formData.isActive,
      lastSignin: '-',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    }

    setAccounts([...accounts, newAccount])
    setFormData({ name: '', platform: '', cookie: '', headers: '', isActive: true })
    setIsAddDialogOpen(false)
    
    toast({
      title: "成功",
      description: "账号添加成功",
    })
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      platform: account.platform,
      cookie: account.cookie,
      headers: account.headers,
      isActive: account.isActive
    })
  }

  const handleUpdateAccount = () => {
    if (!editingAccount) return

    const updatedAccounts = accounts.map(account =>
      account.id === editingAccount.id
        ? { ...account, ...formData }
        : account
    )

    setAccounts(updatedAccounts)
    setEditingAccount(null)
    setFormData({ name: '', platform: '', cookie: '', headers: '', isActive: true })
    
    toast({
      title: "成功",
      description: "账号更新成功",
    })
  }

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id))
    toast({
      title: "成功",
      description: "账号删除成功",
    })
  }

  const handleToggleActive = (id: string) => {
    const updatedAccounts = accounts.map(account =>
      account.id === id
        ? { ...account, isActive: !account.isActive }
        : account
    )
    setAccounts(updatedAccounts)
  }

  const toggleCookieVisibility = (id: string) => {
    setShowCookie(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "成功",
      description: "已复制到剪贴板",
    })
  }

  const getStatusIcon = (status: Account['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: Account['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">成功</Badge>
      case 'failed':
        return <Badge variant="destructive">失败</Badge>
      case 'pending':
        return <Badge variant="secondary">待执行</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">账号管理</h2>
          <p className="text-gray-600">管理您的签到账号信息和Cookie配置</p>
        </div>
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
                <Label htmlFor="platform" className="text-right">
                  平台名称 *
                </Label>
                <Input
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="col-span-3"
                  placeholder="如：天涯明月刀"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cookie" className="text-right">
                  Cookie *
                </Label>
                <Textarea
                  id="cookie"
                  value={formData.cookie}
                  onChange={(e) => setFormData({ ...formData, cookie: e.target.value })}
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
                  placeholder="JSON格式的请求头信息（可选）"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  启用状态
                </Label>
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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

      {/* 账号列表 */}
      <Card>
        <CardHeader>
          <CardTitle>账号列表</CardTitle>
          <CardDescription>
            当前共有 {accounts.length} 个账号，其中 {accounts.filter(a => a.isActive).length} 个已启用
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号名称</TableHead>
                <TableHead>平台</TableHead>
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
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.platform}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {showCookie[account.id] 
                          ? account.cookie.substring(0, 50) + '...'
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
                        onClick={() => copyToClipboard(account.cookie)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(account.status)}
                      {getStatusBadge(account.status)}
                    </div>
                  </TableCell>
                  <TableCell>{account.lastSignin}</TableCell>
                  <TableCell>
                    <Switch
                      checked={account.isActive}
                      onCheckedChange={() => handleToggleActive(account.id)}
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
              <Label htmlFor="edit-platform" className="text-right">
                平台名称 *
              </Label>
              <Input
                id="edit-platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cookie" className="text-right">
                Cookie *
              </Label>
              <Textarea
                id="edit-cookie"
                value={formData.cookie}
                onChange={(e) => setFormData({ ...formData, cookie: e.target.value })}
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
              <Label htmlFor="edit-active" className="text-right">
                启用状态
              </Label>
              <Switch
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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

export default AccountManager