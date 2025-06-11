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

  // Danh sách giá trị cho dropdown (từ 1/9 đến 9)
  const comparisonValues = [
    "1/9", "1/8", "1/7", "1/6", "1/5", "1/4", "1/3", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ];

  // Kiểm tra xem alternativeMatrices[criterion] hoặc alternatives có tồn tại không
  if (!alternativeMatrices[criterion] || !alternatives?.length) {
    return (
      <div className="text-red-600 text-center my-4">
        Lỗi: Không tìm thấy ma trận phương án hoặc danh sách phương án cho tiêu chí {criterion}
      </div>
    );
  }

  const handleAlternativeChange = (i, j, value) => {
    const val = parseInput(value);
    if (val === null || val <= 0 || val > 9 || val < 1 / 9) return; // Giới hạn giá trị từ 1/9 đến 9

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
    try {
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
    } catch (error) {
      console.error("Lỗi khi tính CI:", error);
      setCiValue(null);
      setLambdaMaxValue(null);
      setCrValue(null);
      setNormalizedMatrix(null);
      setWeights(null);
      setConsistencyVector(null);
    }
  };

  return (
    <div className="my-4 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Ma trận So sánh Cặp Phương án theo {criterion}
      </h2>
      <p className="text-sm text-gray-600 mb-2">
        Lưu ý: Chỉ có thể chỉnh sửa phần trên đường chéo chính (tam giác trên). Giá trị đối xứng sẽ tự động cập nhật.
      </p>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 font-semibold">Phương án</th>
            {alternatives.map((alt, index) => (
              <th key={index} className="border border-gray-300 p-2 font-semibold">
                {alt || `Phương án ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alternativeMatrices[criterion].map((row, i) => (
            <tr key={i}>
              <td className="border border-gray-300 p-2 font-semibold">
                {alternatives[i] || `Phương án ${i + 1}`}
              </td>
              {row.map((val, j) => (
                <td key={j} className="border border-gray-300 p-2">
                  <select
                    value={formatValue(val)}
                    onChange={(e) => handleAlternativeChange(i, j, e.target.value)}
                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${i >= j ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    disabled={i >= j} // Vô hiệu hóa đường chéo chính và tam giác dưới
                  >
                    <option value="" disabled>
                      Chọn giá trị
                    </option>
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
      <div className="mt-4 flex justify-center">
        <button
          onClick={calculateCI}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Tính CI
        </button>
      </div>
      {normalizedMatrix && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Kết quả chuẩn hóa và chỉ số nhất quán</h3>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Phương án</th>
                {alternatives.map((alt, index) => (
                  <th key={index} className="border border-gray-300 p-2">
                    {alt || `Phương án ${index + 1}`}
                  </th>
                ))}
                <th className="border border-gray-300 p-2">Tổng trọng số</th>
                <th className="border border-gray-300 p-2">Trọng số</th>
                <th className="border border-gray-300 p-2">Vector nhất quán</th>
              </tr>
            </thead>
            <tbody>
              {normalizedMatrix.map((row, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 p-2">
                    {alternatives[i] || `Phương án ${i + 1}`}
                  </td>
                  {row.map((val, j) => (
                    <td key={j} className="border border-gray-300 p-2 text-center">
                      {val.toFixed(4)}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-2 text-center">
                    {(
                      normalizedMatrix[i].reduce((sum, val) => sum + val, 0)
                    ).toFixed(4)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {(weights[i] || 0).toFixed(4)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {(consistencyVector[i] || 0).toFixed(4)}
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  colSpan={alternatives.length + 1}
                  className="border border-gray-300 p-2"
                ></td>
                <td className="border border-gray-300 p-2 font-semibold">
                  λ<sub>max</sub>
                </td>
                <td className="border border-gray-300 p-2 text-center">{lambdaMaxValue}</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td
                  colSpan={alternatives.length + 1}
                  className="border border-gray-300 p-2"
                ></td>
                <td className="border border-gray-300 p-2 font-semibold">CI</td>
                <td className="border border-gray-300 p-2 text-center">{ciValue}</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td
                  colSpan={alternatives.length + 1}
                  className="border border-gray-300 p-2"
                ></td>
                <td className="border border-gray-300 p-2 font-semibold">CR</td>
                <td className="border border-gray-300 p-2 text-center">{crValue}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlternativeMatrix;