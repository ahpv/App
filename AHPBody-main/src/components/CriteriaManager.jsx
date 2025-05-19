import React from "react";
import { normalizeMatrix, calculateCR } from "../utils/ahpUtils";

const CriteriaManager = ({
  criteria,
  setCriteria,
  newCriterion,
  setNewCriterion,
  criteriaMatrix,
  setCriteriaMatrix,
  alternativeMatrices,
  setAlternativeMatrices,
}) => {
  const addCriterion = () => {
    if (!newCriterion.trim()) {
      alert("Vui lòng nhập tên tiêu chí!");
      return;
    }
    const newCrit = newCriterion.trim();
    if (criteria.includes(newCrit)) {
      alert("Tiêu chí đã tồn tại!");
      return;
    }

    // Tạo ma trận mới cho tiêu chí
    const newRow = Array(criteria.length + 1).fill(1);
    const newMatrix = criteriaMatrix.map((row) => [...row, 1]);
    newMatrix.push(newRow);

    // Kiểm tra CR của ma trận tiêu chí mới
    const { weights } = normalizeMatrix(newMatrix);
    const { CR } = calculateCR(newMatrix, weights);
    if (CR >= 0.1) {
      alert(`Ma trận tiêu chí không nhất quán (CR = ${(CR * 100).toFixed(2)}% ≥ 10%). Vui lòng chỉnh sửa trước khi thêm!`);
      return;
    }

    // Nếu CR < 0.1, cho phép thêm tiêu chí
    setCriteria([...criteria, newCrit]);
    setCriteriaMatrix(newMatrix);

    // Tạo ma trận phương án mới cho tiêu chí mới
    const newAltMatrix = Array(alternatives.length)
      .fill()
      .map(() => Array(alternatives.length).fill(1));
    setAlternativeMatrices((prev) => ({
      ...prev,
      [newCrit]: newAltMatrix,
    }));

    setNewCriterion("");
  };

  const removeCriterion = (index) => {
    if (criteria.length <= 2) {
      alert("Phải có tối thiểu 2 tiêu chí!");
      return;
    }

    const critToRemove = criteria[index];
    const newCriteria = criteria.filter((_, i) => i !== index);
    const newMatrix = criteriaMatrix
      .filter((_, i) => i !== index)
      .map((row) => row.filter((_, j) => j !== index));

    // Kiểm tra CR của ma trận sau khi xóa
    const { weights } = normalizeMatrix(newMatrix);
    const { CR } = calculateCR(newMatrix, weights);
    if (CR >= 0.1) {
      alert(`Ma trận tiêu chí sau khi xóa không nhất quán (CR = ${(CR * 100).toFixed(2)}% ≥ 10%). Vui lòng chỉnh sửa trước khi xóa!`);
      return;
    }

    // Nếu CR < 0.1, cho phép xóa tiêu chí
    setCriteria(newCriteria);
    setCriteriaMatrix(newMatrix);

    const newAltMatrices = { ...alternativeMatrices };
    delete newAltMatrices[critToRemove];
    setAlternativeMatrices(newAltMatrices);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Quản lý Tiêu chí</h2>
      <div className="flex items-center mb-4">
        <input
          type="text"
          value={newCriterion}
          onChange={(e) => setNewCriterion(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
          placeholder="Nhập tiêu chí mới (ví dụ: TDEE)"
        />
        <button
          onClick={addCriterion}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Thêm Tiêu chí
        </button>
      </div>
      <ul className="list-disc pl-5">
        {criteria.map((crit, index) => (
          <li key={crit} className="flex items-center justify-between py-1">
            <span>{crit}</span>
            {index >= 2 && (
              <button
                onClick={() => removeCriterion(index)}
                className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
              >
                Xóa
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CriteriaManager;