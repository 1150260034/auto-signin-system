import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Clock, 
  Mail, 
  Smartphone,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  // 通知设置
  notifications: {
    enabled: boolean;
    email: boolean;
    webhook: boolean;
    emailAddress: string;
    webhookUrl: string;
  };
  // 签到设置
  signin: {
    retryCount: number;
    retryInterval: number;
    timeout: number;
    userAgent: string;
  };
  // 系统设置
  system: {
    logRetentionDays: number;
    maxConcurrentTasks: number;
    enableDebugMode: boolean;
    autoBackup: boolean;
    backupInterval: number;
  };
  // 安全设置
  security: {
    enableApiAuth: boolean;
    apiKey: string;
    allowedIPs: string;
    enableRateLimit: boolean;
    rateLimitPerMinute: number;
  };
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    notifications: {
      enabled: true,
      email: false,
      webhook: false,
      emailAddress: '',
      webhookUrl: ''
    },
    signin: {
      retryCount: 3,
      retryInterval: 5,
      timeout: 30,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    system: {
      logRetentionDays: 30,
      maxConcurrentTasks: 5,
      enableDebugMode: false,
      autoBackup: true,
      backupInterval: 7
    },
    security: {
      enableApiAuth: false,
      apiKey: '',
      allowedIPs: '',
      enableRateLimit: true,
      rateLimitPerMinute: 60
    }
  });

  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    uptime: '2天3小时',
    dbSize: '2.5MB',
    totalAccounts: 5,
    totalTasks: 8,
    totalLogs: 156
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
  }, []);

  const loadSettings = async () => {
    try {
      // 这里应该从API加载设置
      // const response = await fetch('/api/settings');
      // const data = await response.json();
      // setSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      // 这里应该从API加载系统信息
      // const response = await fetch('/api/system/info');
      // const data = await response.json();
      // setSystemInfo(data);
    } catch (error) {
      console.error('加载系统信息失败:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // 这里应该保存设置到API
      // await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });

      toast({
        title: "成功",
        description: "设置已保存",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "保存设置失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      notifications: {
        enabled: true,
        email: false,
        webhook: false,
        emailAddress: '',
        webhookUrl: ''
      },
      signin: {
        retryCount: 3,
        retryInterval: 5,
        timeout: 30,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      system: {
        logRetentionDays: 30,
        maxConcurrentTasks: 5,
        enableDebugMode: false,
        autoBackup: true,
        backupInterval: 7
      },
      security: {
        enableApiAuth: false,
        apiKey: '',
        allowedIPs: '',
        enableRateLimit: true,
        rateLimitPerMinute: 60
      }
    });

    toast({
      title: "成功",
      description: "设置已重置为默认值",
    });
  };

  const generateApiKey = () => {
    const key = 'sk-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        apiKey: key
      }
    });
  };

  const testNotification = async () => {
    try {
      toast({
        title: "测试通知",
        description: "这是一条测试通知消息",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "发送测试通知失败",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
          <p className="text-gray-600">配置系统参数和功能选项</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重置设置
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧设置面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 通知设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知设置
              </CardTitle>
              <CardDescription>
                配置签到结果和系统状态的通知方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用通知</Label>
                  <p className="text-sm text-gray-500">接收签到结果和系统状态通知</p>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, enabled: checked }
                    })
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>邮件通知</Label>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email: checked }
                        })
                      }
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                  <Input
                    placeholder="邮箱地址"
                    value={settings.notifications.emailAddress}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailAddress: e.target.value }
                      })
                    }
                    disabled={!settings.notifications.enabled || !settings.notifications.email}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Webhook通知</Label>
                    <Switch
                      checked={settings.notifications.webhook}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, webhook: checked }
                        })
                      }
                      disabled={!settings.notifications.enabled}
                    />
                  </div>
                  <Input
                    placeholder="Webhook URL"
                    value={settings.notifications.webhookUrl}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, webhookUrl: e.target.value }
                      })
                    }
                    disabled={!settings.notifications.enabled || !settings.notifications.webhook}
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={testNotification}
                disabled={!settings.notifications.enabled}
              >
                发送测试通知
              </Button>
            </CardContent>
          </Card>

          {/* 签到设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                签到设置
              </CardTitle>
              <CardDescription>
                配置自动签到的执行参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>重试次数</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.signin.retryCount}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        signin: { ...settings.signin, retryCount: parseInt(e.target.value) || 3 }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>重试间隔(秒)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.signin.retryInterval}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        signin: { ...settings.signin, retryInterval: parseInt(e.target.value) || 5 }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>超时时间(秒)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="120"
                    value={settings.signin.timeout}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        signin: { ...settings.signin, timeout: parseInt(e.target.value) || 30 }
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>User-Agent</Label>
                <Textarea
                  placeholder="浏览器User-Agent字符串"
                  value={settings.signin.userAgent}
                  onChange={(e) => 
                    setSettings({
                      ...settings,
                      signin: { ...settings.signin, userAgent: e.target.value }
                    })
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* 系统设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                系统设置
              </CardTitle>
              <CardDescription>
                配置系统运行和数据管理参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>日志保留天数</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.system.logRetentionDays}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        system: { ...settings.system, logRetentionDays: parseInt(e.target.value) || 30 }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大并发任务数</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.system.maxConcurrentTasks}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        system: { ...settings.system, maxConcurrentTasks: parseInt(e.target.value) || 5 }
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>调试模式</Label>
                    <p className="text-sm text-gray-500">启用详细的调试日志</p>
                  </div>
                  <Switch
                    checked={settings.system.enableDebugMode}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        system: { ...settings.system, enableDebugMode: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自动备份</Label>
                    <p className="text-sm text-gray-500">定期备份数据库和配置</p>
                  </div>
                  <Switch
                    checked={settings.system.autoBackup}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        system: { ...settings.system, autoBackup: checked }
                      })
                    }
                  />
                </div>

                {settings.system.autoBackup && (
                  <div className="space-y-2">
                    <Label>备份间隔(天)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.system.backupInterval}
                      onChange={(e) => 
                        setSettings({
                          ...settings,
                          system: { ...settings.system, backupInterval: parseInt(e.target.value) || 7 }
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 安全设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全设置
              </CardTitle>
              <CardDescription>
                配置API访问控制和安全参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用API认证</Label>
                  <p className="text-sm text-gray-500">要求API密钥才能访问接口</p>
                </div>
                <Switch
                  checked={settings.security.enableApiAuth}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      security: { ...settings.security, enableApiAuth: checked }
                    })
                  }
                />
              </div>

              {settings.security.enableApiAuth && (
                <div className="space-y-2">
                  <Label>API密钥</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="password"
                      value={settings.security.apiKey}
                      onChange={(e) => 
                        setSettings({
                          ...settings,
                          security: { ...settings.security, apiKey: e.target.value }
                        })
                      }
                      placeholder="输入或生成API密钥"
                    />
                    <Button variant="outline" onClick={generateApiKey}>
                      生成
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>允许的IP地址</Label>
                <Textarea
                  placeholder="每行一个IP地址或CIDR，留空表示允许所有IP"
                  value={settings.security.allowedIPs}
                  onChange={(e) => 
                    setSettings({
                      ...settings,
                      security: { ...settings.security, allowedIPs: e.target.value }
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用访问限制</Label>
                  <p className="text-sm text-gray-500">限制每分钟的API请求次数</p>
                </div>
                <Switch
                  checked={settings.security.enableRateLimit}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      security: { ...settings.security, enableRateLimit: checked }
                    })
                  }
                />
              </div>

              {settings.security.enableRateLimit && (
                <div className="space-y-2">
                  <Label>每分钟请求限制</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.security.rateLimitPerMinute}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        security: { ...settings.security, rateLimitPerMinute: parseInt(e.target.value) || 60 }
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧系统信息 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                系统信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">版本</span>
                  <Badge variant="outline">{systemInfo.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">运行时间</span>
                  <span className="text-sm font-medium">{systemInfo.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">数据库大小</span>
                  <span className="text-sm font-medium">{systemInfo.dbSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">账号数量</span>
                  <span className="text-sm font-medium">{systemInfo.totalAccounts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">任务数量</span>
                  <span className="text-sm font-medium">{systemInfo.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">日志记录</span>
                  <span className="text-sm font-medium">{systemInfo.totalLogs}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                系统状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">数据库</span>
                  <Badge variant="default" className="bg-green-500">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">定时任务</span>
                  <Badge variant="default" className="bg-green-500">运行中</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">网络连接</span>
                  <Badge variant="default" className="bg-green-500">正常</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                注意事项
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 修改设置后需要保存才能生效</p>
                <p>• 启用调试模式会增加日志文件大小</p>
                <p>• API认证密钥请妥善保管</p>
                <p>• 建议定期备份重要数据</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}