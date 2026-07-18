import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StudentStats } from '../../types';

interface SkillTreeTableProps {
  topicPerformance: StudentStats['topic_performance'];
}

interface TreeNode {
  name: string;
  path: string;
  stats: {
    accuracy_pct: number;
    mastered_count: number;
    at_risk_count: number;
    total_questions: number;
    count: number;
  };
  children: Record<string, TreeNode>;
}

export const SkillTreeTable: React.FC<SkillTreeTableProps> = ({ topicPerformance }) => {
  const { t } = useTranslation();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  if (!topicPerformance || topicPerformance.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('studentDetail.analytics.skillTree')}</h3>
        <p className="text-sm text-gray-500 text-center py-8">{t('studentDetail.analytics.noLearningData')}</p>
      </div>
    );
  }

  // Build tree
  const tree: Record<string, TreeNode> = {};

  topicPerformance.forEach(tp => {
    const parts = tp.topic_path.split(' ➔ ');
    let currentLevel = tree;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath} ➔ ${part}` : part;
      
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: currentPath,
          stats: {
            accuracy_pct: 0,
            mastered_count: 0,
            at_risk_count: 0,
            total_questions: 0,
            count: 0
          },
          children: {}
        };
      }
      
      // Aggregate stats up the tree
      const node = currentLevel[part];
      if (index === parts.length - 1) {
        // Leaf node gets direct stats
        node.stats.accuracy_pct = tp.accuracy_pct;
        node.stats.mastered_count += tp.mastered_count;
        node.stats.at_risk_count += tp.at_risk_count;
        node.stats.total_questions += tp.total_questions;
        node.stats.count = 1; // Itself
      } else {
        node.stats.mastered_count += tp.mastered_count;
        node.stats.at_risk_count += tp.at_risk_count;
        node.stats.total_questions += tp.total_questions;
        node.stats.accuracy_pct += tp.accuracy_pct;
        node.stats.count += 1;
      }

      currentLevel = node.children;
    });
  });

  const toggleExpand = (path: string, currentIsExpanded: boolean) => {
    setExpandedNodes(prev => ({ ...prev, [path]: !currentIsExpanded }));
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const hasChildren = Object.keys(node.children).length > 0;
    const isExpanded = expandedNodes[node.path] ?? (depth === 0);
    
    // Average accuracy for parent nodes
    const displayAccuracy = hasChildren 
      ? Math.round(node.stats.accuracy_pct / node.stats.count) 
      : node.stats.accuracy_pct;

    return (
      <React.Fragment key={node.path}>
        <div className={`flex items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${depth === 0 ? 'bg-gray-50/50' : ''}`}>
          <div className="flex-1 flex items-center" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(node.path, isExpanded)} className="p-1 mr-1 text-gray-400 hover:text-indigo-600 rounded-md">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 mr-1" /> // Spacer
            )}
            <span className={`font-medium ${depth === 0 ? 'text-gray-900' : 'text-gray-700 text-sm'}`}>
              {node.name}
            </span>
          </div>
          
          <div className="w-28 text-center px-4">
            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded text-xs font-semibold ${
              displayAccuracy >= 80 ? 'bg-emerald-50 text-emerald-700' :
              displayAccuracy >= 50 ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              {displayAccuracy}%
            </span>
          </div>
          
          <div className="w-24 text-center px-4 text-sm text-emerald-600 font-medium">
            {node.stats.mastered_count}
          </div>
          
          <div className="w-24 text-center px-4 text-sm text-red-600 font-medium">
            {node.stats.at_risk_count}
          </div>
        </div>
        
        {isExpanded && hasChildren && Object.values(node.children).map(child => renderNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('studentDetail.analytics.skillTree')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('studentDetail.analytics.skillTreeDesc')}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="flex-1 px-4">{t('studentDetail.analytics.topicSkill')}</div>
            <div className="w-28 text-center px-4">{t('studentDetail.analytics.accuracy')}</div>
            <div className="w-24 text-center px-4 text-emerald-600">Mastered</div>
            <div className="w-24 text-center px-4 text-red-600">At Risk</div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {Object.values(tree).map(node => renderNode(node, 0))}
          </div>
        </div>
      </div>
    </div>
  );
};
