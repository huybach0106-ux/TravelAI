import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

# Khởi tạo Groq Client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.route('/api/search', methods=['POST'])
def search_places():
    try:
        data = request.get_json()
        keyword = data.get('keyword')
        
        # PROMPT MỚI: Ép AI trả địa chỉ chính xác tuyệt đối
        prompt = f"""
        Tìm 6 địa điểm du lịch nổi tiếng tại {keyword}. 
        YÊU CẦU BẮT BUỘC:
        1. Trường 'location' PHẢI LÀ ĐỊA CHỈ ĐƯỜNG THỰC TẾ VÀ CHÍNH XÁC (Ví dụ: Đền Ngọc Sơn phải là 'Đinh Tiên Hoàng, Hàng Trống, Hoàn Kiếm'). 
        2. TUYỆT ĐỐI KHÔNG được bịa địa chỉ, không được ghi lặp lại chung chung kiểu "Phố cổ, Hoàn Kiếm".
        3. Tên địa điểm ('name') phải là tên tiếng Việt chuẩn trên Wikipedia để hiển thị ảnh cho đúng.
        
        Trả về đúng định dạng JSON: 
        {{"places": [{{"name": "Tên chuẩn", "lat": 21.0, "lng": 105.0, "rating": 4.8, "type": "Attraction", "location": "Số nhà, Tên đường, Quận, Thành phố"}}]}}
        """
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        res_data = json.loads(completion.choices[0].message.content)
        places = res_data.get('places', [])

        # Kiểm tra an toàn để không bị lỗi 'lng'
        valid_places = []
        for p in places:
            lat = p.get('lat') or p.get('latitude')
            lng = p.get('lng') or p.get('longitude')
            if lat and lng:
                p['lat'] = lat
                p['lng'] = lng
                valid_places.append(p)

        return jsonify({
            "center": [valid_places[0]['lng'], valid_places[0]['lat']] if valid_places else None,
            "places": valid_places
        })
    except Exception as e:
        print(f"Lỗi: {e}")
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
        
        Lưu ý: Trả về nội dung bằng tiếng Việt. Hãy trình bày đẹp mắt bằng các thẻ HTML (h2, p, ul, li). 
        Không cần thẻ <html> hay <body>, chỉ cần nội dung bên trong.
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