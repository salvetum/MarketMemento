import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

const roots = new Map();

function chartTheme() {
  const styles = getComputedStyle(document.documentElement);
  const text = styles.getPropertyValue('--muted').trim() || '#91a5b5';
  const line = styles.getPropertyValue('--line-strong').trim() || 'rgba(193, 231, 255, .21)';
  return {
    textColor: text,
    fontSize: 11,
    axis: {
      ticks: { text: { fill: text } },
      legend: { text: { fill: text } }
    },
    grid: { line: { stroke: line, strokeDasharray: '4 4' } },
    legends: { text: { fill: text } },
    labels: { text: { fill: text } },
    tooltip: { container: { background: styles.getPropertyValue('--glass-strong').trim(), color: styles.getPropertyValue('--text').trim() } }
  };
}

function titleFor(options) {
  return options?.title?.text || '';
}

function ChartFrame({ title, children }) {
  return (
    <div className="nivo-chart-frame">
      {title ? <h2 className="nivo-chart-title">{title}</h2> : null}
      <div className="nivo-chart-canvas">{children}</div>
    </div>
  );
}

function ChartViewport({ children }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight
      });
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="nivo-chart-canvas">
      {size.width > 0 && size.height > 0 ? children : null}
    </div>
  );
}

function LineChart({ options }) {
  const rawSeries = options.series || [];
  const timeline = rawSeries[0]?.data?.some(point => Array.isArray(point) && Number(point[0]) > 1000000000);
  const series = rawSeries.map(item => ({
    id: item.name,
    data: (item.data || []).map((point, index) => {
      const value = Array.isArray(point)
        ? point
        : [options.xaxis?.categories?.[index] ?? index, point];
      return { x: timeline && typeof value[0] === 'number' ? new Date(value[0]) : value[0], y: Number(value[1]) || 0 };
    })
  }));
  return (
    <ChartFrame title={titleFor(options)}>
      <ChartViewport>
        {series.length && series.some(item => item.data.length) ? (
          <ResponsiveLine
            data={series}
            margin={{ top: 8, right: 18, bottom: 48, left: 52 }}
            xScale={timeline ? { type: 'time', format: 'native', precision: 'month' } : { type: 'point' }}
            xFormat={timeline ? 'time:%b %y' : undefined}
            yScale={{ type: 'linear', min: options.yaxis?.min ?? 'auto', max: options.yaxis?.max ?? 'auto', stacked: false, reverse: false }}
            curve="monotoneX"
            colors={options.colors || ['#67c1f5', '#a684ff', '#57e6a5', '#ffb45f']}
            enableArea={options.chart?.type === 'area'}
            areaOpacity={0.14}
            lineWidth={2.5}
            pointSize={options.chart?.type === 'line' ? 5 : 0}
            pointBorderWidth={0}
            enableGridX={false}
            useMesh
            theme={chartTheme()}
            axisBottom={{ tickRotation: 0, tickSize: 5, tickPadding: 8, format: timeline ? value => new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' }).format(new Date(value)) : undefined }}
            axisLeft={{ tickSize: 5, tickPadding: 8 }}
            legends={[{ anchor: 'top-right', direction: 'row', translateY: -4, itemWidth: 90, itemHeight: 18, symbolSize: 10 }]}
            role="img"
            ariaLabel={titleFor(options)}
          />
        ) : <p className="nivo-empty">{options.noData?.text || 'No data'}</p>}
      </ChartViewport>
    </ChartFrame>
  );
}

function PieChart({ options }) {
  const data = (options.labels || []).map((label, index) => ({ id: label, label, value: Number(options.series?.[index]) || 0 }));
  return (
    <ChartFrame title={titleFor(options)}>
      <ChartViewport>
        {data.some(item => item.value) ? (
          <ResponsivePie
            data={data}
            margin={{ top: 12, right: 18, bottom: 42, left: 18 }}
            innerRadius={0.68}
            padAngle={1.5}
            cornerRadius={5}
            activeOuterRadiusOffset={5}
            colors={options.colors || ['#a684ff', '#67c1f5']}
            borderWidth={0}
            arcLinkLabelsSkipAngle={10}
            arcLabelsSkipAngle={12}
            arcLabelsTextColor="#ffffff"
            enableArcLinkLabels={false}
            legends={[{ anchor: 'bottom', direction: 'row', justify: false, translateY: 38, itemsSpacing: 14, itemWidth: 90, itemHeight: 18, symbolSize: 10 }]}
            theme={chartTheme()}
            role="img"
            ariaLabel={titleFor(options)}
          />
        ) : <p className="nivo-empty">{options.noData?.text || 'No data'}</p>}
      </ChartViewport>
    </ChartFrame>
  );
}

function BarChart({ options }) {
  const categories = options.xaxis?.categories || [];
  const values = options.series?.[0]?.data || [];
  const data = categories.map((label, index) => ({ label, value: Number(values[index]) || 0 }));
  const horizontal = Boolean(options.plotOptions?.bar?.horizontal);
  return (
    <ChartFrame title={titleFor(options)}>
      <ChartViewport>
        {data.length ? (
          <ResponsiveBar
            data={data}
            keys={['value']}
            indexBy="label"
            layout={horizontal ? 'horizontal' : 'vertical'}
            margin={{ top: 8, right: 18, bottom: horizontal ? 36 : 62, left: horizontal ? 112 : 52 }}
            padding={0.34}
            borderRadius={6}
            colors={options.colors || ['#57e6a5']}
            enableLabel={false}
            enableGridX={horizontal}
            enableGridY={!horizontal}
            theme={chartTheme()}
            axisBottom={{ tickSize: 5, tickPadding: 8, tickRotation: horizontal ? 0 : -32 }}
            axisLeft={{ tickSize: 5, tickPadding: 8 }}
            valueScale={{ type: 'linear' }}
            valueFormat={value => Number(value).toLocaleString()}
            role="img"
            ariaLabel={titleFor(options)}
          />
        ) : <p className="nivo-empty">{options.noData?.text || 'No data'}</p>}
      </ChartViewport>
    </ChartFrame>
  );
}

export function NivoChart({ options }) {
  const type = options?.chart?.type;
  if (type === 'donut' || type === 'pie') return <PieChart options={options} />;
  if (type === 'bar') return <BarChart options={options} />;
  return <LineChart options={options} />;
}

export function renderNivoChart(id, options) {
  const container = document.getElementById(id);
  if (!container) return { destroy() {} };
  const existing = roots.get(id);
  existing?.unmount();
  container.replaceChildren();
  const root = createRoot(container);
  roots.set(id, root);
  root.render(<NivoChart options={options} />);
  return {
    updateOptions() {
      root.render(<NivoChart options={options} />);
    },
    destroy() {
      if (roots.get(id) === root) roots.delete(id);
      root.unmount();
      if (container.isConnected) container.replaceChildren();
    }
  };
}
