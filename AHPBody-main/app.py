from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://localhost:27017/')
db = client['ahp_db']
collection = db['ahp_results']

def process_body_index(sex, age, weight, height, waist, buttocks):
    try:
        bmi = weight / (height / 100) ** 2
        whr = waist / buttocks
        whtr = waist / height
        lbm = (0.3281 * weight) + (0.33929 * height) - 29.5336
        bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4
        return {
            'bmi': bmi,
            'whr': whr,
            'whtr': whtr,
            'lbm': lbm,
            'bf': bf
        }
    except ZeroDivisionError:
        return None

@app.route('/save-results', methods=['POST'])
def save_results():
    try:
        data = request.get_json()
        
        body_metrics = data.get('bodyMetrics', {})
        sex = body_metrics.get('sex', 1)
        age = body_metrics.get('age', 0)
        weight = body_metrics.get('weight', 0)
        height = body_metrics.get('height', 0)
        waist = body_metrics.get('waist', 0)
        buttocks = body_metrics.get('buttocks', 0)

        body_indices = process_body_index(sex, age, weight, height, waist, buttocks)
        if body_indices is None:
            return jsonify({'message': 'Thông số cơ thể không hợp lệ'}), 400

        save_data = {
            'name': data.get('name', ''),
            'message': data.get('message', ''),
            'criteriaMatrix': data.get('criteriaMatrix'),
            'alternativeMatrices': data.get('alternativeMatrices'),
            'criteriaWeights': data.get('criteriaWeights'),
            'criteriaCR': data.get('criteriaCR'),
            'alternativeWeights': data.get('alternativeWeights'),
            'alternativeCRs': data.get('alternativeCRs'),
            'globalScores': data.get('globalScores'),
            'bodyMetrics': body_metrics,
            'bodyIndices': body_indices,
            'timestamp': datetime.utcnow().isoformat()
        }

        result = collection.insert_one(save_data)
        return jsonify({
            'message': 'Kết quả đã được lưu thành công',
            'id': str(result.inserted_id),
            'bodyIndices': body_indices
        }), 200
    except Exception as e:
        return jsonify({'message': f'Lỗi khi lưu kết quả: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)