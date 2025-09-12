import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Globe, TrendingUp, Calendar, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalConversations: number;
  totalSessions: number;
  successRate: number;
  mostUsedLanguages: { language: string; count: number }[];
  dailyStats: { date: string; conversations: number; sessions: number }[];
  popularQuestions: { message: string; count: number }[];
  errorMessages: { error_message: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7); // Last 7 days

  useEffect(() => {
    fetchDashboardStats();
  }, [dateRange]);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);

      // Fetch all conversations using the secure admin function
      const { data: conversations, error } = await supabase
        .rpc('get_all_conversations_admin');

      if (error) throw error;

      if (!conversations) {
        setStats({
          totalConversations: 0,
          totalSessions: 0,
          successRate: 0,
          mostUsedLanguages: [],
          dailyStats: [],
          popularQuestions: [],
          errorMessages: []
        });
        return;
      }

      // Calculate stats
      const totalConversations = conversations.length;
      const uniqueSessions = new Set(conversations.map(c => c.session_id)).size;
      const successfulConversations = conversations.filter(c => c.success).length;
      const successRate = totalConversations > 0 ? (successfulConversations / totalConversations) * 100 : 0;

      // Language usage
      const languageCount: { [key: string]: number } = {};
      conversations.forEach(c => {
        languageCount[c.language] = (languageCount[c.language] || 0) + 1;
      });
      const mostUsedLanguages = Object.entries(languageCount)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily stats
      const dailyCount: { [key: string]: { conversations: number; sessions: Set<string> } } = {};
      conversations.forEach(c => {
        const date = new Date(c.created_at).toISOString().split('T')[0];
        if (!dailyCount[date]) {
          dailyCount[date] = { conversations: 0, sessions: new Set() };
        }
        dailyCount[date].conversations++;
        dailyCount[date].sessions.add(c.session_id);
      });
      
      const dailyStats = Object.entries(dailyCount)
        .map(([date, data]) => ({
          date,
          conversations: data.conversations,
          sessions: data.sessions.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Popular user questions (is_user = true)
      const userMessages = conversations.filter(c => c.is_user);
      const questionCount: { [key: string]: number } = {};
      userMessages.forEach(c => {
        const cleanMessage = c.message.toLowerCase().trim();
        if (cleanMessage.length > 10) { // Only count substantial questions
          questionCount[c.message] = (questionCount[c.message] || 0) + 1;
        }
      });
      const popularQuestions = Object.entries(questionCount)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Error analysis
      const errors = conversations.filter(c => !c.success && c.error_message);
      const errorCount: { [key: string]: number } = {};
      errors.forEach(c => {
        if (c.error_message) {
          errorCount[c.error_message] = (errorCount[c.error_message] || 0) + 1;
        }
      });
      const errorMessages = Object.entries(errorCount)
        .map(([error_message, count]) => ({ error_message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalConversations,
        totalSessions: uniqueSessions,
        successRate,
        mostUsedLanguages,
        dailyStats,
        popularQuestions,
        errorMessages
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-muted-foreground">AI Chat Analytics & Insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-3 py-1 text-sm"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.totalConversations || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats?.totalSessions || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Languages Used</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {stats?.mostUsedLanguages.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Questions */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Most Asked Questions
              </CardTitle>
              <CardDescription>Top user inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.popularQuestions.map((question, index) => (
                  <div key={index} className="flex items-start justify-between gap-4">
                    <p className="text-sm text-foreground flex-1 line-clamp-2">
                      {question.message}
                    </p>
                    <Badge variant="secondary" className="shrink-0">
                      {question.count}x
                    </Badge>
                  </div>
                )) || <p className="text-muted-foreground">No data available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Language Usage */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Distribution
              </CardTitle>
              <CardDescription>Most used languages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.mostUsedLanguages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium">
                        {lang.language.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${(lang.count / (stats?.totalConversations || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {lang.count}
                      </span>
                    </div>
                  </div>
                )) || <p className="text-muted-foreground">No data available</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Activity */}
        <Card className="glass border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Activity
            </CardTitle>
            <CardDescription>Conversations and sessions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.dailyStats.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {new Date(day.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>{day.conversations} conversations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span>{day.sessions} sessions</span>
                    </div>
                  </div>
                </div>
              )) || <p className="text-muted-foreground">No data available</p>}
            </div>
          </CardContent>
        </Card>

        {/* Error Analysis */}
        {stats && stats.errorMessages.length > 0 && (
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error Analysis
              </CardTitle>
              <CardDescription>Most common errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.errorMessages.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <span className="text-sm text-destructive flex-1">
                      {error.error_message}
                    </span>
                    <Badge variant="destructive">
                      {error.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}