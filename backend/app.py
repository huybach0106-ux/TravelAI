import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Khởi tạo Groq Client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
@app.route('/api/config')
def get_config():
    return jsonify({"mapbox_token": os.environ.get("MAPBOX_TOKEN")})
@app.route('/api/search', methods=['POST'])
def search_places():
    try:
        data = request.get_json()
        keyword = data.get('keyword', 'Hà Nội')
        
        # 1. Tách biệt System Prompt để định hình "tư duy" cho AI
        system_prompt = """Bạn là một chuyên gia địa lý và du lịch Việt Nam. 
Nhiệm vụ: Trích xuất thông tin địa danh chính xác tuyệt đối.
Quy tắc:
- 'location': Phải là địa chỉ đầy đủ (Số nhà, tên đường, phường, quận). Không được ghi chung chung.
- 'name': Tên tiếng Việt chuẩn theo Wikipedia.
- 'lat/lng': Phải là tọa độ thực tế (thập phân). 
- Chỉ trả về JSON, không giải thích."""

        # 2. Few-shot Prompting: Cho AI thấy 1 ví dụ mẫu để nó bắt chước theo
        user_prompt = f"""Tìm 6 địa điểm du lịch nổi tiếng tại {keyword}. 

Ví dụ mẫu cho 'Hà Nội':
{{
  "places": [
    {{
      "name": "Đền Ngọc Sơn",
      "lat": 21.0307,
      "lng": 105.8523,
      "rating": 4.6,
      "type": "Attraction",
      "location": "Đinh Tiên Hoàng, Hàng Trống, Hoàn Kiếm, Hà Nội"
    }}
  ]
}}

Hãy thực hiện cho từ khóa: {keyword}"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1 # Quan trọng: Để mức thấp để AI bớt "sáng tạo" địa chỉ bậy
        )

        res_data = json.loads(completion.choices[0].message.content)
        places = res_data.get('places', [])

        # 3. Xử lý dữ liệu đầu ra sạch sẽ
        valid_places = []
        for p in places:
            # Ưu tiên các key chuẩn, fallback nếu AI trả về tên khác
            lat = p.get('lat') or p.get('latitude')
            lng = p.get('lng') or p.get('longitude')
            name = p.get('name')
            loc = p.get('location')

            if lat and lng and name and loc:
                valid_places.append({
                    "name": name,
                    "lat": float(lat),
                    "lng": float(lng),
                    "rating": p.get('rating', 4.5),
                    "type": p.get('type', 'Tourist Attraction'),
                    "location": loc
                })

        return jsonify({
            "center": [valid_places[0]['lng'], valid_places[0]['lat']] if valid_places else [105.85, 21.02],
            "places": valid_places
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/guide', methods=['POST'])
def get_travel_guide():
    try:
        data = request.get_json()
        place_name = data.get('place_name')
        location = data.get('location')

        # Prompt ép AI viết bài hướng dẫn du lịch theo style chuyên nghiệp
        prompt = f"""
        Bạn là một chuyên gia du lịch chuyên nghiệp. 
        Hãy viết một bài hướng dẫn du lịch chi tiết và hấp dẫn cho địa điểm: {place_name} tại {location}.
        Yêu cầu nội dung bao gồm:
        1. Giới thiệu ngắn gọn về vẻ đẹp/đặc điểm nổi bật.
        2. Thời điểm lý tưởng nhất trong ngày/năm để ghé thăm.
        3. Cách di chuyển đến đây thuận tiện nhất.
        4. Một vài lưu ý quan trọng (trang phục, vé vào cửa, hoặc mẹo nhỏ).
        
        "Hãy trả về nội dung hoàn toàn bằng mã HTML. Dùng thẻ <h2> cho các tiêu đề chính. Dùng thẻ <ul> 
        và <li> để liệt kê gạch đầu dòng. Các Mẹo du lịch hoặc Lưu ý quan trọng hãy đặt trong thẻ <blockquote>
        để làm nổi bật. Đừng dùng Markdown, chỉ dùng HTML."
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7, # Để AI viết văn chương một chút
        )

        guide_content = completion.choices[0].message.content
        return jsonify({"guide": guide_content})

    except Exception as e:
        print(f"Lỗi AI Guide: {e}")
        return jsonify({"guide": "<p>Rất tiếc, AI đang bận chuẩn bị hành lý nên chưa viết kịp hướng dẫn cho địa điểm này!</p>"}), 500
@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    try:
        data = request.get_json()
        user_message = data.get('message', '')

        # "Bơm" nhân cách cho con AI
        system_prompt = """Bạn là TravelAI, một trợ lý du lịch ảo thông minh. 
        Nhiệm vụ của bạn là tư vấn lịch trình, giải đáp thắc mắc du lịch cực kỳ thân thiện và chuyên nghiệp bằng tiếng Việt.
        Trình bày dễ đọc, có ngắt dòng và dùng emoji cho sinh động."""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7
        )

        ai_response = completion.choices[0].message.content
        return jsonify({"response": ai_response})
    except Exception as e:
        print(f"Lỗi Chat: {e}")
        return jsonify({"response": "Xin lỗi sếp, mạng lưới nơ-ron của tôi đang hơi kẹt, thử lại sau vài giây nhé!"}), 500
if __name__ == '__main__':
    app.run(port=5000, debug=True)