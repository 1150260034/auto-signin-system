import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Download, Filter, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SigninLog {
  id: number;
  accountId: number;
  accountName: string;
  success: boolean;
  message: string;
  responseData?: string;
  statusCode?: number;
  createdAt: string;
}

interface SystemLog {
  id: number;
  level: string;
  message: string;
  meta?: string;
  createdAt: string;
}

interface LogStats {
  signinLogs: {
    total: number;
    success: number;
    failed: number;
  };
  systemLogs: {
    total: number;
    errors: number;
  };
}

export default function SigninLogsApi() {
  const [signinLogs, setSigninLogs] = useState<SigninLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    signinLogs: { total: 0, success: 0, failed: 0 },
    systemLogs: { total: 0, errors: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  // 筛选条件
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [activeTab, statusFilter, levelFilter, dateFilter, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      // 添加筛选条件
      if (statusFilter !== 'all' && activeTab === 'signin') {
        params.append('success', statusFilter === 'success' ? 'true' : 'false');
      }
      
      if (levelFilter !== 'all' && activeTab === 'system') {
        params.append('level', levelFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = '';
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
        
        if (startDate) {
          params.append('startDate', startDate);
        }
      }

      const endpoint = activeTab === 'signin' ? '/api/logs/signin' : '/api/logs/system';
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      if (data.success) {
        if (activeTab === 'signin') {
          setSigninLogs(data.data.logs || []);
        } else {
          setSystemLogs(data.data.logs || []);
        }
      } else {
        throw new Error(data.message || '获取日志失败');
      }
    } catch (error) {
      console.error('获取日志失败:', error);
      toast({
        title: "错误",
        description: "获取日志失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/logs/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const exportLogs = async (type: string, format: string = 'csv') => {
    try {
      const response = await fetch(`/api/logs/export?type=${type}&format=${format}`);
      
      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "成功",
        description: "日志导出成功",
      });
    } catch (error) {
      console.error('导出日志失败:', error);
      toast({
        title: "错误",
        description: "导出日志失败",
        variant: "destructive",
      });
    }
  };

  const clearLogs = async (type: string) => {
    if (!confirm(`确定要清空${type === 'signin' ? '签到' : '系统'}日志吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/logs/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchLogs();
        await fetchStats();
        toast({
          title: "成功",
          description: "日志已清空",
        });
      } else {
        throw new Error(data.message || '清空日志失败');
      }
    } catch (error) {
      console.error('清空日志失败:', error);
      toast({
        title: "错误",
        description: "清空日志失败",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge variant="default" className="bg-green-500">成功</Badge> : 
      <Badge variant="destructive">失败</Badge>;
  };

  const getLevelBadge = (level: string) => {
    const levelColors = {
      error: 'destructive',
      warn: 'secondary',
      info: 'default',
      debug: 'outline'
    } as const;

    return (
      <Badge variant={levelColors[level as keyof typeof levelColors] || 'outline'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  const filteredSigninLogs = signinLogs.filter(log => {
    if (searchTerm) {
      return log.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             log.message.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const filteredSystemLogs = systemLogs.filter(log => {
    if (searchTerm) {
      return log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (log.meta && log.meta.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">系统日志</h2>
          <p className="text-gray-600">查看和管理签到执行记录与系统运行日志</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" onClick={() => exportLogs(activeTab)}>
            <Download className="h-4 w-4 mr-2" />
            导出日志
          </Button>
          <Button 
            variant="outline" 
            onClick={() => clearLogs(activeTab)} 
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清空日志
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">签到总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signinLogs.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">签到成功</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.signinLogs.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">签到失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.signinLogs.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.signinLogs.total > 0 
                ? Math.round((stats.signinLogs.success / stats.signinLogs.total) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索账号、消息..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {activeTab === 'signin' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">状态</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">级别</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="error">错误</SelectItem>
                    <SelectItem value="warn">警告</SelectItem>
                    <SelectItem value="info">信息</SelectItem>
                    <SelectItem value="debug">调试</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">时间范围</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">最近7天</SelectItem>
                  <SelectItem value="month">最近30天</SelectItem>
                  <SelectItem value="all">全部时间</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">操作</label>
              <Button onClick={() => {
                setCurrentPage(1);
                fetchLogs();
              }} className="w-full" disabled={loading}>
                {loading ? '搜索中...' : '应用筛选'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">签到日志</TabsTrigger>
          <TabsTrigger value="system">系统日志</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">签到执行记录</CardTitle>
              <CardDescription>
                显示 {filteredSigninLogs.length} 条记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">加载中...</span>
                </div>
              ) : filteredSigninLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无签到记录</h3>
                  <p className="text-gray-500">还没有执行过签到任务</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>状态</TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead>账号</TableHead>
                        <TableHead>消息</TableHead>
                        <TableHead>状态码</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSigninLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(log.success)}
                              {getStatusBadge(log.success)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.accountName}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={log.message}>
                            {log.message}
                          </TableCell>
                          <TableCell>
                            {log.statusCode || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">系统运行日志</CardTitle>
              <CardDescription>
                显示 {filteredSystemLogs.length} 条记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">加载中...</span>
                </div>
              ) : filteredSystemLogs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无系统日志</h3>
                  <p className="text-gray-500">系统运行正常，暂无日志记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>级别</TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead>消息</TableHead>
                        <TableHead>详情</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSystemLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {getLevelBadge(log.level)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell className="max-w-md truncate" title={log.message}>
                            {log.message}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={log.meta}>
                            {log.meta || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}