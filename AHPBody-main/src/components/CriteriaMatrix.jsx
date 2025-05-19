import React from "react";
import { formatValue, parseInput } from "../utils/inputUtils";

const CriteriaMatrix = ({ criteria, criteriaMatrix, setCriteriaMatrix }) => {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">
        Ma trận So sánh Cặp Tiêu chí
      </h2>
      <p className="text-sm text-gray-600 mb-2">
        Lưu ý: Nhập giá trị dưới dạng phân số (ví dụ: 1/3) hoặc số thập phân (ví
        dụ: 0.333). Giá trị đối xứng sẽ tự động cập nhật.
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2"></th>
            {criteria.map((crit) => (
              <th key={crit} className="border p-2">
                {crit}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteriaMatrix.map((row, i) => (
            <tr key={i}>
              <td className="border p-2 font-medium">{criteria[i]}</td>
              {row.map((val, j) => (
                <td key={j} className="border p-2">
                  <input
                    type="text"
                    value={formatValue(val)}
                    onChange={(e) => handleCriteriaChange(i, j, e.target.value)}
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
    </div>
  );
};

export default CriteriaMatrix;
