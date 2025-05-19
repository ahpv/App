import React, { useState } from "react";
import UserInput from "./components/UserInput";
import DivisionCalculator from "./components/DivisionCalculator";
import BodyIndices from "./components/BodyIndices";
import CriteriaManager from "./components/CriteriaManager";
import AlternativeManager from "./components/AlternativeManager";
import CriteriaMatrix from "./components/CriteriaMatrix";
import AlternativeMatrix from "./components/AlternativeMatrix";
import AHPResults from "./components/AHPResults";
import { calculateBodyIndices, calculateAHP, normalizeMatrix, calculateCR } from "./utils/ahpUtils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

const initialCriteria = ["BF%", "WHR", "BMI", "WHtR", "LBM"];
const initialAlternatives = [
  "Suy dinh dưỡng",
  "Béo phì",
  "Thừa cân",
  "Cân đối",
];
const initialCriteriaMatrix = [
  [1, 3, 5, 4, 7],
  [1 / 3, 1, 3, 2, 5],
  [1 / 5, 1 / 3, 1, 1 / 2, 3],
  [1 / 4, 1 / 2, 2, 1, 4],
  [1 / 7, 1 / 5, 1 / 3, 1 / 4, 1],
];
const initialAlternativeMatrices = {
  "BF%": [
    [1, 1 / 3, 5, 1 / 5],
    [3, 1, 7, 1 / 3],
    [1 / 5, 1 / 7, 1, 1 / 7],
    [5, 3, 7, 1],
  ],
  WHR: [
    [1, 1 / 5, 5, 1 / 3],
    [5, 1, 7, 3],
    [1 / 5, 1 / 7, 1, 1 / 7],
    [3, 1 / 3, 7, 1],
  ],
  BMI: [
    [1, 3, 5, 3],
    [1 / 3, 1, 5, 1],
    [1 / 5, 1 / 5, 1, 1 / 5],
    [1 / 3, 1, 5, 1],
  ],
  WHtR: [
    [1, 1, 5, 1],
    [1, 1, 5, 1],
    [1 / 5, 1 / 5, 1, 1 / 5],
    [1, 1, 5, 1],
  ],
  LBM: [
    [1, 1 / 3, 1 / 5, 1 / 3],
    [3, 1, 1, 1],
    [5, 1, 1, 1],
    [3, 1, 1, 1],
  ],
};

