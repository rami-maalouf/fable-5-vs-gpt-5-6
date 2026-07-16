import { TwilightPlaceholderScreen } from '@/components/twilight-placeholder-screen';

import { DashboardWeekChartSpike } from '../../spikes/chart-approach/DashboardWeekChartSpike';

export default function MetricsScreen() {
  return (
    <TwilightPlaceholderScreen
      eyebrow="insights"
      title="Metrics"
      body="overview stats, trends, consistency, recovery, and behavior charts will land here.">
      {__DEV__ ? <DashboardWeekChartSpike /> : null}
    </TwilightPlaceholderScreen>
  );
}
