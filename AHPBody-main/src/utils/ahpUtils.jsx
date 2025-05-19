import axios from "axios";

export const RI = {
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
};

export const normalizeMatrix = (matrix) => {
  const n = matrix.length;
  const colSums = matrix[0].map((_, col) =>
    matrix.reduce((sum, row) => sum + row[col], 0)
  );
  const normalized = matrix.map((row) =>
    row.map((val, col) => val / colSums[col])
  );
  const weights = normalized.map(
    (row) => row.reduce((sum, val) => sum + val, 0) / n
  );
  return { normalized, weights };
};

export const calculateCR = (matrix, weights) => {
  const n = matrix.length;
  const weightedSum = matrix.map((row, i) =>
    row.reduce((sum, val, j) => sum + val * weights[j], 0)
  );
  const consistencyVector = weightedSum.map((val, i) => val / weights[i]);
  const lambdaMax = consistencyVector.reduce((sum, val) => sum + val, 0) / n;
  const CI = (lambdaMax - n) / (n - 1);
  const CR = n <= 2 ? 0 : CI / RI[n];
  return { lambdaMax, CI, CR };
};

export const computeGlobalScores = (
  criteriaList,
  alternativesList,
  criteriaWeights,
  alternativeWeights
) => {
  const scores = alternativesList.map((_, i) => {
    let score = 0;
    criteriaList.forEach((criterion) => {
      score += alternativeWeights[criterion][i] * criteriaWeights[criterion];
    });
    return score;
  });
  const result = alternativesList
    .map((alt, i) => ({ name: alt, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .map((item, i) => ({ ...item, rank: i + 1 }));
  return result;
};

export const calculateBodyIndices = async (
  userInput,
  setBodyIndices,
  setIsLoadingBodyIndices,
  setSaveStatus
) => {
  setIsLoadingBodyIndices(true);
  setSaveStatus("");
  try {
    const bodyData = {
      sex: parseInt(userInput.sex) || 1,
      age: parseFloat(userInput.age) || 0,
      weight: parseFloat(userInput.weight) || 0,
      height: parseFloat(userInput.height) || 0,
      waist: parseFloat(userInput.waist) || 0,
      buttocks: parseFloat(userInput.buttocks) || 0,
    };

    const response = await axios.post("http://localhost:5000/save-results", {
      bodyMetrics: bodyData,
      name: userInput.name,
      message: userInput.message,
      timestamp: new Date().toISOString(),
    });

    const bodyIndices = response.data.bodyIndices;
    if (!bodyIndices) throw new Error("Invalid body metrics");
    setBodyIndices(bodyIndices);
  } catch (error) {
    console.error(error);
    alert(
      "Lỗi trong quá trình tính chỉ số cơ thể. Vui lòng kiểm tra dữ liệu nhập."
    );
  }
  setIsLoadingBodyIndices(false);
};

export const calculateAHP = async (
  userInput,
  bodyIndices,
  criteria,
  alternatives,
  criteriaMatrix,
  alternativeMatrices,
  setResults,
  setIsLoadingAHP,
  setSaveStatus
) => {
  setIsLoadingAHP(true);
  setSaveStatus("");
  try {
    const { weights: criteriaWeights } = normalizeMatrix(criteriaMatrix);
    const criteriaCR = calculateCR(criteriaMatrix, criteriaWeights);

    const alternativeWeights = {};
    const alternativeCRs = {};
    criteria.forEach((criterion) => {
      const { weights } = normalizeMatrix(alternativeMatrices[criterion]);
      alternativeWeights[criterion] = weights;
      alternativeCRs[criterion] = calculateCR(
        alternativeMatrices[criterion],
        weights
      );
    });

    const globalScores = computeGlobalScores(
      criteria,
      alternatives,
      criteria.reduce(
        (obj, crit, i) => ({ ...obj, [crit]: criteriaWeights[i] }),
        {}
      ),
      alternativeWeights
    );

    const ahpResults = {
      criteriaMatrix,
      alternativeMatrices,
      criteriaWeights,
      criteriaCR,
      alternativeWeights,
      alternativeCRs,
      globalScores,
    };

    const bodyData = {
      sex: parseInt(userInput.sex) || 1,
      age: parseFloat(userInput.age) || 0,
      weight: parseFloat(userInput.weight) || 0,
      height: parseFloat(userInput.height) || 0,
      waist: parseFloat(userInput.waist) || 0,
      buttocks: parseFloat(userInput.buttocks) || 0,
    };

    const dataToSave = {
      ...ahpResults,
      bodyMetrics: bodyData,
      bodyIndices,
      name: userInput.name,
      message: userInput.message,
      timestamp: new Date().toISOString(),
    };

    const response = await axios.post(
      "http://localhost:5000/save-results",
      dataToSave
    );
    setResults(ahpResults);
    setSaveStatus("Kết quả đã được lưu thành công!");
  } catch (error) {
    console.error(error);
    alert("Lỗi trong quá trình tính AHP. Vui lòng kiểm tra dữ liệu nhập.");
  }
  setIsLoadingAHP(false);
};
