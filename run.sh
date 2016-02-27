PORT=8000
echo "Starting up at http://localhost:$PORT"
python -m SimpleHTTPServer $PORT > /dev/null
