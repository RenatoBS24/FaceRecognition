import base64
import json
def decode_image_base64(data):
    data_json = json.loads(data)
    data_url = data_json['image']
    header, encode = data_url.split(',',1)
    image_bytes = base64.b64decode(encode)
    return image_bytes