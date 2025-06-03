import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Đăng ký các thành phần cần thiết cho Chart.js và plugin datalabels
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const AHPResults = ({ results, criteria, alternatives, isLoadingAHP }) => {
  if (!results || isLoadingAHP) return null;

  // Dữ liệu cho biểu đồ tròn Điểm Tổng thể
  const globalScoresPieData = {
    labels: results.globalScores.map((result) => result.name),
    datasets: [
      {
        data: results.globalScores.map((result) => result.score),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ].slice(0, results.globalScores.length),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  // Dữ liệu cho biểu đồ tròn Trọng số Tiêu chí
  const criteriaWeightsPieData = {
    labels: criteria,
    datasets: [
      {
        data: results.criteriaWeights,
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ].slice(0, criteria.length),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  // Tùy chọn chung cho biểu đồ tròn
  const pieChartOptions = {
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
          },
          color: "#333",
          // Hiển thị phần trăm trong chú thích
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = (value * 100).toFixed(2);
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: isNaN(value) || chart.getDataVisibility(i) === false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${(value * 100).toFixed(2)}%`;
          },
        },
      },
      datalabels: {
        // Hiển thị phần trăm trực tiếp trên các phần của biểu đồ
        formatter: (value) => {
          return `${(value * 100).toFixed(2)}%`;
        },
        color: "#fff",
        font: {
          weight: "bold",
          size: 12,
        },
        textAlign: "center",
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Kết quả AHP</h2>

      {/* Criteria Weights */}
      <h3 className="text-lg font-medium mb-2">Trọng số Tiêu chí</h3>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="bg-gray-200">
            {criteria.map((crit) => (
              <th key={crit} className="border p-2">
                {crit}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {results.criteriaWeights.map((weight, i) => (
              <td key={i} className="border p-2 text-center">
                {weight.toFixed(4)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mb-4">
        Tỷ lệ Nhất quán Tiêu chí (CR): {results.criteriaCR.CR.toFixed(4)}
        {results.criteriaCR.CR < 0.1 ? " (Nhất quán)" : " (Không nhất quán)"}
      </p>
      {/* Pie Chart for Criteria Weights */}
      <h3 className="text-lg font-medium mb-2">Biểu đồ Tròn Trọng số Tiêu chí</h3>
      <div className="w-full h-80 mb-6">
        <Pie data={criteriaWeightsPieData} options={pieChartOptions} />
      </div>

      {/* Alternative Weights */}
      <h3 className="text-lg font-medium mb-2 mt-6">
        Trọng số Phương án theo Tiêu chí
      </h3>
      {criteria.map((criterion) => (
        <div key={criterion} className="mb-4">
          <h4 className="font-medium">{criterion}</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                {alternatives.map((alt) => (
                  <th key={alt} className="border p-2">
                    {alt}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {results.alternativeWeights[criterion].map((weight, i) => (
                  <td key={i} className="border p-2 text-center">
                    {weight.toFixed(4)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p>
            CR: {results.alternativeCRs[criterion].CR.toFixed(4)}
            {results.alternativeCRs[criterion].CR < 0.1
              ? " (Nhất quán)"
              : " (Không nhất quán)"}
          </p>
        </div>
      ))}

      {/* Global Scores */}
      <h3 className="text-lg font-medium mb-2 mt-6">
        Điểm Tổng thể và Xếp hạng
      </h3>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nguy cơ Sức khỏe</th>
            <th className="border p-2">Điểm</th>
            <th className="border p-2">Xếp hạng</th>
          </tr>
        </thead>
        <tbody>
          {results.globalScores.map((result) => (
            <tr key={result.name}>
              <td className="border p-2">{result.name}</td>
              <td className="border p-2">{result.score.toFixed(4)}</td>
              <td className="border p-2">{result.rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pie Chart for Global Scores */}
      <h3 className="text-lg font-medium mb-2">Biểu đồ Tròn Điểm Tổng thể</h3>
      <div className="w-full h-80">
        <Pie data={globalScoresPieData} options={pieChartOptions} />
      </div>
    </div>
  );
};

export default AHPResults;