const App = () => {
  const [userInput, setUserInput] = useState({
    name: "",
    sex: "1",
    age: "",
    weight: "",
    height: "",
    waist: "",
    buttocks: "",
    message: "",
  });
  const [criteria, setCriteria] = useState(initialCriteria);
  const [alternatives, setAlternatives] = useState(initialAlternatives);
  const [criteriaMatrix, setCriteriaMatrix] = useState(initialCriteriaMatrix);
  const [alternativeMatrices, setAlternativeMatrices] = useState(
    initialAlternativeMatrices
  );
  const [newCriterion, setNewCriterion] = useState("");
  const [newAlternative, setNewAlternative] = useState("");
  const [bodyIndices, setBodyIndices] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoadingBodyIndices, setIsLoadingBodyIndices] = useState(false);
  const [isLoadingAHP, setIsLoadingAHP] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isConsistent, setIsConsistent] = useState(false);

  const checkConsistency = () => {
    const { weights: criteriaWeights } = normalizeMatrix(criteriaMatrix);
    const { CR: criteriaCR } = calculateCR(criteriaMatrix, criteriaWeights);

    if (criteriaCR >= 0.1) {
      setSaveStatus(`CR của ma trận tiêu chí = ${(criteriaCR * 100).toFixed(2)}% ≥ 10%. Không phù hợp, vui lòng chỉnh sửa!`);
      setIsConsistent(false);
    } else {
      setSaveStatus(`CR của ma trận tiêu chí = ${(criteriaCR * 100).toFixed(2)}% < 10%. Có thể tiếp tục.`);
      setIsConsistent(true);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["HỆ THỐNG HỖ TRỢ CHUẨN ĐOÁN THỂ TRẠNG CƠ THỂ"],
      ["Thông tin người dùng"],
      ["Tên", userInput.name],
      ["Giới tính", userInput.sex === "1" ? "Nam" : "Nữ"],
      ["Tuổi", userInput.age],
      ["Cân nặng (kg)", userInput.weight],
      ["Chiều cao (cm)", userInput.height],
      ["Vòng eo (cm)", userInput.waist],
      ["Vòng mông (cm)", userInput.buttocks],
      ["Thông điệp", userInput.message],
      [],
      ["Chỉ số cơ thể"],
      ...(bodyIndices
        ? Object.entries(bodyIndices).map(([key, value]) => [key, value])
        : []),
      [],
      ["Kết quả AHP"],
      ...(results?.globalScores
        ? results.globalScores.map((item) => [
          item.name,
          item.score.toFixed(4),
          item.rank,
        ])
        : []),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "AHP_Results.xlsx");
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      doc.text("HỆ THỐNG HỖ TRỢ CHUẨN ĐOÁN THỂ TRẠNG CƠ THỂ", 10, 10);

      autoTable(doc, {
        head: [["Thông tin người dùng"]],
        body: [
          ["Tên", userInput.name || "N/A"],
          ["Giới tính", userInput.sex === "1" ? "Nam" : "Nữ"],
          ["Tuổi", userInput.age || "N/A"],
          ["Cân nặng (kg)", userInput.weight || "N/A"],
          ["Chiều cao (cm)", userInput.height || "N/A"],
          ["Vòng eo (cm)", userInput.waist || "N/A"],
          ["Vòng mông (cm)", userInput.buttocks || "N/A"],
          ["Thông điệp", userInput.message || "N/A"],
        ],
        startY: 20,
      });

      let lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 30;
      if (bodyIndices) {
        autoTable(doc, {
          head: [["Chỉ số cơ thể"]],
          body: Object.entries(bodyIndices).map(([key, value]) => [key, value]),
          startY: lastY + 10,
        });
        lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : lastY + 10;
      }

      if (results?.globalScores) {
        autoTable(doc, {
          head: [["Kết quả AHP", "Điểm", "Hạng"]],
          body: results.globalScores.map((item) => [
            item.name,
            item.score.toFixed(4),
            item.rank,
          ]),
          startY: lastY + 10,
        });
      }

      doc.save("AHP_Results.pdf");
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error);
      alert("Đã xảy ra lỗi khi xuất PDF. Vui lòng kiểm tra console để biết chi tiết.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">
        HỆ THỐNG HỖ TRỢ CHUẨN ĐOÁN THỂ TRẠNG CƠ THỂ
      </h1>

      {/* 1. Phần nhập thông tin người dùng */}
      <UserInput
        userInput={userInput}
        setUserInput={setUserInput}
        calculateBodyIndices={() =>
          calculateBodyIndices(
            userInput,
            setBodyIndices,
            setIsLoadingBodyIndices,
            setSaveStatus
          )
        }
      />
      {/* 2. Quản lý tiêu chí */}
      <CriteriaManager
        criteria={criteria}
        setCriteria={setCriteria}
        newCriterion={newCriterion}
        setNewCriterion={setNewCriterion}
        criteriaMatrix={criteriaMatrix}
        setCriteriaMatrix={setCriteriaMatrix}
        alternativeMatrices={alternativeMatrices}
        setAlternativeMatrices={setAlternativeMatrices}
      />
      {/* 3. Quản lý phương án */}
      <AlternativeManager
        alternatives={alternatives}
        setAlternatives={setAlternatives}
        newAlternative={newAlternative}
        setNewAlternative={setNewAlternative}
        alternativeMatrices={alternativeMatrices}
        setAlternativeMatrices={setAlternativeMatrices}
      />
      {/* 4. Máy tính phép chia */}
      <DivisionCalculator />
      {/* 5. Bảng Chỉ số Cơ thể Đã Tính */}
      <BodyIndices
        bodyIndices={bodyIndices}
        isLoadingBodyIndices={isLoadingBodyIndices}
      />
      {/* Bảng Ma trận So sánh Cặp Tiêu chí */}
      <CriteriaMatrix
        criteria={criteria}
        criteriaMatrix={criteriaMatrix}
        setCriteriaMatrix={setCriteriaMatrix}
      />
      {isConsistent ? (
        <>
          {criteria.map((criterion) => (
            <AlternativeMatrix
              key={criterion}
              criterion={criterion}
              alternatives={alternatives}
              alternativeMatrices={alternativeMatrices}
              setAlternativeMatrices={setAlternativeMatrices}
            />
          ))}
          <div className="flex space-x-4 my-4">
            <button
              onClick={() =>
                calculateAHP(
                  userInput,
                  bodyIndices,
                  criteria,
                  alternatives,
                  criteriaMatrix,
                  alternativeMatrices,
                  setResults,
                  setIsLoadingAHP,
                  setSaveStatus
                )
              }
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Tính AHP
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Xuất Excel
            </button>
            <button
              onClick={exportToPDF}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Xuất PDF
            </button>
          </div>
          <AHPResults
            results={results}
            criteria={criteria}
            alternatives={alternatives}
            isLoadingAHP={isLoadingAHP}
          />
        </>
      ) : null}
      <div className="flex justify-center my-4">
        <button
          onClick={checkConsistency}
          className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
        >
          Kiểm tra CR
        </button>
      </div>
      {saveStatus && (
        <p className={`text-center ${isConsistent ? "text-green-600" : "text-red-600"}`}>
          {saveStatus}
        </p>
      )}
      {isLoadingBodyIndices && (
        <p className="text-center">Đang tính toán chỉ số cơ thể...</p>
      )}
      {isLoadingAHP && <p className="text-center">Đang tính toán AHP...</p>}
    </div>
  );
};

export default App;