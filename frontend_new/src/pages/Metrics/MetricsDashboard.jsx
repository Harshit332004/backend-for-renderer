import React from 'react';
import { motion } from 'framer-motion';

// Chart Components
import VendorPerformanceByRegion from '@/components/metrics/VendorPerformanceByRegion';
import AIProcurementImpact from '@/components/metrics/AIProcurementImpact';
import CostSavingsByVendor from '@/components/metrics/CostSavingsByVendor';
import RiskVsCompliance from '@/components/metrics/RiskVsCompliance';
import CompetitorPricingTrends from '@/components/metrics/CompetitorPricingTrends';
import MarketDemandIndex from '@/components/metrics/MarketDemandIndex';
import AIResponseTime from '@/components/metrics/AIResponseTime';
import ActualVsForecast from '@/components/metrics/ActualVsForecast';
import InventoryLevelOverTime from '@/components/metrics/InventoryLevelOverTime';
import ForecastErrorDistribution from '@/components/metrics/ForecastErrorDistribution';

/**
 * Reusable chart card wrapper.
 */
function ChartCard({ title, subtitle, children, fullWidth = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-card border border-border rounded-xl p-5 shadow-sm relative ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}
    >
      {/* Live data badge */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Data from live DB
        </span>
      </div>
      <h3 className="text-base font-bold text-foreground pr-28">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">{subtitle}</p>
      {children}
    </motion.div>
  );
}

/**
 * Section header component.
 */
function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-4">
      <span className="text-lg">{icon}</span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex-1 h-px bg-border ml-2" />
    </div>
  );
}

export default function MetricsDashboard() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Professor's Agentic AI Metrics — KiranaIQ
        </p>
      </motion.div>

      {/* ── Section 1: Vendor Intelligence ── */}
      <SectionHeader title="Vendor Intelligence" icon="🏢" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard
          title="Vendor Performance Score by Region"
          subtitle="Distribution of vendor performance scores across geographic regions"
        >
          <VendorPerformanceByRegion />
        </ChartCard>
        <ChartCard
          title="Risk Level vs Vendor Compliance"
          subtitle="Compliance score distributions across vendor risk categories"
        >
          <RiskVsCompliance />
        </ChartCard>
      </div>

      {/* ── Section 2: AI Optimization Impact ── */}
      <SectionHeader title="AI Optimization Impact" icon="🤖" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard
          title="Agentic AI Recommendation Impact on Procurement Success"
          subtitle="Procurement success values for AI-recommended vs non-recommended orders"
        >
          <AIProcurementImpact />
        </ChartCard>
        <ChartCard
          title="Cost Savings from Agentic Optimization by Vendor"
          subtitle="Percentage cost savings achieved through AI-recommended procurement by vendor"
        >
          <CostSavingsByVendor />
        </ChartCard>
      </div>

      {/* ── Section 3: Market Intelligence ── */}
      <SectionHeader title="Market Intelligence" icon="📊" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard
          title="Competitor Pricing Trends Over 30 Days"
          subtitle="Tracking average unit prices across competitors for a specific product"
        >
          <CompetitorPricingTrends />
        </ChartCard>
        <ChartCard
          title="Market Demand Index (Hyperlocal) Over Time"
          subtitle="Hyperlocal demand signals aggregated from competitor activity"
        >
          <MarketDemandIndex />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <ChartCard
          title="Avg Agentic AI Response Time to Market Changes"
          subtitle="Average time for AI to generate a recommendation after a market event (with std deviation)"
        >
          <AIResponseTime />
        </ChartCard>
      </div>

      {/* ── Section 4: Inventory & Forecasting ── */}
      <SectionHeader title="Inventory & Forecasting" icon="📦" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard
          title="Demand Forecasting Accuracy"
          subtitle="Actual demand vs AI-predicted demand over time for a specific product"
        >
          <ActualVsForecast />
        </ChartCard>
        <ChartCard
          title="Inventory Level Over Time"
          subtitle="Historical stock levels with depletion patterns and restocking events"
        >
          <InventoryLevelOverTime />
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <ChartCard
          title="Forecast Error Distribution by Product"
          subtitle="Distribution of forecast errors (actual - predicted) across products. Line at 0 = perfect accuracy."
          fullWidth
        >
          <ForecastErrorDistribution />
        </ChartCard>
      </div>
    </div>
  );
}
