import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { canAccess } from '@/lib/authorization';
import {
  deleteOldAuditLogs,
  deleteOldNotifications,
  getCleanupStats,
  runAllCleanupJobs,
} from '@/lib/cleanup-jobs';

/**
 * Database Cleanup Page
 * Admin-level utility for managing old records
 * Authorization: access_admin_panel permission required
 */
export default function CleanupPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Authorization check
  if (!authLoading && (!user || !canAccess(roles, 'access_admin_panel'))) {
    return (
      <div className="container py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">You don't have permission to access cleanup utilities.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadStats = async () => {
    setStatsLoading(true);
    const result = await getCleanupStats();
    setStats(result);
    setStatsLoading(false);
  };

  const handleCleanupAuditLogs = async () => {
    setLoading(true);
    const { deleted, error } = await deleteOldAuditLogs(30);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Cleanup Failed',
        description: 'Failed to delete old audit logs',
      });
      return;
    }

    toast({
      title: 'Cleanup Complete',
      description: `Deleted ${deleted} audit log entries older than 30 days`,
    });

    await loadStats();
  };

  const handleCleanupNotifications = async () => {
    setLoading(true);
    const { deleted, error } = await deleteOldNotifications(90);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Cleanup Failed',
        description: 'Failed to delete old notifications',
      });
      return;
    }

    toast({
      title: 'Cleanup Complete',
      description: `Deleted ${deleted} notification entries older than 90 days`,
    });

    await loadStats();
  };

  const handleRunAllCleanup = async () => {
    if (!confirm('Run all cleanup jobs? This may take a moment.')) return;

    setLoading(true);
    const result = await runAllCleanupJobs();
    setLoading(false);

    if (result) {
      toast({
        title: 'All Cleanup Jobs Complete',
        description: `Deleted ${result.auditLogsDeleted} audit logs and ${result.notificationsDeleted} notifications in ${result.duration}ms`,
      });

      await loadStats();
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Database Cleanup</h1>
          <p className="text-muted-foreground mt-2">Manage old audit logs and notifications</p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cleanup Statistics</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={statsLoading}
              >
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stats ? (
              <p className="text-muted-foreground">Click Refresh to load statistics</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Audit logs (older than 30 days)</p>
                    <p className="text-2xl font-bold">{stats.auditLogsOlderThan30Days}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notifications (older than 90 days)</p>
                    <p className="text-2xl font-bold">{stats.notificationsOlderThan90Days}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Read notifications (older than 30 days)</p>
                  <p className="text-xl font-bold">{stats.readNotificationsOlderThan30Days}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Jobs */}
        <div className="space-y-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs Cleanup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Delete audit log entries older than 30 days to free up database space
              </p>
              <Button
                onClick={handleCleanupAuditLogs}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning up...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Old Audit Logs
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications Cleanup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Delete notification entries older than 90 days to free up database space
              </p>
              <Button
                onClick={handleCleanupNotifications}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning up...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Old Notifications
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Run All Cleanup Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-800">
                Run all cleanup jobs at once to free up database space
              </p>
              <Button
                onClick={handleRunAllCleanup}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running cleanup...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Run All Cleanup Jobs
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Retention Periods:</strong>
            <ul className="mt-2 ml-4 space-y-1 text-sm">
              <li>• Audit Logs: 30 days</li>
              <li>• Notifications: 90 days</li>
              <li>• Unread notifications are kept indefinitely</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
