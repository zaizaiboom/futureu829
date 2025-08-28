'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

export default function ProductIntro() {
  return (
    <div className="text-center py-20 px-6 bg-gradient-to-b from-white to-blue-50">
      <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-full">
        <Bot className="w-4 h-4 mr-2" />
        专为AI产品经理打造的智能面试训练平台
      </Badge>
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-2">
        FutureU
      </h1>
      <h2 className="text-5xl font-bold text-gray-900 mb-6">
        AI产品经理面试训练
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        在AI浪潮席卷而来的今天，成为一名优秀的AI产品经理，是无数人的职业梦想。然而，这条路并非坦途。从简历筛选、HR初面，到专业技术面试、高层终面，每一个环节都充满挑战。你是否常常感觉准备不足，面对考官的犀利提问无从下手？
FutureU正是为你量身打造的智能面试训练平台。我们基于真实的AI产品经理面试场景，为你提供个性化训练方案，让你在AI时代的职场竞争中脱颖而出。
      </p>
    </div>
  )
}