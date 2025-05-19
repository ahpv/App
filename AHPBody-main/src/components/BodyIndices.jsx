import React from "react";

const BodyIndices = ({ bodyIndices, isLoadingBodyIndices }) => {
  if (!bodyIndices || isLoadingBodyIndices) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Chỉ số Cơ thể Đã Tính</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Chỉ số</th>
            <th className="border p-2">Giá trị</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(bodyIndices).map(([key, value]) => (
            <tr key={key}>
              <td className="border p-2">{key.toUpperCase()}</td>
              <td className="border p-2">{value.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BodyIndices;
