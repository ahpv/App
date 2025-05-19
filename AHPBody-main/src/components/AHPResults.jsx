import React from "react";

const AHPResults = ({ results, criteria, alternatives, isLoadingAHP }) => {
  if (!results || isLoadingAHP) return null;

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
      <p>
        Tỷ lệ Nhất quán Tiêu chí (CR): {results.criteriaCR.CR.toFixed(4)}
        {results.criteriaCR.CR < 0.1 ? " (Nhất quán)" : " (Không nhất quán)"}
      </p>

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
      <table className="w-full border-collapse">
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
    </div>
  );
};

export default AHPResults;
