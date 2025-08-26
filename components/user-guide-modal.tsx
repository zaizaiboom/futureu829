'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Brain, Target, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function UserGuideModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="fixed bottom-4 right-4 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600">
          使用指南
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">FutureU 使用指南</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">概述</TabsTrigger>
              <TabsTrigger value="modules">训练模块</TabsTrigger>
              <TabsTrigger value="features">核心功能</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
                    <h3 className="text-xl font-bold">FutureU：AI产品经理面试训练平台</h3>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">告别盲目求职，成就AI时代下的你</h4>
                  <p className="text-muted-foreground mb-4">
                    在AI浪潮席卷而来的今天，成为一名优秀的AI产品经理，是无数人的职业梦想。然而，这条路并非坦途。从简历筛选、HR初面，到专业技术面试、高层终面，每一个环节都充满挑战。你是否常常感觉准备不足，面对考官的犀利提问无从下手？
                  </p>
                  <p className="text-muted-foreground mb-4">
                    FutureU正是为你量身打造的智能面试训练平台。我们基于真实的AI产品经理面试场景，为你提供个性化训练方案，让你在AI时代的职场竞争中脱颖而出。
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="modules">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 mr-2 text-green-600" />
                    <h3 className="text-xl font-bold">三大核心训练模块，全方位提升你的面试力</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    我们深知AI产品经理面试的复杂性，因此将训练流程拆解为三大核心模块，覆盖从基础到高阶的每一个环节：
                  </p>
                  <ul className="space-y-4">
                    <li className="bg-blue-50 p-4 rounded-md">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-2">模块一：HR面试（15-20题 · 基础）</Badge>
                      <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                        <li><strong>考察内容：</strong> 考察AI PM求职动机、软技能和个人素养。</li>
                        <li><strong>核心作用：</strong> 帮助你梳理职业规划，展现与岗位匹配的个人特质，让你在第一轮筛选中就脱颖而出。</li>
                      </ul>
                    </li>
                    <li className="bg-green-50 p-4 rounded-md">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white mb-2">模块二：专业面试（20-25题 · 进阶）</Badge>
                      <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                        <li><strong>考察内容：</strong> 考察AI产品能力、技术理解和行业认知。</li>
                        <li><strong>核心作用：</strong> 深入检验你的专业知识和解决实际问题的能力，让你从容应对技术难点与业务挑战。</li>
                      </ul>
                    </li>
                    <li className="bg-purple-50 p-4 rounded-md">
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white mb-2">模块三：终面（10-15题 · 高级）</Badge>
                      <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                        <li><strong>考察内容：</strong> 考察AI行业洞察、战略思维和领导潜质。</li>
                        <li><strong>核心作用：</strong> 站在更高视角审视行业，展现你的全局观和领导力，为你的面试画上圆满句号。</li>
                      </ul>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="features">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Star className="w-6 h-6 mr-2 text-purple-600" />
                    <h3 className="text-xl font-bold">不止于答题，更是一场深度自我修炼</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    在FutureU，你的每一次作答都将得到专业的AI智能反馈。系统会根据你的回答内容，为你提供：
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>个性化反馈与解析：</strong> 针对你的回答给出精准点评，并提供详细的答案解析和优化建议。</li>
                    <li><strong>面试历史总结：</strong> 你的所有练习记录都将永久保存，形成专属“学习报告”。AI将为你总结不足，分析进步空间，让你清晰地看到自己的成长轨迹。</li>
                    <li><strong>持续提升方案：</strong> 系统会根据你的表现，智能推荐后续的练习重点和提升方向，确保你的每一次努力都更有效。</li>
                  </ul>
                  
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}