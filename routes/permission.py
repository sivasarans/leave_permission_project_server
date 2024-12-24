import os
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv  # To load environment variables from the .env file
import datetime

# Load environment variables from .env file
load_dotenv()

# Flask app setup
app = Flask(__name__)
CORS(app)

# Load PostgreSQL connection settings from environment variables
PG_USER = os.getenv('PG_USER', 'Sivasaran')
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_DATABASE = os.getenv('PG_DATABASE', 'Sivasaran')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')
PG_PORT = os.getenv('PG_PORT', 5432)

# Connect to PostgreSQL
try:
    conn = psycopg2.connect(
        dbname=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        host=PG_HOST,
        port=PG_PORT
    )
    cursor = conn.cursor()
    print("Connected to the database successfully!")
except Exception as e:
    print(f"Error connecting to the database: {e}")

# Permission route to fetch all permissions
@app.route('/permission', methods=['GET'])
def get_permissions():
    try:
        cursor.execute("SELECT * FROM permissions;")
        permissions = cursor.fetchall()

        # Convert the result to a list of dictionaries with proper handling for date and time
        permissions = [{
            'id': perm[0],
            'user_id': perm[1],
            'username': perm[2],
            'date': perm[3].isoformat() if isinstance(perm[3], (datetime.date, datetime.datetime)) else perm[3],
            'in_time': perm[4].strftime('%H:%M:%S') if isinstance(perm[4], datetime.time) else str(perm[4]),
            'out_time': perm[5].strftime('%H:%M:%S') if isinstance(perm[5], datetime.time) else str(perm[5]),
            'total_hours': perm[6],
            'status': perm[7],
        } for perm in permissions]

        return jsonify({'message': "Success", 'result': permissions}), 200
    except Exception as e:
        return jsonify({'message': "Failed to fetch permission data", 'error': str(e)}), 400

# Run the server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
