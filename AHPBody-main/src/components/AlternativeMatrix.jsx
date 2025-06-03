import React, { useState } from "react";
import { formatValue, parseInput } from "../utils/inputUtils";
import { normalizeMatrix, calculateCR } from "../utils/ahpUtils";

const AlternativeMatrix = ({
  criterion,
  alternatives,
  alternativeMatrices,
  setAlternativeMatrices,
}) => {
  const [ciValue, setCiValue] = useState(null);
  const [lambdaMaxValue, setLambdaMaxValue] = useState(null);
  const [crValue, setCrValue] = useState(null);
  const [normalizedMatrix, setNormalizedMatrix] = useState(null);
  const [weights, setWeights] = useState(null);
  const [consistencyVector, setConsistencyVector] = useState(null);

  const handleAlternativeChange = (i, j, value) => {
    const val = parseInput(value);
    if (val === null || val <= 0) return;
    setAlternativeMatrices((prevMatrices) => {
      const newMatrices = { ...prevMatrices };
      const newMatrix = newMatrices[criterion].map((row) => [...row]);
      newMatrix[i][j] = val;
      newMatrix[j][i] = 1 / val;
      newMatrices[criterion] = newMatrix;
      return newMatrices;
    });
  };

  const calculateCI = () => {
    const matrix = alternativeMatrices[criterion];
    const { normalized, weights } = normalizeMatrix(matrix);
    const { lambdaMax, CI, CR } = calculateCR(matrix, weights);

    // Tính vector nhất quán
    const weightedSum = matrix.map((row, i) =>
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
        Ma trận So sánh Cặp Phương án: {criterion}
      </h2>
      <p className="text-sm text-gray-600 mb-2">
        Lưu ý: Nhập giá trị dưới dạng phân số (ví dụ: 1/3) hoặc số thập phân (ví
        dụ: 0.333). Giá trị đối xứng sẽ tự động cập nhật.
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 p-2"></th>
            {alternatives.map((alt) => (
              <th key={alt} className="border border-gray-400 p-2">
                {alt}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alternativeMatrices[criterion].map((row, i) => (
            <tr key={i}>
              <td className="border border-gray-400 p-2 font-medium">{alternatives[i]}</td>
              {row.map((val, j) => (
                <td key={j} className="border border-gray-400 p-2">
                  <input
                    type="text"
                    value={formatValue(val)}
                    onChange={(e) =>
                      handleAlternativeChange(i, j, e.target.value)
                    }
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    placeholder="Nhập 1/3 hoặc 0.333"
                    disabled={i === j}
                    style={i === j ? { backgroundColor: "#f0f0f0" } : {}}
                  />
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
                  <th className="border border-gray-400 p-2">{criterion}</th>
                  {alternatives.map((alt) => (
                    <th key={alt} className="border border-gray-400 p-2">
                      {alt}
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
                    <td className="border border-gray-400 p-2">{alternatives[i]}</td>
                    {row.map((val, j) => (
                      <td key={j} className="border border-gray-400 p-2">
                        {val.toFixed(4)}
                      </td>
                    ))}
                    <td className="border border-gray-400 p-2">
                      {(alternativeMatrices[criterion][i].reduce((sum, val) => sum + val, 0) / alternatives.length).toFixed(4)}
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
                  <td colSpan={alternatives.length + 1} className="border border-gray-400 p-2"></td>
                  <td className="border border-gray-400 p-2 font-bold">λ<sub>max</sub></td>
                  <td className="border border-gray-400 p-2">{lambdaMaxValue}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={alternatives.length + 1} className="border border-gray-400 p-2"></td>
                  <td className="border border-gray-400 p-2 font-bold">CI (Consistency Index)</td>
                  <td className="border border-gray-400 p-2">{ciValue}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={alternatives.length + 1} className="border border-gray-400 p-2"></td>
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

export default AlternativeMatrix;