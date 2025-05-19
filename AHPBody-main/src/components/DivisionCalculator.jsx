import React, { useState } from "react";

const DivisionCalculator = () => {
  const [dividend, setDividend] = useState("");
  const [divisor, setDivisor] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = () => {
    setError("");
    setResult(null);

    const numDividend = parseFloat(dividend);
    const numDivisor = parseFloat(divisor);

    if (isNaN(numDividend) || isNaN(numDivisor)) {
      setError("Vui lòng nhập số hợp lệ.");
      return;
    }

    if (numDivisor === 0) {
      setError("Không thể chia cho 0.");
      return;
    }

    const quotient = numDividend / numDivisor;
    setResult(quotient);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Máy Tính Phép Chia</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Số bị chia
        </label>
        <input
          type="number"
          value={dividend}
          onChange={(e) => setDividend(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Nhập số bị chia"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Số chia
        </label>
        <input
          type="number"
          value={divisor}
          onChange={(e) => setDivisor(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Nhập số chia"
        />
      </div>
      <button
        onClick={handleCalculate}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Tính
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {result !== null && (
        <p className="text-green-600 mt-4">Kết quả: {result}</p>
      )}
    </div>
  );
};

export default DivisionCalculator;
