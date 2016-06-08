zip -r weather-pointer.zip ./*
aws lambda update-function-code --function-name weather-pointer --zip-file fileb://weather-pointer.zip
aws lambda get-function --function-name "weather-pointer" --profile iot-team
rm weather-pointer.zip