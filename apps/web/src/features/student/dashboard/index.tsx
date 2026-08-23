import React, { useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { SmartFocus } from './components/SmartFocus';
import { ActionItems } from './components/ActionItems';
import { DashboardStats } from './components/DashboardStats';
import { FocusAreas } from './components/FocusAreas';
import { useDashboardData } from './hooks/useDashboardData';

export const StudentDashboardFeature: React.FC = () => {
  const { analytics, assignments, weakTopics, dailySchedule, summary, topicsTree } = useDashboardData();
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string | null>(null);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <HeroSection analytics={analytics} />

      {/* Smart Focus: Top 3 Urgent Actions & Daily Batch */}
      <SmartFocus summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <ActionItems 
          assignments={assignments} 
          dailySchedule={dailySchedule}
          topicsTree={topicsTree}
          selectedTopicFilter={selectedTopicFilter}
          onClearTopicFilter={() => setSelectedTopicFilter(null)}
        />
        
        <section className="lg:col-span-5 space-y-12">
          <DashboardStats analytics={analytics} />
          <FocusAreas 
            weakTopics={weakTopics} 
            topicsTree={topicsTree}
            selectedTopic={selectedTopicFilter}
            onSelectTopic={(t) => setSelectedTopicFilter(t)}
          />
        </section>
      </div>
    </div>
  );
};

export default StudentDashboardFeature;

