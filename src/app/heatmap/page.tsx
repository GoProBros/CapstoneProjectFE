/**
 * Heatmap Page
 * Dedicated page for market heatmap view
 */

import { Metadata } from 'next';
import { MarketHeatmapModule } from '@/components/Heatmap/MarketHeatmapModule';

export const metadata: Metadata = {
  title: 'Market Heatmap | GreenDragon Trading',
  description: 'Real-time market heatmap showing price changes across all Vietnamese stocks',
};

export default function HeatmapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MarketHeatmapModule />
    </div>
  );
}
