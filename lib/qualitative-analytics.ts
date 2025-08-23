import { 
  QualitativeFeedback, 
  CompetencyLevel, 
  CompetencyTagTrend, 
  QualitativeCompetencyData,
  QualitativeAnalytics 
} from '@/types/qualitative-feedback';

// 定义核心能力维度
const CORE_COMPETENCIES = [
  '内容质量',
  '逻辑思维', 
  '表达能力',
  '创新思维',
  '问题分析'
];

// 实现定性分析工具函数
export const qualitativeAnalytics: QualitativeAnalytics = {
  // 获取最频繁的提升建议
  getMostFrequentSuggestion: (feedbacks: QualitativeFeedback[]): string => {
    const suggestionCounts: Record<string, number> = {};
    
    feedbacks.forEach(feedback => {
      feedback.suggestions.forEach(suggestion => {
        suggestionCounts[suggestion.title] = (suggestionCounts[suggestion.title] || 0) + 1;
      });
    });
    
    const mostFrequent = Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostFrequent ? mostFrequent[0] : '暂无建议数据';
  },
  
  // 计算累计亮点数量
  getTotalHighlights: (feedbacks: QualitativeFeedback[]): number => {
    return feedbacks.reduce((total, feedback) => {
      return total + feedback.highlights.length;
    }, 0);
  },
  
  // 分析能力等级
  analyzeCompetencyLevel: (competency: string, feedbacks: QualitativeFeedback[]): CompetencyLevel => {
    let highlightCount = 0;
    let suggestionCount = 0;
    
    feedbacks.forEach(feedback => {
      // 检查亮点中是否包含该能力
      feedback.highlights.forEach(highlight => {
        if (highlight.title.includes(competency) || highlight.description.includes(competency)) {
          highlightCount++;
        }
      });
      
      // 检查建议中是否包含该能力
      feedback.suggestions.forEach(suggestion => {
        if (suggestion.title.includes(competency) || suggestion.description.includes(competency)) {
          suggestionCount++;
        }
      });
    });
    
    // 根据正负反馈比例判断等级
    const totalFeedback = highlightCount + suggestionCount;
    if (totalFeedback === 0) return '初步掌握';
    
    const positiveRatio = highlightCount / totalFeedback;
    
    if (positiveRatio >= 0.7) return '表现出色';
    if (positiveRatio >= 0.4) return '熟练应用';
    return '初步掌握';
  },
  
  // 生成综合成长建议
  generateGrowthAdvice: (feedbacks: QualitativeFeedback[]): string => {
    if (feedbacks.length === 0) {
      return '完成更多练习后，我们将为您提供个性化的成长建议。';
    }
    
    // 统计反复出现的建议
    const suggestionCounts: Record<string, number> = {};
    const actionPlanCounts: Record<string, number> = {};
    
    feedbacks.forEach(feedback => {
      feedback.suggestions.forEach(suggestion => {
        suggestionCounts[suggestion.title] = (suggestionCounts[suggestion.title] || 0) + 1;
      });
      
      feedback.actionPlan.forEach(action => {
        actionPlanCounts[action.title] = (actionPlanCounts[action.title] || 0) + 1;
      });
    });
    
    // 找出最频繁的问题
    const topSuggestions = Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([title]) => title);
    
    const topActions = Object.entries(actionPlanCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([title]) => title);
    
    let advice = '基于您的练习历史分析，';
    
    if (topSuggestions.length > 0) {
      advice += `您需要重点关注${topSuggestions.join('和')}方面的提升。`;
    }
    
    if (topActions.length > 0) {
      advice += `建议您优先进行${topActions.join('和')}相关的学习和练习。`;
    }
    
    advice += '持续练习将帮助您在这些关键领域取得突破。';
    
    return advice;
  },
  
  // 获取能力标签趋势数据
  getCompetencyTagTrends: (feedbacks: QualitativeFeedback[]): CompetencyTagTrend[] => {
    const trends: CompetencyTagTrend[] = [];
    
    // 收集所有独特的标签
    const allTags = new Set<string>();
    feedbacks.forEach(feedback => {
      feedback.highlights.forEach(h => allTags.add(h.title));
      feedback.suggestions.forEach(s => allTags.add(s.title));
    });
    
    // 为每个标签生成趋势数据
    Array.from(allTags).forEach(tagTitle => {
      feedbacks.forEach(feedback => {
        const hasHighlight = feedback.highlights.some(h => h.title === tagTitle);
        const hasSuggestion = feedback.suggestions.some(s => s.title === tagTitle);
        
        if (hasHighlight) {
          trends.push({
            date: feedback.practiceDate,
            tagTitle,
            tagType: 'highlight',
            appeared: true
          });
        }
        
        if (hasSuggestion) {
          trends.push({
            date: feedback.practiceDate,
            tagTitle,
            tagType: 'suggestion', 
            appeared: true
          });
        }
      });
    });
    
    return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
};

