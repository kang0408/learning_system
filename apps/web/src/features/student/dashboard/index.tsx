import React from 'react';
import { HeroSection } from './components/HeroSection';
import { ActionItems } from './components/ActionItems';
import { DashboardStats } from './components/DashboardStats';
import { FocusAreas } from './components/FocusAreas';
import { useDashboardData } from './hooks/useDashboardData';

export const StudentDashboardFeature: React.FC = () => {
  const { analytics, assignments, weakTopics, dailySchedule } = useDashboardData();

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      <HeroSection analytics={analytics} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <ActionItems 
          assignments={assignments} 
          dailySchedule={dailySchedule} 
        />
        
        <section className="lg:col-span-5 space-y-12">
          <DashboardStats analytics={analytics} />
          <FocusAreas weakTopics={weakTopics} />
        </section>
      </div>
    </div>
  );
};

export default StudentDashboardFeature;
