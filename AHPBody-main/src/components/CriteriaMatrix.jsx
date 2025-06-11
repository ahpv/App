import React, { useState } from "react";
import { formatValue, parseInput } from "../utils/inputUtils";
import { normalizeMatrix, calculateCR } from "../utils/ahpUtils";

const CriteriaMatrix = ({ criteria, criteriaMatrix, setCriteriaMatrix }) => {
  const [ciValue, setCiValue] = useState(null);
  const [lambdaMaxValue, setLambdaMaxValue] = useState(null);
  const [crValue, setCrValue] = useState(null);
  const [normalizedMatrix, setNormalizedMatrix] = useState(null);
  const [weights, setWeights] = useState(null);
  const [consistencyVector, setConsistencyVector] = useState(null);

  // Danh sách giá trị cho dropdown (bao gồm phân số và số nguyên từ 1/9 đến 9)
  const comparisonValues = [
    "1/9", "1/8", "1/7", "1/6", "1/5", "1/4", "1/3", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ];

  const handleCriteriaChange = (i, j, value) => {
    const val = parseInput(value);
    if (val === null || val <= 0) return;

    setCriteriaMatrix((prevMatrix) => {
      const newMatrix = prevMatrix.map((row) => [...row]);
      newMatrix[i][j] = val;
      newMatrix[j][i] = 1 / val;
      return newMatrix;
    });
  };

  const calculateCI = () => {
    const { normalized, weights } = normalizeMatrix(criteriaMatrix);
    const { lambdaMax, CI, CR } = calculateCR(criteriaMatrix, weights);

    // Tính vector nhất quán
    const weightedSum = criteriaMatrix.map((row, i) =>
      row.reduce((sum, val, j) => sum + val * weights[j], 0)
    );
    const consistencyVec = weightedSum.map((val, i) => val / weights[i]);

    setNormalizedMatrix(normalized);
    setWeights(weights);
    setConsistencyVector(consistencyVec);
    setCiValue(CI.toFixed(4));
    setLambdaMaxValue(lambdaMax.toFixed(4));
    setCrValue(CR.toFixed(4));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">
        Ma trận So sánh Cặp Tiêu chí
      </h2>
      <p className="text-sm text-gray-600 mb-2">
        Lưu ý: Chỉ có thể chỉnh sửa phần trên đường chéo chính (tam giác trên). Giá trị đối xứng sẽ tự động cập nhật.
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 p-2"></th>
            {criteria.map((crit) => (
              <th key={crit} className="border border-gray-400 p-2">
                {crit}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteriaMatrix.map((row, i) => (
            <tr key={i}>
              <td className="border border-gray-400 p-2 font-medium">{criteria[i]}</td>
              {row.map((val, j) => (
                <td key={j} className="border border-gray-400 p-2">
                  <select
                    value={formatValue(val)}
                    onChange={(e) => handleCriteriaChange(i, j, e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    disabled={i >= j} // Disable nếu là đường chéo (i === j) hoặc tam giác dưới (i > j)
                    style={i >= j ? { backgroundColor: "#f0f0f0" } : {}}
                  >
                    <option value="" disabled>Chọn giá trị</option>
                    {comparisonValues.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          onClick={calculateCI}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Tính CI
        </button>
        {normalizedMatrix && (
          <div className="mt-4">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 p-2">Tiêu chí</th>
                  {criteria.map((crit) => (
                    <th key={crit} className="border border-gray-400 p-2">
                      {crit}
                    </th>
                  ))}
                  <th className="border border-gray-400 p-2">Sum Weight</th>
                  <th className="border border-gray-400 p-2">Trọng số PA</th>
                  <th className="border border-gray-400 p-2">Consistency vector</th>
                </tr>
              </thead>
              <tbody>
                {normalizedMatrix.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-gray-400 p-2">{criteria[i]}</td>
                    {row.map((val, j) => (
                      <td key={j} className="border border-gray-400 p-2">
                        {val.toFixed(4)}
                      </td>
                    ))}
                    <td className="border border-gray-400 p-2">
                      {(criteriaMatrix[i].reduce((sum, val) => sum + val, 0) / criteria.length).toFixed(4)}
                    </td>
                    <td className="border border-gray-400 p-2">
                      {(weights[i] || 0).toFixed(4)}
                    </td>
                    <td className="border border-gray-400 p-2">
                      {(consistencyVector[i] || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={criteria.length + 1} className="border border-gray-400 p-2"></td>
                  <td className="border border-gray-400 p-2 font-bold">λ<sub>max</sub></td>
                  <td className="border border-gray-400 p-2">{lambdaMaxValue}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={criteria.length + 1} className="border border-gray-400 p-2"></td>
                  <td className="border border-gray-400 p-2 font-bold">CI (Consistency Index)</td>
                  <td className="border border-gray-400 p-2">{ciValue}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={criteria.length + 1} className="border border-gray-400 p-2"></td>
                  <td className="border border-gray-400 p-2 font-bold">CR</td>
                  <td className="border border-gray-400 p-2">{crValue}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriteriaMatrix;