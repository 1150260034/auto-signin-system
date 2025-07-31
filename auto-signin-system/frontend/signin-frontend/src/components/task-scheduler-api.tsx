import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Play, Pause, Settings, Plus, Edit, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

interface Account {
  id: string;
  name: string;
  platform: string;
  enabled: boolean;
}

interface TaskStats {
  total: number;
  enabled: number;
  disabled: number;
}

export default function TaskSchedulerApi() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, enabled: 0, disabled: 0 });
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    cronExpression: '0 9 * * *', // 默认每天9点
    enabled: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchAccounts();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data.tasks || []);
        setStats(data.data.stats || { total: 0, enabled: 0, disabled: 0 });
      } else {
        throw new Error(data.message || '获取任务列表失败');
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
      toast({
        title: "错误",
        description: "获取任务列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('获取账号列表失败:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.name || !newTask.cronExpression) {
      toast({
        title: "错误",
        description: "请填写完整的任务信息",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // 重新获取任务列表
        setNewTask({ name: '', cronExpression: '0 9 * * *', enabled: true });
        setShowAddDialog(false);
        
        toast({
          title: "成功",
          description: "任务创建成功",
        });
      } else {
        throw new Error(data.message || '创建任务失败');
      }
    } catch (error) {
      console.error('创建任务失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "创建任务失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // 重新获取任务列表
        toast({
          title: "成功",
          description: "任务更新成功",
        });
      } else {
        throw new Error(data.message || '更新任务失败');
      }
    } catch (error) {
      console.error('更新任务失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "更新任务失败",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const action = task.enabled ? 'stop' : 'start';
    
    try {
      const response = await fetch(`/api/tasks/${task.id}/${action}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // 重新获取任务列表
        toast({
          title: "成功",
          description: `任务已${task.enabled ? '停止' : '启动'}`,
        });
      } else {
        throw new Error(data.message || `${action === 'start' ? '启动' : '停止'}任务失败`);
      }
    } catch (error) {
      console.error('切换任务状态失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "操作失败",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // 重新获取任务列表
        toast({
          title: "成功",
          description: "任务已删除",
        });
      } else {
        throw new Error(data.message || '删除任务失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "删除任务失败",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (enabled: boolean) => {
    if (enabled) {
      return <Badge variant="default" className="bg-green-500">运行中</Badge>;
    } else {
      return <Badge variant="secondary">已暂停</Badge>;
    }
  };

  const formatSchedule = (cronExpression: string) => {
    // 简单的cron表达式解析
    const parts = cronExpression.split(' ');
    if (parts.length >= 5) {
      const [minute, hour] = parts;
      if (hour === '*') return '每小时执行';
      return `每天 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    return cronExpression;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '未执行';
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  const cronOptions = [
    { value: '0 8 * * *', label: '每天 08:00' },
    { value: '0 9 * * *', label: '每天 09:00' },
    { value: '0 10 * * *', label: '每天 10:00' },
    { value: '0 12 * * *', label: '每天 12:00' },
    { value: '0 18 * * *', label: '每天 18:00' },
    { value: '0 20 * * *', label: '每天 20:00' },
    { value: '0 */2 * * *', label: '每2小时执行' },
    { value: '0 */6 * * *', label: '每6小时执行' },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">定时任务管理</h2>
          <p className="text-gray-600">管理自动签到的定时任务调度</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchTasks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建任务
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新任务</DialogTitle>
                <DialogDescription>
                  创建一个新的定时签到任务
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-name">任务名称</Label>
                  <Input
                    id="task-name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="输入任务名称，如：每日自动签到"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">执行时间</Label>
                  <Select 
                    value={newTask.cronExpression} 
                    onValueChange={(value) => setNewTask({ ...newTask, cronExpression: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cronOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="task-enabled"
                    checked={newTask.enabled}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, enabled: checked })}
                  />
                  <Label htmlFor="task-enabled">创建后立即启用</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAddTask}>创建任务</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 任务统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">运行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已暂停</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.disabled}</div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">加载中...</span>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无定时任务</h3>
              <p className="text-gray-500 text-center mb-4">
                创建您的第一个自动签到定时任务
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新建任务
              </Button>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                      <CardDescription>
                        执行时间: {formatSchedule(task.cronExpression)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(task.enabled)}
                    <Switch
                      checked={task.enabled}
                      onCheckedChange={() => toggleTaskStatus(task)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">上次执行:</span> {formatDateTime(task.lastRun)}
                    </div>
                    <div>
                      <span className="font-medium">下次执行:</span> {
                        task.enabled ? formatDateTime(task.nextRun) : '已暂停'
                      }
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingTask(task);
                        setNewTask({
                          name: task.name,
                          cronExpression: task.cronExpression,
                          enabled: task.enabled
                        });
                        setShowAddDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• 定时任务会自动执行所有启用账号的签到操作</p>
          <p>• 建议设置在网络较好的时间段，如上午9点或晚上8点</p>
          <p>• 任务执行结果会记录在系统日志中，可在"执行日志"页面查看</p>
          <p>• 暂停的任务不会执行，但配置会保留</p>
        </CardContent>
      </Card>
    </div>
  );
}