// 生成能力分析数据
export const generateQualitativeCompetencyData = (
  feedbacks: QualitativeFeedback[]
): QualitativeCompetencyData[] => {
  const competencyDescriptions: Record<string, string> = {
    '内容质量': '回答内容的深度、准确性和相关性',
    '逻辑思维': '思路清晰度、论证逻辑和结构化表达',
    '表达能力': '语言流畅度、用词准确性和沟通效果',
    '创新思维': '创意想法、独特视角和解决方案创新性',
    '问题分析': '问题理解深度、分析框架和解决思路'
  };
  
  return CORE_COMPETENCIES.map(competency => {
    let highlightCount = 0;
    let suggestionCount = 0;
    
    feedbacks.forEach(feedback => {
      feedback.highlights.forEach(highlight => {
        if (highlight.title.includes(competency) || highlight.description.includes(competency)) {
          highlightCount++;
        }
      });
      
      feedback.suggestions.forEach(suggestion => {
        if (suggestion.title.includes(competency) || suggestion.description.includes(competency)) {
          suggestionCount++;
        }
      });
    });
    
    const level = qualitativeAnalytics.analyzeCompetencyLevel(competency, feedbacks);
    
    return {
      competency,
      description: competencyDescriptions[competency] || '综合能力评估',
      level,
      highlightCount,
      suggestionCount
    };
  });
};

// 智能标签选择算法 - 避免连续练习中出现完全相同的诊断标签
class TagDiversityManager {
  private recentTags: Map<string, number> = new Map(); // 标签 -> 最后出现的练习索引
  private tagWeights: Map<string, number> = new Map(); // 标签 -> 权重分数
  
  constructor() {
    this.initializeWeights();
  }
  
  private initializeWeights() {
    // 为不同类型的标签设置基础权重
    const highlightTags = ['创意联想能力', '逻辑结构清晰', '表达流畅自然', '内容相关性强', '案例运用恰当', '思维敏捷', '观点独特', '分析深入'];
    const suggestionTags = ['内容相关性', '逻辑连贯性', '具体案例支撑', '回答深度', '逻辑完全不通', '偏离主题严重', '表达可以更精炼', '用词可以更准确', '时间管理', '互动性不足'];
    
    highlightTags.forEach(tag => this.tagWeights.set(tag, 1.0));
    suggestionTags.forEach(tag => this.tagWeights.set(tag, 1.0));
  }
  
  // 计算标签的多样性分数（分数越高，越应该被选择）
  private calculateDiversityScore(tag: string, currentIndex: number): number {
    const baseWeight = this.tagWeights.get(tag) || 1.0;
    const lastAppearance = this.recentTags.get(tag);
    
    if (lastAppearance === undefined) {
      // 从未出现过的标签，给予最高优先级
      return baseWeight * 2.0;
    }
    
    const distance = currentIndex - lastAppearance;
    
    if (distance === 1) {
      // 上一次练习刚出现过，大幅降低权重
      return baseWeight * 0.1;
    } else if (distance === 2) {
      // 前两次练习出现过，适度降低权重
      return baseWeight * 0.5;
    } else if (distance >= 3) {
      // 距离较远，正常权重
      return baseWeight * 1.0;
    }
    
    return baseWeight;
  }
  
  // 智能选择标签，确保多样性
  selectTags<T extends { title: string }>(candidates: T[], count: number, currentIndex: number): T[] {
    // 计算每个候选标签的多样性分数
    const tagScores = candidates.map(tag => ({
      tag,
      score: this.calculateDiversityScore(tag.title, currentIndex)
    }));
    
    // 按分数排序，优先选择高分标签
    tagScores.sort((a, b) => b.score - a.score);
    
    // 选择前N个标签，但加入一定随机性避免过于机械
    const selected: T[] = [];
    const topCandidates = tagScores.slice(0, Math.min(count * 2, tagScores.length));
    
    while (selected.length < count && topCandidates.length > 0) {
      // 使用加权随机选择，分数高的标签被选中概率更大
      const totalScore = topCandidates.reduce((sum, item) => sum + item.score, 0);
      let random = Math.random() * totalScore;
      
      for (let i = 0; i < topCandidates.length; i++) {
        random -= topCandidates[i].score;
        if (random <= 0) {
          selected.push(topCandidates[i].tag);
          topCandidates.splice(i, 1);
          break;
        }
      }
    }
    
    // 更新标签出现记录
    selected.forEach(tag => {
      this.recentTags.set(tag.title, currentIndex);
    });
    
    return selected;
  }
  
  // 重置管理器状态
  reset() {
    this.recentTags.clear();
    this.initializeWeights();
  }
}

// 全局标签多样性管理器实例
const tagDiversityManager = new TagDiversityManager();

