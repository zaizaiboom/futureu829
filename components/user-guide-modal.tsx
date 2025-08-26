"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Briefcase, Target, CheckCircle, Brain, BarChart3, Zap, X } from "lucide-react"

interface UserGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const modules = [
    {
      title: "HR面试",
      subtitle: "模块一",
      questions: "15-20题",
      level: "基础",
      description: "考察AI PM求职动机、软技能和个人素养。",
      purpose: "帮助你梳理职业规划，展现与岗位匹配的个人特质，让你在第一轮筛选中就脱颖而出。",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "专业面试",
      subtitle: "模块二",
      questions: "20-25题",
      level: "进阶",
      description: "考察AI产品能力、技术理解和行业认知。",
      purpose: "深入检验你的专业知识和解决实际问题的能力，让你从容应对技术难点与业务挑战。",
      icon: Brain,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "终面",
      subtitle: "模块三",
      questions: "10-15题",
      level: "高级",
      description: "考察AI行业洞察、战略思维和领导潜质。",
      purpose: "站在更高视角审视行业，展现你的全局观和领导力，为你的面试画上圆满句号。",
      icon: Target,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    }
  ]

  const features = [
    {
      title: "个性化反馈与解析",
      description: "针对你的回答给出精准点评，并提供详细的答案解析和优化建议。",
      icon: BarChart3
    },
    {
      title: "面试历史总结",
      description: "你的所有练习记录都将永久保存，形成专属'学习报告'。AI将为你总结不足，分析进步空间，让你清晰地看到自己的成长轨迹。",
      icon: CheckCircle
    },
    {
      title: "持续提升方案",
      description: "系统会根据你的表现，智能推荐后续的练习重点和提升方向，确保你的每一次努力都更有效。",
      icon: Zap
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-0 top-0 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
              🤖 使用指南
            </Badge>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              FutureU：AI产品经理面试训练平台
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-4">
              告别盲目求职，成就AI时代下的你
            </p>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 px-2">
          {/* 平台介绍 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-gray-700 leading-relaxed mb-4">
              在AI浪潮席卷而来的今天，成为一名优秀的AI产品经理，是无数人的职业梦想。然而，这条路并非坦途。从简历筛选、HR初面，到专业技术面试、高层终面，每一个环节都充满挑战。你是否常常感觉准备不足，面对考官的犀利提问无从下手？
            </p>
            <p className="text-blue-600 font-semibold text-lg">
              FutureU正是为你量身打造的智能面试训练平台。我们基于真实的AI产品经理面试场景，为你提供个性化训练方案，让你在AI时代的职场竞争中脱颖而出。
            </p>
          </div>

          {/* 三大核心训练模块 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              三大核心训练模块，全方位提升你的面试力
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              我们深知AI产品经理面试的复杂性，因此将训练流程拆解为三大核心模块，覆盖从基础到高阶的每一个环节：
            </p>
            
            <div className="space-y-6">
              {modules.map((module, index) => {
                const IconComponent = module.icon
                return (
                  <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl ${module.bgColor} flex-shrink-0`}>
                          <IconComponent className={`w-6 h-6 ${module.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge className={`${module.bgColor} ${module.textColor} border-0`}>
                              {module.subtitle}
                            </Badge>
                            <h4 className="text-xl font-bold text-gray-900">
                              {module.title}（{module.questions} · {module.level}）
                            </h4>
                          </div>
                          <p className="text-gray-700 mb-2">
                            <span className="font-semibold">考察内容：</span>{module.description}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">核心作用：</span>{module.purpose}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* 深度自我修炼 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              不止于答题，更是一场深度自我修炼
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              在FutureU，你的每一次作答都将得到专业的AI智能反馈。系统会根据你的回答内容，为你提供：
            </p>
            
            <div className="grid md:grid-cols-1 gap-4">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {feature.title}
                          </h4>
                          <p className="text-gray-700">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* 行动号召 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">
              立即开始FutureU的面试训练
            </h3>
            <p className="text-lg mb-6">
              让你的求职之路事半功倍，迈向理想的AI产品经理职位。
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3"
              onClick={onClose}
            >
              开始训练
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}