import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PracticeSession } from '@/types/practice-session';
import { QualitativeFeedback } from '@/types/qualitative-feedback';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { FavoriteButton } from '@/components/ui/favorite-button';

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: baseSession } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!baseSession) return <div>未找到分组</div>;

  const baseTime = new Date(baseSession.created_at).getTime();
  const { data: groupSessions } = await supabase
    .from('practice_sessions')
    .select('*, interview_questions(question_text, expected_answer), interview_stages(stage_name), question_categories(category_name)')
    .eq('user_id', user.id)
    .gte('created_at', new Date(baseTime - 5*60*1000).toISOString())
    .lte('created_at', new Date(baseTime + 5*60*1000).toISOString())
    .order('created_at', { ascending: true });

  const sessions = (groupSessions || []).map(session => ({
    ...session,
    qualitative_feedback: session.ai_feedback ? JSON.parse(session.ai_feedback) : {},
  })) as PracticeSession[];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">面试套题详情</h1>
      <p className="text-gray-600 mb-4">{format(new Date(baseSession.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })} - {sessions.length} 道题 <Badge className="ml-2">{sessions[0]?.interview_stages?.stage_name || '未知模块'}</Badge></p>
      <div className="space-y-6">
        {sessions.map((session, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <span>问题 {index + 1}: {session.interview_questions?.question_text}</span>
                <div className="flex items-center space-x-2">
                  <Badge>{session.interview_stages?.stage_name}</Badge>
                  <FavoriteButton questionId={session.question_id} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4>我的回答</h4>
                  <p>{session.user_answer}</p>
                </div>
                <div>
                  <h4>期望答案</h4>
                  <p>{session.interview_questions?.expected_answer}</p>
                </div>
                <div>
                  <h4>亮点</h4>
                  {session.qualitative_feedback?.highlights?.map((h, i) => (
                    <div key={i} className="flex items-center"><CheckCircle className="mr-2" /> {h.title}</div>
                  ))}
                </div>
                <div>
                  <h4>改进建议</h4>
                  {session.qualitative_feedback?.suggestions?.map((s, i) => (
                    <div key={i} className="flex items-center">
                      {s.severity === 'critical' ? <AlertTriangle className="mr-2 text-red-500" /> : <Lightbulb className="mr-2 text-yellow-500" />}
                      {s.title}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}