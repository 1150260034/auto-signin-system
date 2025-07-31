import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Play, Pause, Settings, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
}

interface Account {
  id: string;
  name: string;
  platform: string;
}

export default function TaskScheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    accountId: '',
    schedule: '0 9 * * *', // 默认每天9点
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchAccounts();
  }, []);

  const fetchTasks = async () => {
    try {
      // 模拟数据
      const mockTasks: Task[] = [
        {
          id: '1',
          name: '微博每日签到',
          accountId: '1',
          accountName: '用户A',
          schedule: '0 9 * * *',
          enabled: true,
          lastRun: '2024-01-15 09:00:00',
          nextRun: '2024-01-16 09:00:00',
          status: 'active'
        },
        {
          id: '2',
          name: '贴吧签到任务',
          accountId: '2',
          accountName: '用户B',
          schedule: '0 8 * * *',
          enabled: false,
          lastRun: '2024-01-14 08:00:00',
          nextRun: '-',
          status: 'paused'
        }
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      toast({
        title: "错误",
        description: "获取任务列表失败",
        variant: "destructive",
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      // 模拟数据
      const mockAccounts: Account[] = [
        { id: '1', name: '用户A', platform: '微博' },
        { id: '2', name: '用户B', platform: '贴吧' },
        { id: '3', name: '用户C', platform: '知乎' }
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('获取账号列表失败:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.name || !newTask.accountId) {
      toast({
        title: "错误",
        description: "请填写完整的任务信息",
        variant: "destructive",
      });
      return;
    }

    try {
      const account = accounts.find(acc => acc.id === newTask.accountId);
      const task: Task = {
        id: Date.now().toString(),
        name: newTask.name,
        accountId: newTask.accountId,
        accountName: account?.name || '',
        schedule: newTask.schedule,
        enabled: true,
        status: 'active'
      };

      setTasks([...tasks, task]);
      setNewTask({ name: '', accountId: '', schedule: '0 9 * * *' });
      setShowAddDialog(false);
      
      toast({
        title: "成功",
        description: "任务创建成功",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "创建任务失败",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    try {
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, enabled: !task.enabled, status: task.enabled ? 'paused' : 'active' }
          : task
      ));
      
      toast({
        title: "成功",
        description: "任务状态已更新",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "更新任务状态失败",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "成功",
        description: "任务已删除",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "删除任务失败",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) {
      return <Badge variant="secondary">已暂停</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">运行中</Badge>;
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const formatSchedule = (schedule: string) => {
    // 简单的cron表达式解析
    const parts = schedule.split(' ');
    if (parts.length >= 5) {
      const [minute, hour] = parts;
      return `每天 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    return schedule;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">定时任务管理</h2>
          <p className="text-gray-600">管理自动签到的定时任务</p>
        </div>
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
                为指定账号创建自动签到任务
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-name">任务名称</Label>
                <Input
                  id="task-name"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="输入任务名称"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-select">选择账号</Label>
                <Select value={newTask.accountId} onValueChange={(value) => setNewTask({ ...newTask, accountId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择要签到的账号" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule">执行时间</Label>
                <Select value={newTask.schedule} onValueChange={(value) => setNewTask({ ...newTask, schedule: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0 8 * * *">每天 08:00</SelectItem>
                    <SelectItem value="0 9 * * *">每天 09:00</SelectItem>
                    <SelectItem value="0 10 * * *">每天 10:00</SelectItem>
                    <SelectItem value="0 12 * * *">每天 12:00</SelectItem>
                    <SelectItem value="0 18 * * *">每天 18:00</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* 任务列表 */}
      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无定时任务</h3>
              <p className="text-gray-500 text-center mb-4">
                创建您的第一个自动签到任务
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
                        账号: {task.accountName} | 执行时间: {formatSchedule(task.schedule)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(task.status, task.enabled)}
                    <Switch
                      checked={task.enabled}
                      onCheckedChange={() => toggleTaskStatus(task.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">上次执行:</span> {task.lastRun || '未执行'}
                    </div>
                    <div>
                      <span className="font-medium">下次执行:</span> {task.nextRun || '已暂停'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
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

      {/* 任务统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">运行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.enabled && t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已暂停</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {tasks.filter(t => !t.enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}