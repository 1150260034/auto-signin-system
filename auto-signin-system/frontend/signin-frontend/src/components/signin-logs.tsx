import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Search, Download, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SigninLog {
  id: string;
  accountName: string;
  platform: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
  timestamp: string;
  duration: number;
  taskName: string;
}

export default function SigninLogs() {
  const [logs, setLogs] = useState<SigninLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SigninLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, statusFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockLogs: SigninLog[] = [
        {
          id: '1',
          accountName: '用户A',
          platform: '微博',
          status: 'success',
          message: '签到成功，获得积分 +10',
          timestamp: '2024-01-15 09:00:15',
          duration: 1.2,
          taskName: '微博每日签到'
        },
        {
          id: '2',
          accountName: '用户B',
          platform: '贴吧',
          status: 'failed',
          message: 'Cookie已过期，请重新获取',
          timestamp: '2024-01-15 08:00:30',
          duration: 0.8,
          taskName: '贴吧签到任务'
        },
        {
          id: '3',
          accountName: '用户C',
          platform: '知乎',
          status: 'success',
          message: '签到成功',
          timestamp: '2024-01-15 10:00:05',
          duration: 2.1,
          taskName: '知乎日常签到'
        },
        {
          id: '4',
          accountName: '用户A',
          platform: '微博',
          status: 'pending',
          message: '正在执行签到...',
          timestamp: '2024-01-15 11:00:00',
          duration: 0,
          taskName: '微博每日签到'
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('获取日志失败:', error);
      toast({
        title: "错误",
        description: "获取签到日志失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // 日期过滤
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= today;
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= weekAgo;
      });
    }

    setFilteredLogs(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500">执行中</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        ['时间', '账号', '平台', '任务', '状态', '消息', '耗时(秒)'].join(','),
        ...filteredLogs.map(log => [
          log.timestamp,
          log.accountName,
          log.platform,
          log.taskName,
          log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : '执行中',
          `"${log.message}"`,
          log.duration.toString()
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `signin-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "成功",
        description: "日志导出成功",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "导出日志失败",
        variant: "destructive",
      });
    }
  };

  const clearLogs = async () => {
    try {
      setLogs([]);
      toast({
        title: "成功",
        description: "日志已清空",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "清空日志失败",
        variant: "destructive",
      });
    }
  };

  const getStats = () => {
    const total = filteredLogs.length;
    const success = filteredLogs.filter(log => log.status === 'success').length;
    const failed = filteredLogs.filter(log => log.status === 'failed').length;
    const pending = filteredLogs.filter(log => log.status === 'pending').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return { total, success, failed, pending, successRate };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">签到日志</h2>
          <p className="text-gray-600">查看和管理自动签到的执行记录</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            导出日志
          </Button>
          <Button variant="outline" onClick={clearLogs} className="text-red-600 hover:text-red-700">
            清空日志
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总记录数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">成功</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
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
                  placeholder="搜索账号、平台或消息..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
                  <SelectItem value="pending">执行中</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Button onClick={fetchLogs} className="w-full" disabled={loading}>
                {loading ? '刷新中...' : '刷新日志'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">执行记录</CardTitle>
          <CardDescription>
            显示 {filteredLogs.length} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无日志记录</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? '没有符合筛选条件的记录' 
                  : '还没有执行过签到任务'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>账号</TableHead>
                    <TableHead>平台</TableHead>
                    <TableHead>任务</TableHead>
                    <TableHead>消息</TableHead>
                    <TableHead>耗时</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.accountName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.platform}</Badge>
                      </TableCell>
                      <TableCell>{log.taskName}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell>
                        {log.duration > 0 ? `${log.duration}s` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}