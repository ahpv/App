import React from "react";
import { normalizeMatrix, calculateCR } from "../utils/ahpUtils";

const AlternativeManager = ({
  alternatives,
  setAlternatives,
  newAlternative,
  setNewAlternative,
  alternativeMatrices,
  setAlternativeMatrices,
}) => {
  const addAlternative = () => {
    if (!newAlternative.trim()) {
      alert("Vui lòng nhập tên phương án!");
      return;
    }
    const newAlt = newAlternative.trim();
    if (alternatives.includes(newAlt)) {
      alert("Phương án đã tồn tại!");
      return;
    }

    const newAltMatrices = { ...alternativeMatrices };
    let isConsistent = true;

    // Kiểm tra CR cho từng ma trận phương án sau khi thêm
    Object.keys(newAltMatrices).forEach((criterion) => {
      const matrix = newAltMatrices[criterion];
      const newRow = Array(matrix.length + 1).fill(1);
      const newMatrix = matrix.map((row) => [...row, 1]);
      newMatrix.push(newRow);

      const { weights } = normalizeMatrix(newMatrix);
      const { CR } = calculateCR(newMatrix, weights);
      if (CR >= 0.1) {
        isConsistent = false;
        alert(
          `Ma trận phương án cho tiêu chí ${criterion} không nhất quán (CR = ${(CR * 100).toFixed(2)}% ≥ 10%). Vui lòng chỉnh sửa trước khi thêm!`
        );
      } else {
        newAltMatrices[criterion] = newMatrix;
      }
    });

    if (!isConsistent) {
      return;
    }

    // Nếu tất cả CR < 0.1, cho phép thêm phương án
    setAlternatives([...alternatives, newAlt]);
    setAlternativeMatrices(newAltMatrices);
    setNewAlternative("");
  };

  const removeAlternative = (index) => {
    if (alternatives.length <= 2) {
      alert("Phải có tối thiểu 2 phương án!");
      return;
    }

    const newAltMatrices = { ...alternativeMatrices };
    let isConsistent = true;

    // Kiểm tra CR cho từng ma trận phương án sau khi xóa
    Object.keys(newAltMatrices).forEach((criterion) => {
      const matrix = newAltMatrices[criterion];
      const newMatrix = matrix
        .filter((_, i) => i !== index)
        .map((row) => row.filter((_, j) => j !== index));

      const { weights } = normalizeMatrix(newMatrix);
      const { CR } = calculateCR(newMatrix, weights);
      if (CR >= 0.1) {
        isConsistent = false;
        alert(
          `Ma trận phương án cho tiêu chí ${criterion} sau khi xóa không nhất quán (CR = ${(CR * 100).toFixed(2)}% ≥ 10%). Vui lòng chỉnh sửa trước khi xóa!`
        );
      } else {
        newAltMatrices[criterion] = newMatrix;
      }
    });

    if (!isConsistent) {
      return;
    }

    // Nếu tất cả CR < 0.1, cho phép xóa phương án
    const newAlternatives = alternatives.filter((_, i) => i !== index);
    setAlternatives(newAlternatives);
    setAlternativeMatrices(newAltMatrices);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Quản lý Phương án</h2>
      <div className="flex items-center mb-4">
        <input
          type="text"
          value={newAlternative}
          onChange={(e) => setNewAlternative(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
          placeholder="Nhập phương án mới (ví dụ: Béo phì)"
        />
        <button
          onClick={addAlternative}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Thêm Phương án
        </button>
      </div>
      <ul className="list-disc pl-5">
        {alternatives.map((alt, index) => (
          <li key={alt} className="flex items-center justify-between py-1">
            <span>{alt}</span>
            <button
              onClick={() => removeAlternative(index)}
              className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlternativeManager;