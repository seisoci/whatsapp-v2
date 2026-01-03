'use client';

import { useState, useEffect, useRef } from 'react';
import { getOnuRxPowerGraph } from '@/lib/sanctum-api';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { PiArrowCounterClockwiseBold } from 'react-icons/pi';

// Register Chart.js components
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

interface RxPowerGraphProps {
  onuId: string;
  onuName: string;
}

const DEFAULT_SPAN_MS = 24 * 3600 * 1000; // 24 hours
const TARGET_POINTS = 700;
const NICE_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400];

type PeriodType = 'hourly' | 'daily' | 'monthly' | 'yearly';

export default function RxPowerGraph({ onuId, onuName }: RxPowerGraphProps) {
  const [hasData, setHasData] = useState(false); // Start with false to prevent double render
  const [legendHtml, setLegendHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('hourly');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current time in Asia/Jakarta timezone (GMT+7)
  const getNowInJakarta = () => {
    const now = new Date();
    // Convert to Jakarta time by getting UTC time and adding 7 hours
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return jakartaTime.getTime();
  };

  // Use refs instead of state to avoid re-renders during scroll
  const fromMsRef = useRef(getNowInJakarta() - DEFAULT_SPAN_MS);
  const toMsRef = useRef(getNowInJakarta());

  const stepForSpan = (spanMs: number) => {
    const s = Math.max(1, Math.floor((spanMs / 1000) / TARGET_POINTS));
    for (let i = 0; i < NICE_STEPS.length; i++) {
      if (NICE_STEPS[i] >= s) {
        return NICE_STEPS[i];
      }
    }
    return 14400;
  };

  const formatRxPower = (value: number): string => {
    return `${value.toFixed(2)} dBm`;
  };

  const generateLegend = (chart: Chart) => {
    const datasets = chart.data.datasets;
    let html = '<div style="display: flex; justify-content: space-between; align-items: flex-start;">';
    html += '<ul style="list-style: none; padding: 0; margin: 0; flex: 1;">';

    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      const data = dataset.data as any[];

      // Calculate Current (last non-null value) and Minimum (worst signal)
      let current: number | null = null;
      let minimum: number | null = null;

      for (let j = 0; j < data.length; j++) {
        const val = data[j].y;
        if (val !== null && val !== undefined && !isNaN(val)) {
          current = val;
          if (minimum === null || val < minimum) {
            minimum = val;
          }
        }
      }

      const currentStr = current !== null ? formatRxPower(current) : 'N/A';
      const minimumStr = minimum !== null ? formatRxPower(minimum) : 'N/A';

      html += '<li>';
      html += `<span style="display: inline-block; width: 12px; height: 12px; background-color: ${dataset.backgroundColor}; margin-right: 5px;"></span>`;
      html += `<span>${dataset.label}</span>`;
      html += `<span style="margin-left: 10px; opacity: 0.7;">Current: ${currentStr}</span>`;
      html += `<span style="margin-left: 10px; opacity: 0.7;">Minimum: ${minimumStr}</span>`;
      html += '</li>';
    }

    html += '</ul>';
    html += '</div>';

    return html;
  };

  const fetchSeries = async (from: number, to: number) => {
    try {
      setIsLoading(true);
      const stepSec = stepForSpan(to - from);
      const response = await getOnuRxPowerGraph(
        onuId,
        Math.floor(from / 1000),
        Math.floor(to / 1000),
        stepSec
      );

      if (response.code === 200) {
        let datasets: any[] = [];

        if (response.series && response.series.length > 0) {
          datasets = response.series.map((s: any, index: number) => {
            // Different colors for ONU and OLT RX Power
            const colors = ['#10B981', '#3B82F6']; // Green for ONU, Blue for OLT
            return {
              label: s.name,
              data: s.points.map((p: any) => ({ x: p[0], y: p[1] })),
              pointRadius: 0,
              borderWidth: 2,
              borderColor: colors[index] || '#10B981',
              backgroundColor: colors[index] || '#10B981',
              fill: false,
              tension: 0,
              spanGaps: false,
            };
          });
        } else {
          // Create empty dataset to show time axis even with no data
          datasets = [
            {
              label: 'ONU RX Power',
              data: [],
              pointRadius: 0,
              borderWidth: 2,
              borderColor: '#10B981',
              backgroundColor: '#10B981',
              fill: false,
              tension: 0,
              spanGaps: false,
            },
            {
              label: 'OLT RX Power',
              data: [],
              pointRadius: 0,
              borderWidth: 2,
              borderColor: '#3B82F6',
              backgroundColor: '#3B82F6',
              fill: false,
              tension: 0,
              spanGaps: false,
            }
          ];
        }

        updateChart(datasets);
        setHasData(true);
      } else {
        setHasData(false);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      }
    } catch (err: any) {
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChart = (datasets: any[]) => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      // Only update datasets, keep the current scale (don't reset from state)
      chartInstanceRef.current.data.datasets = datasets;
      chartInstanceRef.current.update();
      setLegendHtml(generateLegend(chartInstanceRef.current));
    } else {
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `${onuName} RX Power`,
              font: { size: 14, weight: 'bold' as const }
            },
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  const value = context.parsed.y;
                  label += formatRxPower(value);
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                tooltipFormat: 'MMM d, HH:mm',
                displayFormats: {
                  minute: 'MMM d, HH:mm',
                  hour: 'MMM d, HH:mm',
                  day: 'MMM d'
                }
              },
              min: fromMsRef.current,
              max: toMsRef.current,
              ticks: {
                maxTicksLimit: 6,
                maxRotation: 0,
                minRotation: 0,
                padding: 5,
                callback: function(value) {
                  const date = new Date(value);
                  const today = new Date();
                  const isToday = date.getDate() === today.getDate() &&
                                  date.getMonth() === today.getMonth() &&
                                  date.getFullYear() === today.getFullYear();

                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  const timeStr = `${hours}:${minutes}`;

                  if (isToday) {
                    return timeStr;
                  } else {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthStr = months[date.getMonth()];
                    const dayStr = date.getDate();
                    return `${monthStr} ${dayStr}, ${timeStr}`;
                  }
                }
              },
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: false,
              ticks: {
                maxTicksLimit: 6,
                padding: 5,
                callback: function(value) {
                  return Number(value).toFixed(1);
                }
              },
              title: {
                display: true,
                text: 'dBm'
              },
              grid: {
                display: false
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });

      setLegendHtml(generateLegend(chartInstanceRef.current));

      // Setup chart interactions (pan with mouse drag)
      setupChartInteractions();
    }
  };

  const setupChartInteractions = () => {
    if (!chartRef.current || !chartInstanceRef.current) return;

    const canvas = chartRef.current;
    let dragging = false;
    let startX = 0;
    let startMin = 0;
    let startMax = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (!chartInstanceRef.current) return;
      dragging = true;
      startX = e.clientX;
      canvas.style.cursor = 'grabbing';
      const xScale = chartInstanceRef.current.scales['x'];
      if (xScale) {
        startMin = xScale.min;
        startMax = xScale.max;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !chartInstanceRef.current) return;
      const dx = e.clientX - startX;
      const chart = chartInstanceRef.current;
      const xScale = chart.scales['x'];
      if (!xScale) return;

      const t0 = xScale.getValueForPixel(xScale.left);
      const t1 = xScale.getValueForPixel(xScale.left - dx);
      const shift = t1 - t0;

      const newFromMs = startMin + shift;
      const newToMs = startMax + shift;

      // Update chart immediately
      chartInstanceRef.current.options.scales!.x!.min = newFromMs;
      chartInstanceRef.current.options.scales!.x!.max = newToMs;
      chartInstanceRef.current.update('none');
    };

    const handleMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      if (chartRef.current) {
        chartRef.current.style.cursor = 'grab';
      }

      // Fetch new data with current scale values
      if (chartInstanceRef.current) {
        const xScale = chartInstanceRef.current.scales['x'];
        if (xScale) {
          fetchSeries(xScale.min, xScale.max);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!chartInstanceRef.current) return;

      const xScale = chartInstanceRef.current.scales['x'];
      if (!xScale) return;

      // Get current values from scale
      const currentFromMs = xScale.min;
      const currentToMs = xScale.max;
      const span = currentToMs - currentFromMs;
      const stepSec = stepForSpan(span);
      const scrollAmount = stepSec * 1000 * 2; // Scroll by 2 steps (slower scroll)

      let newFromMs: number;
      let newToMs: number;

      if (e.deltaY > 0) {
        // Scroll down = move graph left (backward in time)
        newFromMs = currentFromMs - scrollAmount;
        newToMs = currentToMs - scrollAmount;
      } else {
        // Scroll up = move graph right (forward in time)
        newFromMs = currentFromMs + scrollAmount;
        newToMs = currentToMs + scrollAmount;
      }

      // Update chart scale directly for smooth visual feedback
      chartInstanceRef.current.options.scales!.x!.min = newFromMs;
      chartInstanceRef.current.options.scales!.x!.max = newToMs;
      chartInstanceRef.current.update('none');

      // Debounce fetch
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        fetchSeries(newFromMs, newToMs);
      }, 500);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  };

  const handleReset = () => {
    const now = getNowInJakarta();
    const newFromMs = now - DEFAULT_SPAN_MS;
    const newToMs = now;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.options.scales!.x!.min = newFromMs;
      chartInstanceRef.current.options.scales!.x!.max = newToMs;
      chartInstanceRef.current.update('none');
    }

    fetchSeries(newFromMs, newToMs);
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    setShowPeriodMenu(false);

    const now = getNowInJakarta();
    let newFromMs: number;

    switch (newPeriod) {
      case 'hourly':
        newFromMs = now - (24 * 3600 * 1000); // 24 hours
        break;
      case 'daily':
        newFromMs = now - (7 * 24 * 3600 * 1000); // 7 days
        break;
      case 'monthly':
        newFromMs = now - (30 * 24 * 3600 * 1000); // 30 days
        break;
      case 'yearly':
        newFromMs = now - (365 * 24 * 3600 * 1000); // 365 days
        break;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.options.scales!.x!.min = newFromMs;
      chartInstanceRef.current.options.scales!.x!.max = now;
      chartInstanceRef.current.update('none');
    }

    fromMsRef.current = newFromMs;
    toMsRef.current = now;

    fetchSeries(newFromMs, now);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'hourly':
        return 'Hourly';
      case 'daily':
        return 'Daily';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
    }
  };

  useEffect(() => {
    fetchSeries(fromMsRef.current, toMsRef.current);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [onuId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPeriodMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.period-dropdown')) {
          setShowPeriodMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPeriodMenu]);

  return (
    <div className="graph-item">
      <div id="onu_rxpower_container">
        <div id="onu_rxpower_wrap" className="rounded-lg border border-gray-200 bg-white p-4">
          {isLoading && !chartInstanceRef.current && (
            <div className="flex items-center justify-center" style={{ height: '170px' }}>
              <div className="text-sm text-gray-500">Loading RX Power data...</div>
            </div>
          )}

          {!hasData && !isLoading && (
            <div className="text-center" style={{ height: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="text-sm text-gray-500">Graph data is not yet available for this device.</div>
            </div>
          )}

          <div id="onu_rxpower_chart_container" className="bg-gray-100 p-2" style={{ height: '170px', cursor: 'grab', display: hasData ? 'block' : 'none' }}>
            <canvas ref={chartRef} />
          </div>

          {hasData && (
            <div id="onu_rxpower_legend" className="mt-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div dangerouslySetInnerHTML={{ __html: legendHtml }} style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '4px', marginLeft: '10px', position: 'relative' }}>
                  {/* Period Dropdown Button */}
                  <div className="period-dropdown" style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                      className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                      title="Select period"
                    >
                      {getPeriodLabel()}
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showPeriodMenu && (
                      <div
                        className="absolute right-0 mt-1 w-32 rounded-md border border-gray-200 bg-white shadow-lg"
                        style={{ top: '100%', zIndex: 50 }}
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handlePeriodChange('hourly')}
                            className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${period === 'hourly' ? 'bg-gray-50 font-medium' : ''}`}
                          >
                            Hourly
                          </button>
                          <button
                            onClick={() => handlePeriodChange('daily')}
                            className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${period === 'daily' ? 'bg-gray-50 font-medium' : ''}`}
                          >
                            Daily
                          </button>
                          <button
                            onClick={() => handlePeriodChange('monthly')}
                            className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${period === 'monthly' ? 'bg-gray-50 font-medium' : ''}`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => handlePeriodChange('yearly')}
                            className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${period === 'yearly' ? 'bg-gray-50 font-medium' : ''}`}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <button
                    id="reset_rxpower_graph"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50"
                    title="Back to 24h view"
                  >
                    <PiArrowCounterClockwiseBold className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
