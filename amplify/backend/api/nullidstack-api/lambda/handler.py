import json
import boto3
from faker import Faker
import pandas as pd
import regex as re
import io
import os

fake = Faker()

# Define regex patterns for sensitive data
SENSITIVE_PATTERNS = {
    'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    'credit_card': re.compile(r'\b(?:\d[ -]*?){13,16}\b'),
    'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    'phone_number': re.compile(r'\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b'),
    'drivers_license': re.compile(r'\b[A-Z]{1}-\d{7}\b'),
    'passport_number': re.compile(r'\b[A-Z]{1}\d{7}\b'),
    # Add more patterns as needed
}

def anonymize_text(text):
    """
    Replace sensitive information in the text with fake data.
    """
    if not isinstance(text, str):
        return text

    for key, pattern in SENSITIVE_PATTERNS.items():
        if key == 'ssn':
            replacement = fake.ssn()
        elif key == 'credit_card':
            replacement = fake.credit_card_number()
        elif key == 'email':
            replacement = fake.email()
        elif key == 'phone_number':
            replacement = fake.phone_number()
        elif key == 'drivers_license':
            replacement = fake.license_plate()  # Using license plate as placeholder
        elif key == 'passport_number':
            replacement = fake.bothify(text='A########')  # Example pattern
        else:
            replacement = '[REDACTED]'

        text = pattern.sub(replacement, text)
    return text

def process_json(data):
    """
    Anonymize sensitive fields in JSON data.
    """
    if isinstance(data, dict):
        return {k: anonymize_text(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_json(item) for item in data]
    else:
        return anonymize_text(data)

def process_csv(csv_content):
    """
    Anonymize sensitive fields in CSV data.
    """
    df = pd.read_csv(io.StringIO(csv_content))
    
    # Iterate over DataFrame columns and anonymize string columns
    for column in df.select_dtypes(include=['object']).columns:
        df[column] = df[column].apply(anonymize_text)
    
    return df.to_csv(index=False)

def send_error_notification(message):
    """
    Send error notifications via SNS.
    """
    sns_client = boto3.client('sns')
    error_topic_arn = os.getenv('ERROR_TOPIC_ARN')

    if error_topic_arn:
        try:
            sns_client.publish(
                TopicArn=error_topic_arn,
                Message=message,
                Subject='Lambda Function Error'
            )
            print("Error notification sent.")
        except Exception as sns_error:
            print(f"Failed to send SNS notification: {str(sns_error)}")
    else:
        print("ERROR_TOPIC_ARN environment variable not set. Skipping SNS notification.")

def handler(event, context):
    """
    Lambda handler to process incoming data, detect and anonymize sensitive information.
    Supports both JSON and CSV formats.
    """
    # Log the received event
    print("Received event:", json.dumps(event))
    
    # Initialize S3 client
    s3 = boto3.client('s3')

    # Assuming the event is triggered by S3 PUT operation
    for record in event.get('Records', []):
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']

        try:
            # Get the object from S3
            response = s3.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read().decode('utf-8')
            content_type = response.get('ContentType', '')
            
            print(f"Processing file: {key} with Content-Type: {content_type}")

            # Determine the file format
            if key.lower().endswith('.json'):
                data = json.loads(content)
                anonymized_data = process_json(data)
                output_content = json.dumps(anonymized_data, indent=2)
                output_key = f'anonymized/{os.path.splitext(os.path.basename(key))[0]}_anonymized.json'
            elif key.lower().endswith('.csv'):
                anonymized_data = process_csv(content)
                output_content = anonymized_data
                output_key = f'anonymized/{os.path.splitext(os.path.basename(key))[0]}_anonymized.csv'
            else:
                print(f"Unsupported file format for key: {key}. Skipping.")
                continue  # Skip unsupported formats

            # Upload the anonymized data back to S3
            s3.put_object(
                Bucket=bucket,
                Key=output_key,
                Body=output_content.encode('utf-8'),
                ContentType=response.get('ContentType', 'application/octet-stream')
            )

            print(f"Anonymized data uploaded to {output_key}")

        except Exception as e:
            error_message = f"Error processing object {key} from bucket {bucket}. Error: {str(e)}"
            print(error_message)
            send_error_notification(error_message)
            raise e

    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete.')
    }