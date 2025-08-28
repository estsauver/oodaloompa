import React from 'react';
import { Compass, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import type { Card, OrientContent } from '../../types/index';
import { api } from '../../services/api';

interface OrientCardProps {
  card: Card;
}

export const OrientCard: React.FC<OrientCardProps> = ({ card }) => {
  const content = card.content as OrientContent;

  const handleTaskSelection = async (task: any) => {
    await api.logTelemetry('orient_selection', { 
      card_id: card.id,
      task_id: task.id 
    });
    // In real implementation, would open the selected task
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.5) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Choose Next Task</h3>
        </div>
        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
          Orient
        </span>
      </div>

      <div className="space-y-3">
        {content.nextTasks.map((task, index) => (
          <button
            key={task.id}
            onClick={() => handleTaskSelection(task)}
            className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 text-sm font-bold rounded">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{task.rationale}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex gap-4 ml-9 mt-3">
              <div className="flex items-center gap-1">
                <AlertCircle className={`w-4 h-4 ${getScoreColor(task.urgencyScore)}`} />
                <span className="text-xs text-gray-600">
                  Urgency: <span className={getScoreColor(task.urgencyScore)}>
                    {(task.urgencyScore * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className={`w-4 h-4 ${getScoreColor(task.impactScore)}`} />
                <span className="text-xs text-gray-600">
                  Impact: <span className={getScoreColor(task.impactScore)}>
                    {(task.impactScore * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};