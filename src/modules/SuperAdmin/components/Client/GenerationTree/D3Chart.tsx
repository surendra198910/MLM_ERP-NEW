import React, { useEffect, useRef } from "react";
import { OrgChart } from "d3-org-chart";

interface OrgNode {
  id: string;
  parentId?: string | null;
  template: string;
}

interface Props {
  data: OrgNode[] | null;
}

const OrgChartComponent: React.FC<Props> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!data || !data.length || !chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = new OrgChart();
    }

    const chart = chartInstance.current;

    chart
      .container(chartRef.current)
      .data(data)
      .nodeWidth(() => 180)
      .nodeHeight(() => 180)
      .childrenMargin(() => 70)
      .siblingsMargin(() => 50)
      .neighbourMargin(() => 30)
      .layout("top")
      .compact(false)
      .nodeContent((d: any) => d.data.template)
      .onNodeClick((d: any) => {
        chart
          .collapseAll()
          .setExpanded(d.id)
          .setCentered(d.id)
          .render();
      })
      .render()
      .fit(); // ✅ auto size perfectly

    return () => {
      chart.container(null);
    };
  }, [data]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        background: "#FFFFFF",
      }}
    >
      <div ref={chartRef} />
    </div>
  );
};

export default OrgChartComponent;
