import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

export default function MetricsScreen() {
  const [DashboardWeekChartSpike, setDashboardWeekChartSpike] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (__DEV__) {
      void import('../../spikes/chart-approach/DashboardWeekChartSpike').then((module) => {
        setDashboardWeekChartSpike(() => module.DashboardWeekChartSpike);
      });
    }
  }, []);

  return (
    <TwilightPlaceholderScreen
      eyebrow="insights"
      title="Metrics"
      body="overview stats, trends, consistency, recovery, and behavior charts will land here.">
      {DashboardWeekChartSpike ? <DashboardWeekChartSpike /> : null}
    </TwilightPlaceholderScreen>
  );
}