// 模拟数据生成器（用于开发测试）- 增强版本，支持标签多样性
export const generateMockQualitativeFeedback = (count: number): QualitativeFeedback[] => {
  // 重置标签管理器
  tagDiversityManager.reset();
  
  const mockHighlights = [
    { title: '创意联想能力', description: '在回答中展现了出色的创意思维和联想能力' },
    { title: '逻辑结构清晰', description: '回答逻辑性强，结构层次分明' },
    { title: '表达流畅自然', description: '语言表达流畅，用词准确恰当' },
    { title: '内容相关性强', description: '回答内容与问题高度相关，切中要点' },
    { title: '案例运用恰当', description: '能够恰当运用具体案例支撑观点' },
    { title: '思维敏捷', description: '思维反应迅速，能快速抓住问题核心' },
    { title: '观点独特', description: '提出了独特且有价值的观点' },
    { title: '分析深入', description: '对问题进行了深入透彻的分析' }
  ];
  
  const mockSuggestions = [
    { title: '内容相关性', description: '建议加强回答与问题的相关性，避免偏题', severity: 'moderate' },
    { title: '逻辑连贯性', description: '可以进一步提升论述的逻辑连贯性', severity: 'moderate' },
    { title: '具体案例支撑', description: '建议增加具体案例来支撑观点', severity: 'moderate' },
    { title: '回答深度', description: '可以进一步深入分析问题的本质', severity: 'moderate' },
    { title: '逻辑完全不通', description: '回答逻辑混乱，需要重新组织思路', severity: 'critical' },
    { title: '偏离主题严重', description: '回答完全偏离问题核心，需要重新理解题意', severity: 'critical' },
    { title: '表达可以更精炼', description: '语言表达可以更加简洁明了', severity: 'minor' },
    { title: '用词可以更准确', description: '部分用词不够准确，可以进一步优化', severity: 'minor' },
    { title: '时间管理', description: '建议更好地控制回答时间，避免超时或过短', severity: 'moderate' },
    { title: '互动性不足', description: '可以增加与面试官的眼神交流和互动', severity: 'minor' }
  ];
  
  const mockActionPlans = [
    { title: '产品思维基础', description: '学习产品设计的基本原理和方法论' },
    { title: '逻辑思维训练', description: '通过逻辑推理练习提升思维能力' },
    { title: '案例分析练习', description: '多做商业案例分析，提升实战能力' },
    { title: '表达技巧训练', description: '练习清晰简洁的表达方式' },
    { title: '时间管理练习', description: '训练在限定时间内完整回答问题' }
  ];
  
  return Array.from({ length: count }, (_, i) => {
    // 使用智能标签选择算法选择亮点（2-3个）
    const highlightCount = Math.floor(Math.random() * 2) + 2; // 2-3个
    const selectedHighlights = tagDiversityManager.selectTags(mockHighlights, highlightCount, i);
    
    // 使用智能标签选择算法选择建议（2-3个），确保包含不同严重性等级
    const suggestionCount = Math.floor(Math.random() * 2) + 2; // 2-3个
    let selectedSuggestions = tagDiversityManager.selectTags(mockSuggestions, suggestionCount, i);
    
    // 确保建议中包含不同严重性等级的多样性
    const severityTypes = ['critical', 'moderate', 'minor'];
    const currentSeverities = selectedSuggestions.map(s => s.severity);
    const missingSeverities = severityTypes.filter(type => !currentSeverities.includes(type));
    
    // 如果缺少某种严重性等级，尝试替换一个建议
    if (missingSeverities.length > 0 && selectedSuggestions.length > 1) {
      const targetSeverity = missingSeverities[Math.floor(Math.random() * missingSeverities.length)];
      const replacementOptions = mockSuggestions.filter(s => 
        s.severity === targetSeverity && 
        !selectedSuggestions.some(selected => selected.title === s.title)
      );
      
      if (replacementOptions.length > 0) {
        const randomReplacement = replacementOptions[Math.floor(Math.random() * replacementOptions.length)];
        selectedSuggestions[selectedSuggestions.length - 1] = randomReplacement;
      }
    }
    
    return {
      sessionId: `session_${i + 1}`,
      practiceDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      questionText: `模拟面试问题 ${i + 1}`,
      overallAssessment: {
        level: ['初级表现', '助理级表现', '高级表现'][Math.floor(Math.random() * 3)],
        summary: '整体表现良好，在某些方面有突出表现，同时也有需要改进的地方。'
      },
      highlights: selectedHighlights,
      suggestions: selectedSuggestions,
      actionPlan: mockActionPlans.slice(0, Math.floor(Math.random() * 2) + 1)
    };
  });
};

// 导出标签多样性管理器，供其他模块使用
export { TagDiversityManager, tagDiversityManager };

// 从反馈中提取下一步行动计划
export const getHistoryFeedbackNextSteps = (feedback: QualitativeFeedback): ActionItem[] => {
  return feedback.actionPlan || [];
};