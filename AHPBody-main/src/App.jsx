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
import { DataSet } from "vis-network/standalone";
import VisNetwork from "./components/VisNetwork";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Các giá trị khởi tạo ban đầu
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
  const [showTree, setShowTree] = useState(false);

  // Hàm kiểm tra tính nhất quán
  const checkConsistency = () => {
    try {
      const { weights: criteriaWeights } = normalizeMatrix(criteriaMatrix);
      const { CR: criteriaCR } = calculateCR(criteriaMatrix, criteriaWeights);

      if (criteriaCR >= 0.1) {
        setSaveStatus(
          `CR của ma trận tiêu chí = ${(criteriaCR * 100).toFixed(4)}% ≥ 10%. Không phù hợp, vui lòng chỉnh sửa ma trận tiêu chí!`
        );
        setIsConsistent(false);
      } else {
        setSaveStatus(
          `CR của ma trận tiêu chí = ${(criteriaCR * 100).toFixed(4)}% < 10%. Có thể tiếp tục với các ma trận phương án.`
        );
        setIsConsistent(true);
      }
    } catch (error) {
      console.error("Error in checkConsistency:", error);
      setSaveStatus("Lỗi khi kiểm tra CR. Vui lòng kiểm tra dữ liệu đầu vào.");
      setIsConsistent(false);
    }
  };

  // Hàm xử lý import file Excel
  const handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSaveStatus("Vui lòng chọn file Excel!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellText: false, cellDates: true });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false });

        // Hàm phụ để tìm vị trí tiêu đề, bỏ qua khoảng trắng và không phân biệt hoa thường
        const findTableStart = (title) => {
          const normalizedTitle = title.trim().toLowerCase();
          for (let i = 0; i < jsonData.length; i++) {
            const cellValue = jsonData[i][0]?.toString().trim().toLowerCase();
            if (cellValue === normalizedTitle) {
              return i;
            }
          }
          return -1;
        };

        // 1. Xử lý thông tin người dùng
        const userInfoStart = findTableStart("Thông tin người dùng");
        if (userInfoStart === -1) {
          setSaveStatus("Không tìm thấy phần 'Thông tin người dùng' trong file Excel!");
          return;
        }

        const userInfoData = jsonData.slice(userInfoStart + 1, userInfoStart + 10);
        const newUserInput = {
          name: userInfoData[0]?.[1]?.toString().trim() || "N/A",
          sex: userInfoData[1]?.[1]?.toString().trim() === "Nam" ? "1" : "2",
          age: Number(userInfoData[2]?.[1]) || 0,
          weight: Number(userInfoData[3]?.[1]) || 0,
          height: Number(userInfoData[4]?.[1]) || 0,
          waist: Number(userInfoData[5]?.[1]) || 0,
          buttocks: Number(userInfoData[6]?.[1]) || 0,
          message: userInfoData[7]?.[1]?.toString().trim() || "N/A",
        };
        setUserInput(newUserInput);

        // 2. Xử lý chỉ số cơ thể
        const bodyIndicesStart = findTableStart("Chỉ số cơ thể");
        let newBodyIndices = {};
        if (bodyIndicesStart !== -1) {
          const bodyIndicesData = jsonData.slice(bodyIndicesStart + 2).filter(row => row[0] && row[1]);
          newBodyIndices = bodyIndicesData.reduce((acc, row) => {
            const value = Number(row[1]);
            acc[row[0]?.toString().trim()] = isNaN(value) ? 0 : value;
            return acc;
          }, {});
        }
        setBodyIndices(newBodyIndices);

        // 3. Xử lý ma trận tiêu chí
        const criteriaMatrixStart = findTableStart("Ma trận So sánh Cặp Tiêu chí");
        if (criteriaMatrixStart === -1) {
          setSaveStatus("Không tìm thấy 'Ma trận So sánh Cặp Tiêu chí' trong file Excel!");
          return;
        }

        const criteriaHeader = jsonData[criteriaMatrixStart + 1]?.slice(1).map(val => val?.toString().trim()).filter(Boolean) || [];
        if (!criteriaHeader.length) {
          setSaveStatus("Tiêu đề tiêu chí không hợp lệ!");
          return;
        }

        const criteriaMatrixData = jsonData
          .slice(criteriaMatrixStart + 2, criteriaMatrixStart + 2 + criteriaHeader.length)
          .map((row) => row.slice(1, criteriaHeader.length + 1).map((val) => {
            const num = Number(val);
            return isNaN(num) ? 1 : num;
          }));

        if (
          criteriaMatrixData.length !== criteriaHeader.length ||
          criteriaMatrixData.some((row) => row.length !== criteriaHeader.length)
        ) {
          setSaveStatus("Ma trận tiêu chí không hợp lệ!");
          return;
        }

        setCriteria(criteriaHeader);
        setCriteriaMatrix(criteriaMatrixData);

        // 4. Xử lý ma trận phương án
        const newAlternativeMatrices = {};
        let isValid = true;
        const altHeader = jsonData[findTableStart(`Ma trận So sánh Cặp Phương án theo ${criteriaHeader[0]}`) + 1]?.slice(1).map(val => val?.toString().trim()).filter(Boolean) || [];
        if (!altHeader.length) {
          setSaveStatus("Tiêu đề phương án không hợp lệ!");
          return;
        }
        setAlternatives(altHeader);

        criteriaHeader.forEach((criterion) => {
          const matrixStart = findTableStart(`Ma trận So sánh Cặp Phương án theo ${criterion}`);
          if (matrixStart === -1) {
            setSaveStatus(`Không tìm thấy ma trận phương án cho tiêu chí ${criterion}!`);
            isValid = false;
            return;
          }

          const altMatrixData = jsonData
            .slice(matrixStart + 2, matrixStart + 2 + altHeader.length)
            .map((row) => row.slice(1, altHeader.length + 1).map((val) => {
              const num = Number(val);
              return isNaN(num) ? 1 : num;
            }));

          if (
            altMatrixData.length !== altHeader.length ||
            altMatrixData.some((row) => row.length !== altHeader.length)
          ) {
            setSaveStatus(`Ma trận phương án cho ${criterion} không hợp lệ!`);
            isValid = false;
            return;
          }

          newAlternativeMatrices[criterion] = altMatrixData;
        });

        if (!isValid) {
          return;
        }

        setAlternativeMatrices(newAlternativeMatrices);

        // 5. Xử lý kết quả AHP
        const resultsStart = findTableStart("Kết quả AHP");
        let newResults = {};
        if (resultsStart !== -1) {
          const resultsData = jsonData.slice(resultsStart + 2).filter(row => row[0]);
          newResults.globalScores = resultsData.map(row => ({
            name: row[0]?.toString().trim() || "N/A",
            score: Number(row[1]) || 0,
            rank: Number(row[2]) || 0,
          }));
        }
        setResults(newResults);

        setSaveStatus("Import file Excel thành công! Vui lòng kiểm tra CR trước khi tiếp tục.");
        setIsConsistent(false);
      } catch (error) {
        console.error("Lỗi khi import Excel:", error);
        setSaveStatus("Lỗi khi import Excel. Vui lòng kiểm tra file và thử lại!");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Hàm exportToExcel
  const exportToExcel = () => {
    try {
      console.log("Exporting to Excel with data:", {
        userInput,
        bodyIndices,
        criteria,
        alternatives,
        criteriaMatrix,
        alternativeMatrices,
        results,
      });

      const wb = XLSX.utils.book_new();

      const headerStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D3E0EA" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
      const firstColumnStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "A3BFFA" } },
        alignment: { horizontal: "left", vertical: "center" },
      };
      const cellStyle = {
        fill: { fgColor: { rgb: "F5F6F5" } },
        alignment: { horizontal: "center", vertical: "center" },
      };

      const addTable = (data, title, isHeaderRow, firstColIsHeader) => {
        const tableData = [
          [title],
          ...(isHeaderRow ? [data[0]] : []),
          ...data.slice(isHeaderRow ? 1 : 0),
        ];
        return [...tableData, [], []];
      };

      const wsData = [
        ["HỆ THỐNG HỖ TRỢ CHUẨN ĐOÁN THỂ TRẠNG CƠ THỂ"],
        [],
        ...addTable(
          [
            ["Tên", userInput.name || "N/A"],
            ["Giới tính", userInput.sex === "1" ? "Nam" : "Nữ"],
            ["Tuổi", userInput.age || "N/A"],
            ["Cân nặng (kg)", userInput.weight || "N/A"],
            ["Chiều cao (cm)", userInput.height || "N/A"],
            ["Vòng eo (cm)", userInput.waist || "N/A"],
            ["Vòng mông (cm)", userInput.buttocks || "N/A"],
            ["Thông điệp", userInput.message || "N/A"],
          ],
          "Thông tin người dùng",
          false,
          true
        ),
        ...(bodyIndices
          ? addTable(
            Object.entries(bodyIndices).map(([key, value]) => [key, value]),
            "Chỉ số cơ thể",
            false,
            true
          )
          : []),
        ...addTable(
          [
            ["", ...criteria],
            ...criteriaMatrix.map((row, i) => [
              criteria[i] || `Tiêu chí ${i + 1}`,
              ...row.map((val) => Number(val.toFixed(4))),
            ]),
          ],
          "Ma trận So sánh Cặp Tiêu chí",
          true,
          true
        ),
        ...criteria
          .map((criterion, index) =>
            addTable(
              [
                ["", ...(alternatives || [])],
                ...(alternativeMatrices[criterion]?.map((row, i) => [
                  alternatives[i] || `Phương án ${i + 1}`,
                  ...row.map((val) => Number(val.toFixed(4))),
                ]) || []),
              ],
              `Ma trận So sánh Cặp Phương án theo ${criterion}`,
              true,
              true
            )
          )
          .flat(),
        ...(results?.globalScores
          ? addTable(
            [
              ["Tên", "Điểm", "Hạng"],
              ...results.globalScores.map((item) => [
                item.name || "N/A",
                Number(item.score.toFixed(4)),
                item.rank,
              ]),
            ],
            "Kết quả AHP",
            true,
            true
          )
          : []),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const maxCols = Math.max(
        2,
        bodyIndices ? Object.keys(bodyIndices).length : 0,
        (criteria.length || 0) + 1,
        (alternatives.length || 0) + 1,
        3
      );
      ws["!cols"] = Array(maxCols).fill({ wch: 15 });
      ws["!cols"][0] = { wch: 20 };

      let currentTable = "";
      wsData.forEach((row, rowIndex) => {
        if (row.length === 1 && typeof row[0] === "string") {
          currentTable = row[0];
        }
        row.forEach((cell, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          ws[cellRef] = ws[cellRef] || { v: cell };
          if (
            row.length === 1 ||
            (currentTable === "Thông tin người dùng" &&
              colIndex === 0 &&
              rowIndex > 1) ||
            (currentTable === "Chỉ số cơ thể" &&
              colIndex === 0 &&
              rowIndex > 1) ||
            (currentTable.startsWith("Ma trận") &&
              (rowIndex === 2 || (colIndex === 0 && rowIndex > 2))) ||
            (currentTable === "Kết quả AHP" &&
              (rowIndex === 2 || (colIndex === 0 && rowIndex > 2)))
          ) {
            ws[cellRef].s = headerStyle;
          } else if (
            colIndex === 0 &&
            cell &&
            typeof cell === "string" &&
            rowIndex > 2
          ) {
            ws[cellRef].s = firstColumnStyle;
          } else if (colIndex > 0 && cell !== undefined && cell !== "") {
            ws[cellRef].s = cellStyle;
          }
        });
      });

      XLSX.utils.book_append_sheet(wb, ws, "AHP Results");
      XLSX.writeFile(wb, "AHP_Results.xlsx");
      console.log("Excel file generated successfully");
      setSaveStatus("Xuất Excel thành công!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setSaveStatus("Lỗi khi xuất Excel. Vui lòng kiểm tra console để biết chi tiết.");
    }
  };

  // Hàm exportToPDF
  const exportToPDF = async () => {
    try {
      console.log("Starting PDF export...");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const fontURL = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
      const fontLoaded = await loadFontFromURL(doc, fontURL, 'NotoSans');

      const fontName = fontLoaded ? "NotoSans" : "Helvetica";
      doc.setFont(fontName, "normal");
      doc.setFontSize(14);

      console.log("Available fonts:", Object.keys(doc.getFontList()));
      doc.text("HỆ THỐNG HỖ TRỢ CHUẨN ĐOÁN THỂ TRẠNG CƠ THỂ", 10, 15);

      const tableConfig = {
        styles: {
          font: fontName,
          fontSize: 10,
          cellPadding: 3,
          halign: 'left'
        },
        headStyles: {
          fillColor: [200, 220, 255],
          font: fontName,
          fontSize: 11,
          fontStyle: 'bold',
          textColor: [0, 0, 0]
        },
        bodyStyles: {
          font: fontName,
          fontSize: 10
        },
        theme: 'grid',
        margin: { left: 10, right: 10 }
      };

      autoTable(doc, {
        ...tableConfig,
        head: [["Thông tin người dùng", "Giá trị"]],
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
        startY: 25,
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 80 }
        }
      });

      let lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80;
      if (bodyIndices) {
        if (lastY > 250) {
          doc.addPage();
          lastY = 20;
        }

        autoTable(doc, {
          ...tableConfig,
          head: [["Chỉ số cơ thể", "Giá trị"]],
          body: Object.entries(bodyIndices).map(([key, value]) => [key, value]),
          startY: lastY,
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 60 }
          }
        });
        lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : lastY + 40;
      }

      if (lastY > 200) {
        doc.addPage();
        lastY = 20;
      }

      autoTable(doc, {
        ...tableConfig,
        head: [["Tiêu chí", ...criteria]],
        body: criteriaMatrix.map((row, i) => [criteria[i] || `Tiêu chí ${i + 1}`, ...row]),
        startY: lastY,
        styles: {
          ...tableConfig.styles,
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          ...tableConfig.headStyles,
          fontSize: 9
        }
      });
      lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : lastY + 60;

      criteria.forEach((criterion, index) => {
        if (lastY > 200 || index > 0) {
          doc.addPage();
          lastY = 20;
        }

        autoTable(doc, {
          ...tableConfig,
          head: [[`Ma trận ${criterion}`, ...alternatives]],
          body: alternativeMatrices[criterion]?.map((row, i) => [
            alternatives[i] || `Phương án ${i + 1}`,
            ...row
          ]) || [],
          startY: lastY,
          styles: {
            ...tableConfig.styles,
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            ...tableConfig.headStyles,
            fontSize: 9
          }
        });
        lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : lastY + 60;
      });

      if (results?.globalScores) {
        if (lastY > 200) {
          doc.addPage();
          lastY = 20;
        }

        autoTable(doc, {
          ...tableConfig,
          head: [["Kết quả AHP", "Điểm số", "Xếp hạng"]],
          body: results.globalScores.map((item) => [
            item.name || "N/A",
            item.score.toFixed(4),
            `Hạng ${item.rank}`,
          ]),
          startY: lastY,
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          },
          bodyStyles: {
            ...tableConfig.bodyStyles,
            1: { halign: 'center' },
            2: { halign: 'center', fontStyle: 'bold' }
          }
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(fontName, "normal");
        doc.text(
          `Trang ${i}/${pageCount} - Tạo lúc: ${new Date().toLocaleString('vi-VN')}`,
          10,
          290
        );
      }

      doc.save("Ket_Qua_AHP.pdf");
      setSaveStatus("Xuất PDF thành công!");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setSaveStatus("Lỗi khi xuất PDF. Vui lòng kiểm tra console.");
    }
  };

  const loadFontFromURL = async (doc, fontUrl, fontName) => {
    try {
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error("Không thể tải font");
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
      const base64Font = btoa(binaryString);

      doc.addFileToVFS(`${fontName}.ttf`, base64Font);
      doc.addFont(`${fontName}.ttf`, fontName, "normal");

      return true;
    } catch (error) {
      console.warn(`Không thể tải font ${fontName}:`, error);
      return false;
    }
  };

  // Define nodes and edges for Vis.js with validation
  const nodes =
    results && !isLoadingAHP && results.criteriaWeights && results.globalScores
      ? new DataSet([
        { id: "Goal", label: `THỂ TRẠNG CƠ THỂ\n(1.000)` },
        ...criteria.map((c, i) => ({
          id: c,
          label: `${c} \n(${(results.criteriaWeights[i] * 100).toFixed(3)}%)`,
        })),
        ...alternatives.map((a, i) => ({
          id: a,
          label: `${a} \n(${results.globalScores[i]?.score?.toFixed(3) || "N/A"})`,
        })),
      ])
      : new DataSet([]);

  const edges =
    results && !isLoadingAHP && results.criteriaWeights && results.globalScores
      ? new DataSet([
        ...criteria.map((c) => ({ from: "Goal", to: c })),
        ...criteria.flatMap((c) => alternatives.map((a) => ({ from: c, to: a }))),
      ])
      : new DataSet([]);

  // Log data for debugging
  if (showTree && results && !isLoadingAHP) {
    console.log("App: Nodes for VisNetwork:", nodes.get());
    console.log("App: Edges for VisNetwork:", edges.get());
  }

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

      {/* Nút import file Excel */}
      <div className="flex justify-center my-4">
        <label className="bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 cursor-pointer">
          Import Excel
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            className="hidden"
          />
        </label>
      </div>

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

      {/* Nút kiểm tra CR */}
      <div className="flex justify-center my-6">
        <button
          onClick={checkConsistency}
          className="bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 text-lg font-semibold"
        >
          Kiểm tra CR
        </button>
      </div>

      {/* Thông báo trạng thái */}
      {saveStatus && (
        <p
          className={`text-center text-lg mb-4 ${saveStatus.includes("thành công") || saveStatus.includes("Có thể tiếp tục")
            ? "text-green-600"
            : "text-red-600"
            }`}
        >
          {saveStatus}
        </p>
      )}

      {/* Hiển thị ma trận phương án nếu CR hợp lệ và đủ ma trận */}
      {isConsistent && Object.keys(alternativeMatrices).length === criteria.length ? (
        <>
          {criteria.map((criterion) => (
            alternativeMatrices[criterion] ? (
              <AlternativeMatrix
                key={criterion}
                criterion={criterion}
                alternatives={alternatives}
                alternativeMatrices={alternativeMatrices}
                setAlternativeMatrices={setAlternativeMatrices}
              />
            ) : (
              <p key={criterion} className="text-red-600 text-center my-4">
                Lỗi: Không tìm thấy ma trận phương án cho tiêu chí {criterion}
              </p>
            )
          ))}
          <div className="flex space-x-4 my-6 justify-center">
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
            <button
              onClick={() => setShowTree(true)}
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Tạo Sơ đồ Phân cấp AHP
            </button>
          </div>
          <AHPResults
            results={results}
            criteria={criteria}
            alternatives={alternatives}
            isLoadingAHP={isLoadingAHP}
          />
        </>
      ) : isConsistent ? (
        <p className="text-red-600 text-center text-lg my-4">
          Vui lòng đảm bảo tất cả ma trận phương án đã được tải đầy đủ.
        </p>
      ) : null}

      {isLoadingBodyIndices && (
        <p className="text-center text-lg">Đang tính toán chỉ số cơ thể...</p>
      )}
      {isLoadingAHP && <p className="text-center text-lg">Đang tính toán AHP...</p>}
      {showTree && results && !isLoadingAHP ? (
        nodes.length > 0 && edges.length > 0 ? (
          <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
            <h2 className="text-xl font-semibold mb-4">Sơ đồ Quan hệ AHP</h2>
            <VisNetwork nodes={nodes} edges={edges} />
            <button
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setShowTree(false)}
            >
              Trở về
            </button>
          </div>
        ) : (
          <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
            <h2 className="text-xl font-semibold mb-4">Sơ đồ Quan hệ AHP</h2>
            <p className="text-red-600">
              Lỗi: Dữ liệu sơ đồ không hợp lệ. Vui lòng kiểm tra console.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setShowTree(false)}
            >
              Trở về
            </button>
          </div>
        )
      ) : null}
    </div>
  );
};

export default App;