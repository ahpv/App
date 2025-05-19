import React from "react";

const UserInput = ({ userInput, setUserInput, calculateBodyIndices }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInput({ ...userInput, [name]: value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Nhập Thông tin Người dùng</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-medium">Tên:</label>
          <input
            type="text"
            name="name"
            value={userInput.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên của bạn"
          />
        </div>
        <div>
          <label className="font-medium">Giới tính (1=Nam, 0=Nữ):</label>
          <select
            name="sex"
            value={userInput.sex}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Nam (1)</option>
            <option value="0">Nữ (0)</option>
          </select>
        </div>
        {["age", "weight", "height", "waist", "buttocks"].map((field) => (
          <div key={field}>
            <label className="font-medium">
              {field === "age"
                ? "Tuổi"
                : field === "weight"
                ? "Cân nặng (kg)"
                : field === "height"
                ? "Chiều cao (cm)"
                : field === "waist"
                ? "Vòng eo (cm)"
                : "Vòng mông (cm)"}
              :
            </label>
            <input
              type="number"
              name={field}
              value={userInput[field]}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
              min="0"
              placeholder={`Nhập ${field === "age" ? "tuổi" : field}`}
            />
          </div>
        ))}
        <div className="md:col-span-3">
          <label className="font-medium">Lời nhắn nhủ:</label>
          <textarea
            name="message"
            value={userInput.message}
            onChange={handleInputChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập lời nhắn nhủ của bạn"
            rows="4"
          />
        </div>
      </div>
      <button
        onClick={calculateBodyIndices}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4"
      >
        Tính Chỉ số Cơ thể
      </button>
    </div>
  );
};

export default UserInput;
